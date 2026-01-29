import { NpmPackageManager } from './npm.js';
import type { Package } from '../types/index.js';
import fs from 'fs/promises';

/**
 * pnpm包管理器适配器
 * 继承自npm,因为API非常相似
 */
export class PnpmPackageManager extends NpmPackageManager {
    readonly name = 'pnpm';
    protected readonly commandName = 'pnpm';

    async listPackages(globalOnly: boolean = true): Promise<Package[]> {
        const packages: Package[] = [];

        try {
            // pnpm list -g --json --depth=0 返回的是数组
            const args = globalOnly ? ['list', '-g', '--json', '--depth=0'] : ['list', '--json', '--depth=0'];
            const output = await this.execute(args);
            const data = JSON.parse(output);

            // 兼容数组格式
            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
                if (item.dependencies) {
                    for (const [name, info] of Object.entries(item.dependencies as Record<string, any>)) {
                        const pkg = await this.buildPackageFromInfo(name, info, globalOnly);
                        if (pkg) {
                            packages.push(pkg);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to list pnpm packages:', error);
        }

        return packages;
    }

    // 覆盖 buildPackageFromInfo 以确保 manager 字段正确
    protected async buildPackageFromInfo(
        name: string,
        info: any,
        isGlobal: boolean
    ): Promise<Package | null> {
        // 调用父类方法获取基础结构，然后修改 manager
        const installPath = await this.getPackagePath(name, isGlobal);

        // 获取真实文件时间
        let installedDate = new Date();
        let modifiedDate = new Date();
        try {
            const stats = await fs.stat(installPath);
            installedDate = stats.birthtime;
            modifiedDate = stats.mtime;
        } catch (e) {
            // ignore
        }

        return {
            name,
            version: info.version || 'unknown',
            manager: 'pnpm',
            installPath,
            size: 0,
            dependenciesSize: 0,
            installedDate,
            modifiedDate,
            description: '',
            isDev: false,
            isGlobal,
        };
    }

    async uninstall(packageName: string): Promise<void> {
        try {
            await this.execute(['remove', '-g', packageName]);
        } catch (error) {
            throw new Error(`Failed to uninstall ${packageName}: ${error}`);
        }
    }

    /**
     * 升级包到最新版本或指定版本
     */
    async upgrade(packageName: string, version?: string): Promise<void> {
        try {
            if (version) {
                // PNPM 升级到指定版本
                await this.execute(['add', '-g', `${packageName}@${version}`]);
            } else {
                // PNPM 升级到最新版本
                await this.execute(['update', '-g', packageName]);
            }
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
}
