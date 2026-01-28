import type { Package, UninstallPreview, UninstallResult, UninstallLog } from '../types/index.js';
import { PackageScannerService } from './scanner.js';

/**
 * 包清理服务
 * 负责预览和执行包卸载操作
 */
export class PackageCleanerService {
    constructor(private scanner: PackageScannerService) { }

    /**
     * 预览卸载操作
     */
    async previewUninstall(packages: Package[]): Promise<UninstallPreview> {
        let totalSize = 0;
        const affectedPackages: UninstallPreview['affectedPackages'] = [];
        const allDependencies = new Map();

        for (const pkg of packages) {
            totalSize += pkg.size;

            // 获取反向依赖
            const manager = this.scanner.getManager(pkg.manager);
            if (manager) {
                try {
                    const reverseDeps = await manager.getReverseDependencies(pkg.name);
                    for (const depName of reverseDeps) {
                        if (!packages.find((p) => p.name === depName)) {
                            const depPkg = await manager.getPackageInfo(depName);
                            if (depPkg) {
                                affectedPackages.push({
                                    package: depPkg,
                                    reason: `Depends on ${pkg.name}`,
                                    severity: 'warning',
                                });
                            }
                        }
                    }

                    // 获取依赖
                    const deps = await manager.getDependencies(pkg.name);
                    for (const dep of deps) {
                        allDependencies.set(dep.name, dep);
                    }
                } catch (error) {
                    console.error(`Failed to analyze ${pkg.name}:`, error);
                }
            }
        }

        const dependencies = Array.from(allDependencies.values());
        const dependenciesTotalSize = dependencies.reduce((sum, dep) => sum + dep.size, 0);

        return {
            packages,
            totalSize,
            affectedPackages,
            dependencies,
            dependenciesTotalSize,
        };
    }

    /**
     * 执行卸载操作
     */
    async executeUninstall(packages: Package[]): Promise<UninstallResult[]> {
        const results: UninstallResult[] = [];

        for (const pkg of packages) {
            const startTime = Date.now();
            const manager = this.scanner.getManager(pkg.manager);

            if (!manager) {
                results.push({
                    success: false,
                    package: pkg,
                    error: `Package manager not found: ${pkg.manager}`,
                    freedSpace: 0,
                    duration: 0,
                });
                continue;
            }

            try {
                await manager.uninstall(pkg.name);
                const duration = Date.now() - startTime;

                results.push({
                    success: true,
                    package: pkg,
                    freedSpace: pkg.size,
                    duration,
                });
            } catch (error) {
                const duration = Date.now() - startTime;
                results.push({
                    success: false,
                    package: pkg,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    freedSpace: 0,
                    duration,
                });
            }
        }

        return results;
    }

    /**
     * 生成卸载日志
     */
    generateLog(packages: Package[], results: UninstallResult[]): UninstallLog {
        const totalFreedSpace = results.reduce((sum, r) => sum + r.freedSpace, 0);
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        const successCount = results.filter((r) => r.success).length;
        const successRate = results.length > 0 ? (successCount / results.length) * 100 : 0;

        return {
            timestamp: new Date(),
            packages,
            results,
            totalFreedSpace,
            totalDuration,
            successRate,
        };
    }
}
