import { NpmPackageManager } from './npm.js';
import type { Package } from '../types/index.js';

/**
 * yarn包管理器适配器
 */
export class YarnPackageManager extends NpmPackageManager {
    readonly name = 'yarn';
    protected readonly commandName = 'yarn';

    async listPackages(globalOnly: boolean = true): Promise<Package[]> {
        if (!globalOnly) {
            return super.listPackages(false);
        }

        const packages: Package[] = [];
        try {
            const output = await this.execute(['global', 'list', '--json']);
            const lines = output.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.type === 'tree' && data.data?.trees) {
                        for (const tree of data.data.trees) {
                            const [name, version] = tree.name.split('@');
                            if (name) {
                                const pkg = await this.buildPackageInfo(name, version || 'unknown', true);
                                if (pkg) packages.push(pkg);
                            }
                        }
                    }
                } catch {
                    continue;
                }
            }
        } catch (error) {
            console.error('Failed to list yarn packages:', error);
        }

        return packages;
    }

    async uninstall(packageName: string): Promise<void> {
        try {
            await this.execute(['global', 'remove', packageName]);
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
                // Yarn 升级到指定版本
                await this.execute(['global', 'add', `${packageName}@${version}`]);
            } else {
                // Yarn 升级到最新版本
                await this.execute(['global', 'upgrade', packageName]);
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
            const output = await this.execute(['info', packageName, 'version']);
            return output.trim() || null;
        } catch (error) {
            console.error(`Failed to get latest version for ${packageName}:`, error);
            return null;
        }
    }

    private async buildPackageInfo(name: string, version: string, isGlobal: boolean): Promise<Package | null> {
        // Simplified version, full implementation would get path and size
        return {
            name,
            version,
            manager: 'yarn',
            installPath: '',
            size: 0,
            dependenciesSize: 0,
            installedDate: new Date(),
            modifiedDate: new Date(),
            isGlobal,
        };
    }
}
