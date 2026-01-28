import { NpmPackageManager } from './npm.js';

/**
 * pnpm包管理器适配器
 * 继承自npm,因为API非常相似
 */
export class PnpmPackageManager extends NpmPackageManager {
    readonly name = 'pnpm';
    protected readonly commandName = 'pnpm';

    async uninstall(packageName: string): Promise<void> {
        try {
            await this.execute(['remove', '-g', packageName]);
        } catch (error) {
            throw new Error(`Failed to uninstall ${packageName}: ${error}`);
        }
    }
}
