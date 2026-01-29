import { BasePackageManager } from './base.js';
import type { Package, Dependency, PackageManagerType, DependencyType } from '../types/index.js';
import { parseLines } from '../utils/command.js';
import { getDirectorySize, pathExists } from '../utils/path.js';
import path from 'path';
import fs from 'fs/promises';

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
            const brewPrefix = await this.getBrewPrefix();

            // 1. 获取用户主动安装的包列表 (过滤掉依赖)
            const requestedOutput = await this.execute(['list', '--installed-on-request', '-1']);
            const requestedList = parseLines(requestedOutput);

            // 2. 分批并行获取详细信息
            // 相比之前查询所有 (--installed) 几百个包，这里只查询用户安装的几十个包
            const batchSize = 25;
            const formulaBatches = [];
            for (let i = 0; i < requestedList.length; i += batchSize) {
                formulaBatches.push(requestedList.slice(i, i + batchSize));
            }

            const allFormulae: any[] = [];
            await Promise.all(formulaBatches.map(async (batch) => {
                if (batch.length === 0) return;
                try {
                    // 只查询需要的包，显著减少 JSON 大小和生成时间
                    const output = await this.execute(['info', '--formula', '--json=v2', ...batch]);
                    const data = JSON.parse(output);
                    if (data.formulae) allFormulae.push(...data.formulae);
                } catch (e) {
                    console.error('Batch info fetch failed:', e);
                }
            }));

            // 3. 并行处理文件系统检查 (消除 IO 瓶颈)
            const processedFormulae = await Promise.all(allFormulae.map(async (pkgData) => {
                const name = pkgData.name;
                const version = pkgData.versions?.stable || pkgData.installed?.[0]?.version || 'unknown';
                const desc = pkgData.desc || '';

                let installPath = path.join(brewPrefix, 'Cellar', name, version);
                let installedDate = new Date();

                // 并行检查路径和日期
                try {
                    if (!(await pathExists(installPath))) {
                        const optPath = path.join(brewPrefix, 'opt', name);
                        if (await pathExists(optPath)) installPath = optPath;
                    }

                    if (await pathExists(installPath)) {
                        const stat = await fs.stat(installPath);
                        installedDate = stat.mtime;
                    }
                } catch { }

                return {
                    name,
                    version,
                    manager: 'brew' as PackageManagerType,
                    installPath,
                    size: 0,
                    dependenciesSize: 0,
                    installedDate,
                    modifiedDate: installedDate,
                    description: desc,
                    isDev: false,
                    isGlobal: true,
                };
            }));
            packages.push(...processedFormulae);

            // 4. 处理 Cask (同样并行化)
            if (!globalOnly) {
                try {
                    const caskListOutput = await this.execute(['list', '--cask', '-1']);
                    const caskList = parseLines(caskListOutput);

                    if (caskList.length > 0) {
                        const caskBatches = [];
                        for (let i = 0; i < caskList.length; i += batchSize) {
                            caskBatches.push(caskList.slice(i, i + batchSize));
                        }

                        const allCasks: any[] = [];
                        await Promise.all(caskBatches.map(async (batch) => {
                            try {
                                const output = await this.execute(['info', '--cask', '--json=v2', ...batch]);
                                const data = JSON.parse(output);
                                if (data.casks) allCasks.push(...data.casks);
                            } catch (e) { }
                        }));

                        packages.push(...allCasks.map(pkg => ({
                            name: pkg.token,
                            version: pkg.version || 'unknown',
                            manager: 'brew-cask' as PackageManagerType,
                            installPath: `/Applications/${pkg.name?.[0] || pkg.token}.app`,
                            size: 0,
                            dependenciesSize: 0,
                            installedDate: new Date(),
                            modifiedDate: new Date(),
                            description: pkg.desc || '',
                            isDev: false,
                            isGlobal: true,
                        })));
                    }
                } catch { }
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
     * 升级包到最新版本或指定版本
     */
    async upgrade(packageName: string, version?: string): Promise<void> {
        try {
            if (version) {
                // Homebrew 不直接支持升级到指定版本
                // 需要先卸载当前版本，然后安装指定版本
                await this.execute(['unlink', packageName]);
                await this.execute(['install', `${packageName}@${version}`]);
                await this.execute(['link', `${packageName}@${version}`, '--force']);
            } else {
                // 升级到最新版本
                await this.execute(['upgrade', packageName]);
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
            const output = await this.execute(['info', '--json=v2', packageName]);
            const data = JSON.parse(output);

            // 尝试从formulae获取
            if (data.formulae && data.formulae.length > 0) {
                return data.formulae[0].versions?.stable || null;
            }

            // 尝试从casks获取
            if (data.casks && data.casks.length > 0) {
                return data.casks[0].version || null;
            }

            return null;
        } catch (error) {
            console.error(`Failed to get latest version for ${packageName}:`, error);
            return null;
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
