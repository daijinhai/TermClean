import { BasePackageManager } from './base.js';
import type { Package, Dependency } from '../types/index.js';
import { PackageManagerType } from '../types/index.js';
import { parseLines } from '../utils/command.js';
import { getDirectorySize } from '../utils/path.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

/**
 * pip包管理器适配器
 */
export class PipPackageManager extends BasePackageManager {
    readonly name = 'pip';
    protected readonly commandName = 'pip3';

    async listPackages(globalOnly: boolean = true): Promise<Package[]> {
        const packages: Package[] = [];

        try {
            // 使用 --not-required 只显示没有被其他包依赖的包
            // 使用 -v 获取 Location 字段
            const args = ['list', '--format=json', '--not-required', '-v'];
            if (!globalOnly) {
                args.push('--user');
            }

            const output = await this.execute(args);
            const data = JSON.parse(output);

            for (const item of data) {
                // item 包含 { name, version, location, installer }
                const pkg = await this.buildPackageInfo(item.name, item.version, item.location, globalOnly);
                if (pkg) {
                    packages.push(pkg);
                }
            }
        } catch (error) {
            console.error('Failed to list pip packages:', error);
        }

        return packages;
    }

    async getPackageInfo(packageName: string): Promise<Package | null> {
        try {
            const output = await this.execute(['show', packageName]);
            const lines = parseLines(output);

            let version = 'unknown';
            let location = '';

            for (const line of lines) {
                if (line.startsWith('Version:')) {
                    version = line.split(':')[1]?.trim() || 'unknown';
                } else if (line.startsWith('Location:')) {
                    location = line.split(':')[1]?.trim() || '';
                }
            }

            if (!location) return null;

            const installPath = path.join(location, packageName);
            const size = await getDirectorySize(installPath);

            return {
                name: packageName,
                version,
                manager: PackageManagerType.PIP,
                installPath,
                size,
                dependenciesSize: 0,
                installedDate: new Date(),
                modifiedDate: new Date(),
                isGlobal: true,
            };
        } catch {
            return null;
        }
    }

    async getDependencies(_packageName: string): Promise<Dependency[]> {
        // pip doesn't easily expose dependency info
        return [];
    }

    async uninstall(packageName: string): Promise<void> {
        try {
            await this.execute(['uninstall', '-y', packageName]);
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
                // 升级到指定版本
                await this.execute(['install', '--upgrade', `${packageName}==${version}`]);
            } else {
                // 升级到最新版本
                await this.execute(['install', '--upgrade', packageName]);
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
            // 使用 pip index versions 获取最新版本
            const output = await this.execute(['index', 'versions', packageName]);
            const lines = parseLines(output);

            // 输出格式类似: "package-name (1.0.0)"
            // Available versions: 1.0.0, 0.9.0, ...
            for (const line of lines) {
                if (line.includes('Available versions:')) {
                    const versions = line.split(':')[1]?.trim().split(',').map(v => v.trim());
                    if (versions && versions.length > 0) {
                        return versions[0] ?? null; // 第一个是最新版本
                    }
                }
            }

            return null;
        } catch (error) {
            // 静默处理"包不存在"错误（某些包可能来自conda、GitHub等非PyPI源）
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (!errorMsg.includes('No matching distribution found')) {
                // 只报告非预期错误
                console.error(`Failed to get latest version for ${packageName}:`, error);
            }
            return null;
        }
    }

    async getReverseDependencies(_packageName: string): Promise<string[]> {
        return [];
    }

    private async buildPackageInfo(name: string, version: string, location: string, isGlobal: boolean): Promise<Package | null> {
        // 使用实际返回的 location，而不是硬编码的 sitePackages
        let installPath: string;
        if (location) {
            installPath = path.join(location, name);
        } else {
            // Fallback logic if location is missing (unlikely with -v)
            const sitePackages = isGlobal
                ? '/usr/local/lib/python3.12/site-packages'
                : path.join(os.homedir(), '.local/lib/python3.12/site-packages');
            installPath = path.join(sitePackages, name);
        }

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

        // 描述改为异步加载，启动时不获取（太慢）
        return {
            name,
            version,
            manager: PackageManagerType.PIP,
            installPath,
            size: 0,
            dependenciesSize: 0,
            installedDate,
            modifiedDate,
            description: '', // 后续异步加载
            isGlobal,
            isChecking: true, // 标记为检查中，等待异步更新
        };
    }
}
