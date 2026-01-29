import { BasePackageManager } from './base.js';
import type { Package, Dependency, DependencyType } from '../types/index.js';
import { PackageManagerType } from '../types/index.js';
import { getDirectorySize } from '../utils/path.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

/**
 * npm包管理器适配器
 */
export class NpmPackageManager extends BasePackageManager {
    readonly name: string = 'npm';
    protected readonly commandName: string = 'npm';

    async listPackages(globalOnly: boolean = true): Promise<Package[]> {
        const packages: Package[] = [];

        try {
            const args = globalOnly ? ['list', '-g', '--json', '--depth=0'] : ['list', '--json', '--depth=0'];
            const output = await this.execute(args);
            const data = JSON.parse(output);

            if (data.dependencies) {
                for (const [name, info] of Object.entries(data.dependencies as Record<string, any>)) {
                    const pkg = await this.buildPackageFromInfo(name, info, globalOnly);
                    if (pkg) {
                        packages.push(pkg);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to list npm packages:', error);
        }

        return packages;
    }

    async getPackageInfo(packageName: string): Promise<Package | null> {
        try {
            const output = await this.execute(['list', '-g', '--json', packageName]);
            const data = JSON.parse(output);

            if (data.dependencies?.[packageName]) {
                return await this.buildPackageFromInfo(packageName, data.dependencies[packageName], true);
            }
        } catch {
            // Package not found
        }

        return null;
    }

    async getDependencies(packageName: string): Promise<Dependency[]> {
        const dependencies: Dependency[] = [];

        try {
            const output = await this.execute(['list', '-g', '--json', packageName]);
            const data = JSON.parse(output);

            const pkgData = data.dependencies?.[packageName];
            if (pkgData?.dependencies) {
                for (const [depName, depInfo] of Object.entries(pkgData.dependencies as Record<string, any>)) {
                    const installPath = await this.getPackagePath(depName, true);
                    const size = await getDirectorySize(installPath);

                    dependencies.push({
                        name: depName,
                        version: depInfo.version || 'unknown',
                        type: 'direct' as DependencyType,
                        isShared: false,
                        usedBy: [packageName],
                        size,
                    });
                }
            }
        } catch {
            // No dependencies or failed
        }

        return dependencies;
    }

    async uninstall(packageName: string): Promise<void> {
        try {
            await this.execute(['uninstall', '-g', packageName]);
        } catch (error) {
            throw new Error(`Failed to uninstall ${packageName}: ${error}`);
        }
    }

    /**
     * 升级包到最新版本或指定版本
     */
    async upgrade(packageName: string, version?: string): Promise<void> {
        try {
            const targetVersion = version ? `${packageName}@${version}` : `${packageName}@latest`;
            await this.execute(['install', '-g', targetVersion]);
        } catch (error) {
            throw new Error(`Failed to upgrade ${packageName}: ${error}`);
        }
    }

    /**
     * 获取包的最新版本
     */
    async getLatestVersion(packageName: string): Promise<string | null> {
        try {
            const output = await this.execute(['view', packageName, 'version']);
            return output.trim() || null;
        } catch (error) {
            console.error(`Failed to get latest version for ${packageName}:`, error);
            return null;
        }
    }

    async getReverseDependencies(_packageName: string): Promise<string[]> {
        // npm doesn't provide easy reverse dependency lookup
        return [];
    }

    protected async buildPackageFromInfo(
        name: string,
        info: any,
        isGlobal: boolean
    ): Promise<Package | null> {
        const installPath = await this.getPackagePath(name, isGlobal);

        // 获取真实文件时间
        let installedDate = new Date();
        let modifiedDate = new Date();
        try {
            const stats = await fs.stat(installPath);
            installedDate = stats.birthtime;
            modifiedDate = stats.mtime;
        } catch (e) {
            // ignore error, fallback to now
        }

        // 描述改为异步加载，启动时不获取（太慢，需要网络请求）
        return {
            name,
            version: info.version || 'unknown',
            manager: PackageManagerType.NPM,
            installPath,
            size: 0,
            dependenciesSize: 0,
            installedDate,
            modifiedDate,
            description: '', // 后续异步加载
            isDev: false,
            isGlobal,
            isChecking: true, // 标记为检查中，等待异步更新
        };
    }

    protected async getPackagePath(packageName: string, isGlobal: boolean): Promise<string> {
        if (isGlobal) {
            try {
                const output = await this.execute(['root', '-g']);
                return path.join(output.trim(), packageName);
            } catch {
                // Fallback
                return path.join(os.homedir(), '.npm-global', 'lib', 'node_modules', packageName);
            }
        }

        return path.join(process.cwd(), 'node_modules', packageName);
    }
}
