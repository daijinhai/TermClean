import type { Package, Dependency, DependencyTreeNode } from './package.js';

/**
 * 包管理器接口
 */
export interface IPackageManager {
    /**
     * 包管理器名称
     */
    readonly name: string;

    /**
     * 检查包管理器是否可用
     */
    isAvailable(): Promise<boolean>;

    /**
     * 列出所有已安装的包
     * @param globalOnly - 仅列出全局包
     */
    listPackages(globalOnly?: boolean): Promise<Package[]>;

    /**
     * 获取包详细信息
     * @param packageName - 包名
     */
    getPackageInfo(packageName: string): Promise<Package | null>;

    /**
     * 获取包的依赖列表
     * @param packageName - 包名
     */
    getDependencies(packageName: string): Promise<Dependency[]>;

    /**
     * 构建依赖树
     * @param packageName - 包名
     */
    buildDependencyTree(packageName: string): Promise<DependencyTreeNode>;

    /**
     * 计算包大小
     * @param packageName - 包名
     */
    calculateSize(packageName: string): Promise<number>;

    /**
     * 卸载包
     * @param packageName - 包名
     */
    uninstall(packageName: string): Promise<void>;

    /**
     * 获取反向依赖(哪些包依赖此包)
     * @param packageName - 包名
     */
    getReverseDependencies(packageName: string): Promise<string[]>;
}
