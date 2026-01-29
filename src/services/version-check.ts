import { Package, PackageManagerType } from '../types/package.js';
import { BasePackageManager } from '../managers/base.js';
import { NpmPackageManager } from '../managers/npm.js';
import { PipPackageManager } from '../managers/pip.js';
import { BrewPackageManager } from '../managers/brew.js';
import { YarnPackageManager } from '../managers/yarn.js';
import { PnpmPackageManager } from '../managers/pnpm.js';
import { configService } from './config.js';

export class VersionCheckService {
    private managers: Map<PackageManagerType, BasePackageManager>;
    private readonly CONCURRENT_LIMIT = 5;

    constructor() {
        this.managers = new Map();
        // 初始化管理器实例
        // 注意：这里需要确保使用的实例与 ScannerService 中使用的是同一类实例，
        // 或者新建实例也没关系，因为它们是无状态的（除了配置）
        this.managers.set(PackageManagerType.NPM, new NpmPackageManager());
        this.managers.set(PackageManagerType.YARN, new YarnPackageManager());
        this.managers.set(PackageManagerType.PNPM, new PnpmPackageManager());
        this.managers.set(PackageManagerType.PIP, new PipPackageManager());
        this.managers.set(PackageManagerType.BREW, new BrewPackageManager());
        this.managers.set(PackageManagerType.BREW_CASK, new BrewPackageManager()); // BrewCask 使用 BrewManager 处理
    }

    /**
     * 检查单个包的更新
     */
    async checkPackage(pkg: Package): Promise<{ latestVersion: string; updateAvailable: boolean } | null> {
        // 1. 检查配置是否允许检查
        if (!configService.shouldCheckUpdates) {
            return null;
        }

        // 2. 检查该包是否被忽略
        if (configService.isPackageIgnored(pkg.name)) {
            return null;
        }

        // 3. 获取对应的管理器
        const manager = this.managers.get(pkg.manager);
        if (!manager) {
            return null;
        }

        try {
            const latestVersion = await manager.getLatestVersion(pkg.name);
            if (!latestVersion) {
                return null;
            }

            // 简单的版本比较逻辑 (不使用 semver 库以减少依赖，如果需要更精确比较可以引入 semver)
            const updateAvailable = latestVersion !== pkg.version;

            return {
                latestVersion,
                updateAvailable
            };
        } catch (error) {
            console.error(`Failed to check version for ${pkg.name}:`, error);
            return null;
        }
    }

    /**
     * 批量检查包更新
     * @param packages 包列表
     * @param onUpdate 回调函数，每完成一个包的检查调用一次
     */
    async checkAll(packages: Package[], onUpdate: (pkg: Package, result: { latestVersion: string; updateAvailable: boolean }) => void): Promise<void> {
        // 只检查被监控的包（不再检查所有包）
        const packagesToCheck = packages.filter(p => configService.isPackageWatched(p.name));

        // 分批处理以限制并发
        for (let i = 0; i < packagesToCheck.length; i += this.CONCURRENT_LIMIT) {
            const batch = packagesToCheck.slice(i, i + this.CONCURRENT_LIMIT);
            await Promise.all(batch.map(async (pkg) => {
                const result = await this.checkPackage(pkg);
                if (result) {
                    onUpdate(pkg, result);
                }
            }));
        }

        // 更新最后检查时间
        configService.setLastCheckTime(Date.now());
    }
}

export const versionCheckService = new VersionCheckService();
