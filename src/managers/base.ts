import type {
    IPackageManager,
    Package,
    Dependency,
    DependencyTreeNode,
    DependencyType,
} from '../types/index.js';
import { executeCommand, isCommandAvailable } from '../utils/command.js';
import { getDirectorySize } from '../utils/path.js';

/**
 * 包管理器基类
 * 实现了IPackageManager接口的通用逻辑
 */
export abstract class BasePackageManager implements IPackageManager {
    abstract readonly name: string;
    protected abstract readonly commandName: string;

    /**
     * 检查包管理器是否可用
     */
    async isAvailable(): Promise<boolean> {
        return await isCommandAvailable(this.commandName);
    }

    /**
     * 列出所有已安装的包
     */
    abstract listPackages(globalOnly?: boolean): Promise<Package[]>;

    /**
     * 获取包详细信息
     */
    abstract getPackageInfo(packageName: string): Promise<Package | null>;

    /**
     * 获取包的依赖列表
     */
    abstract getDependencies(packageName: string): Promise<Dependency[]>;

    /**
     * 构建依赖树
     */
    async buildDependencyTree(packageName: string): Promise<DependencyTreeNode> {
        const dependencies = await this.getDependencies(packageName);
        const pkg = await this.getPackageInfo(packageName);

        if (!pkg) {
            throw new Error(`Package not found: ${packageName}`);
        }

        // 递归构建依赖树
        const buildTree = async (
            depName: string,
            depVersion: string,
            depType: DependencyType,
            isShared: boolean,
            depth: number,
            visited: Set<string> = new Set()
        ): Promise<DependencyTreeNode> => {
            const key = `${depName}@${depVersion}`;

            // 防止循环依赖
            if (visited.has(key)) {
                return {
                    name: depName,
                    version: depVersion,
                    type: depType,
                    isShared,
                    children: [],
                    depth,
                };
            }

            visited.add(key);

            const children: DependencyTreeNode[] = [];

            // 只递归到一定深度,避免过深
            if (depth < 3) {
                try {
                    const subDeps = await this.getDependencies(depName);
                    for (const subDep of subDeps) {
                        const childNode = await buildTree(
                            subDep.name,
                            subDep.version,
                            subDep.type,
                            subDep.isShared,
                            depth + 1,
                            new Set(visited)
                        );
                        children.push(childNode);
                    }
                } catch {
                    // 忽略子依赖获取失败
                }
            }

            return {
                name: depName,
                version: depVersion,
                type: depType,
                isShared,
                children,
                depth,
            };
        };

        // 构建根节点
        const children: DependencyTreeNode[] = [];
        for (const dep of dependencies) {
            const childNode = await buildTree(dep.name, dep.version, dep.type, dep.isShared, 1);
            children.push(childNode);
        }

        return {
            name: pkg.name,
            version: pkg.version,
            type: DependencyType.DIRECT,
            isShared: false,
            children,
            depth: 0,
        };
    }

    /**
     * 计算包大小
     */
    async calculateSize(packageName: string): Promise<number> {
        const pkg = await this.getPackageInfo(packageName);
        if (!pkg) {
            return 0;
        }
        return await getDirectorySize(pkg.installPath);
    }

    /**
     * 卸载包
     */
    abstract uninstall(packageName: string): Promise<void>;

    /**
     * 升级包到最新版本或指定版本
     */
    abstract upgrade(packageName: string, version?: string): Promise<void>;

    /**
     * 获取包的最新版本
     */
    abstract getLatestVersion(packageName: string): Promise<string | null>;

    /**
     * 获取反向依赖
     */
    abstract getReverseDependencies(packageName: string): Promise<string[]>;

    /**
     * 执行命令(受保护的辅助方法)
     */
    protected async execute(args: string[], options?: { cwd?: string }): Promise<string> {
        const result = await executeCommand(this.commandName, args, options);

        if (result.exitCode !== 0) {
            throw new Error(`Command failed: ${this.commandName} ${args.join(' ')}\n${result.stderr}`);
        }

        return result.stdout;
    }
}
