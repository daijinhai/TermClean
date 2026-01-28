import { BasePackageManager } from './base.js';
import type { Package, Dependency, DependencyType } from '../types/index.js';
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
                manager: 'pip',
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

    async getDependencies(packageName: string): Promise<Dependency[]> {
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

    async getReverseDependencies(packageName: string): Promise<string[]> {
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
            manager: 'pip',
            installPath,
            size: 0,
            dependenciesSize: 0,
            installedDate,
            modifiedDate,
            description: '', // 后续异步加载
            isGlobal,
        };
    }
}
