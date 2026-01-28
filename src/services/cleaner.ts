import type { Package, UninstallPreview, UninstallResult, UninstallLog } from '../types/index.js';
import { PackageScannerService } from './scanner.js';

/**
 * 包清理服务
 * 负责预览和执行包卸载操作
 */
export class PackageCleanerService {
    constructor(private scanner: PackageScannerService) { }

    /**
     * 预览卸载操作（简化版：不进行耗时的依赖分析，实现即时响应）
     */
    async previewUninstall(packages: Package[]): Promise<UninstallPreview> {
        let totalSize = 0;

        for (const pkg of packages) {
            totalSize += pkg.size;
        }

        // 简化：不获取反向依赖和依赖分析（太慢）
        // 直接返回包列表，让用户快速确认
        return {
            packages,
            totalSize,
            affectedPackages: [],
            dependencies: [],
            dependenciesTotalSize: 0,
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
