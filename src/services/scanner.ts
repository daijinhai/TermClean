import type { Package, IPackageManager, PackageManagerType } from '../types/index.js';
import {
    BrewPackageManager,
    NpmPackageManager,
    PnpmPackageManager,
    YarnPackageManager,
    PipPackageManager,
} from '../managers/index.js';

/**
 * 包扫描服务
 * 负责扫描所有包管理器的已安装包
 */
export class PackageScannerService {
    private managers: Map<PackageManagerType, IPackageManager>;

    constructor() {
        this.managers = new Map();
        this.managers.set('brew', new BrewPackageManager());
        this.managers.set('npm', new NpmPackageManager());
        this.managers.set('pnpm', new PnpmPackageManager());
        this.managers.set('yarn', new YarnPackageManager());
        this.managers.set('pip', new PipPackageManager());
    }

    /**
     * 扫描所有可用的包管理器
     */
    async scanAll(): Promise<Package[]> {
        const allPackages: Package[] = [];

        for (const [type, manager] of this.managers.entries()) {
            try {
                const isAvailable = await manager.isAvailable();
                if (isAvailable) {
                    const packages = await manager.listPackages();
                    allPackages.push(...packages);
                }
            } catch (error) {
                console.error(`Failed to scan ${type}:`, error);
            }
        }

        return allPackages;
    }

    /**
     * 扫描指定包管理器
     */
    async scanByManager(managerType: PackageManagerType): Promise<Package[]> {
        const manager = this.managers.get(managerType);
        if (!manager) {
            throw new Error(`Unknown package manager: ${managerType}`);
        }

        const isAvailable = await manager.isAvailable();
        if (!isAvailable) {
            throw new Error(`Package manager not available: ${managerType}`);
        }

        return await manager.listPackages();
    }

    /**
     * 获取包管理器实例
     */
    getManager(managerType: PackageManagerType): IPackageManager | undefined {
        return this.managers.get(managerType);
    }

    /**
     * 获取所有可用的包管理器
     */
    async getAvailableManagers(): Promise<PackageManagerType[]> {
        const available: PackageManagerType[] = [];

        for (const [type, manager] of this.managers.entries()) {
            if (await manager.isAvailable()) {
                available.push(type);
            }
        }

        return available;
    }
}
