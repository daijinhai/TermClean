import { BasePackageManager } from './base.js';
import type { Package, Dependency, PackageManagerType, DependencyType } from '../types/index.js';
import { parseLines } from '../utils/command.js';
import { getDirectorySize, pathExists } from '../utils/path.js';
import path from 'path';

/**
 * Homebrew包管理器适配器
 */
export class BrewPackageManager extends BasePackageManager {
    readonly name = 'Homebrew';
    protected readonly commandName = 'brew';

    /**
     * 列出所有已安装的包
     */
    async listPackages(globalOnly: boolean = false): Promise<Package[]> {
        const packages: Package[] = [];

        try {
            // 获取formula包列表
            const formulaOutput = await this.execute(['list', '--formula', '-1']);
            const formulaNames = parseLines(formulaOutput);

            for (const name of formulaNames) {
                try {
                    const pkg = await this.getPackageInfo(name);
                    if (pkg) {
                        packages.push(pkg);
                    }
                } catch (error) {
                    // 忽略单个包的错误,继续扫描其他包
                    console.error(`Skipping package ${name}:`, error instanceof Error ? error.message : 'Unknown error');
                }
            }

            // 获取cask包列表(GUI应用)
            if (!globalOnly) {
                try {
                    const caskOutput = await this.execute(['list', '--cask', '-1']);
                    const caskNames = parseLines(caskOutput);

                    for (const name of caskNames) {
                        try {
                            const pkg = await this.getPackageInfo(name, true);
                            if (pkg) {
                                packages.push(pkg);
                            }
                        } catch (error) {
                            // 忽略单个包的错误
                            console.error(`Skipping cask package ${name}:`, error instanceof Error ? error.message : 'Unknown error');
                        }
                    }
                } catch {
                    // Cask可能不可用,忽略
                }
            }
        } catch (error) {
            console.error('Failed to list brew packages:', error);
        }

        return packages;
    }

    /**
     * 获取包详细信息
     */
    async getPackageInfo(packageName: string, isCask: boolean = false): Promise<Package | null> {
        try {
            const infoArgs = isCask
                ? ['info', '--cask', '--json=v2', packageName]
                : ['info', '--formula', '--json=v2', packageName];

            const output = await this.execute(infoArgs);
            const data = JSON.parse(output);

            const pkgData = isCask ? data.casks?.[0] : data.formulae?.[0];
            if (!pkgData) {
                return null;
            }

            // 确定安装路径
            let installPath = '';
            if (isCask) {
                // Cask应用通常在 /Applications
                installPath = `/Applications/${pkgData.token || packageName}.app`;
            } else {
                // Formula包在Cellar
                const brewPrefix = await this.getBrewPrefix();
                installPath = path.join(brewPrefix, 'Cellar', packageName, pkgData.versions?.stable || '');
            }

            // 检查路径是否存在
            const exists = await pathExists(installPath);
            if (!exists && !isCask) {
                // 尝试其他可能的路径
                const brewPrefix = await this.getBrewPrefix();
                const altPath = path.join(brewPrefix, 'opt', packageName);
                if (await pathExists(altPath)) {
                    installPath = altPath;
                }
            }

            // 计算包大小
            const size = await getDirectorySize(installPath);

            // 获取依赖并计算依赖大小
            const dependencies = await this.getDependencies(packageName);
            let dependenciesSize = 0;
            for (const dep of dependencies) {
                dependenciesSize += dep.size;
            }

            const manager: PackageManagerType = isCask ? 'brew-cask' : 'brew';

            return {
                name: packageName,
                version: pkgData.versions?.stable || pkgData.version || 'unknown',
                manager,
                installPath,
                size,
                dependenciesSize,
                installedDate: new Date(), // Brew不提供安装日期,使用当前时间
                modifiedDate: new Date(),
                description: pkgData.desc || pkgData.description || '',
                isDev: false,
                isGlobal: true,
            };
        } catch (error) {
            console.error(`Failed to get brew package info for ${packageName}:`, error);
            return null;
        }
    }

    /**
     * 获取包的依赖列表
     */
    async getDependencies(packageName: string): Promise<Dependency[]> {
        const dependencies: Dependency[] = [];

        try {
            // 获取依赖信息
            const depsOutput = await this.execute(['deps', '--tree', packageName]);
            const lines = parseLines(depsOutput);

            // 解析依赖
            const depNames = new Set<string>();
            for (const line of lines) {
                // 移除树形结构符号
                const match = line.match(/[├└─│\s]*([a-z0-9@._-]+)/i);
                if (match && match[1] && match[1] !== packageName) {
                    depNames.add(match[1]);
                }
            }

            // 获取每个依赖的详细信息
            for (const depName of depNames) {
                try {
                    const depInfo = await this.getPackageInfo(depName);
                    if (depInfo) {
                        // 检查是否为共享依赖
                        const reverseDeps = await this.getReverseDependencies(depName);
                        const isShared = reverseDeps.length > 1;

                        dependencies.push({
                            name: depName,
                            version: depInfo.version,
                            type: 'direct' as DependencyType,
                            isShared,
                            usedBy: reverseDeps,
                            size: depInfo.size,
                        });
                    }
                } catch (error) {
                    // 忽略单个依赖的错误,继续处理其他依赖
                    console.error(`Skipping dependency ${depName}:`, error instanceof Error ? error.message : 'Unknown error');
                }
            }
        } catch {
            // 有些包没有依赖或者获取失败
        }

        return dependencies;
    }

    /**
     * 卸载包
     */
    async uninstall(packageName: string): Promise<void> {
        try {
            await this.execute(['uninstall', packageName]);
        } catch (error) {
            throw new Error(`Failed to uninstall ${packageName}: ${error}`);
        }
    }

    /**
     * 获取反向依赖
     */
    async getReverseDependencies(packageName: string): Promise<string[]> {
        try {
            const output = await this.execute(['uses', '--installed', packageName]);
            return parseLines(output);
        } catch {
            return [];
        }
    }

    /**
     * 获取Homebrew前缀路径
     */
    private async getBrewPrefix(): Promise<string> {
        try {
            const output = await this.execute(['--prefix']);
            return output.trim();
        } catch {
            // 默认路径
            return process.arch === 'arm64' ? '/opt/homebrew' : '/usr/local';
        }
    }
}
