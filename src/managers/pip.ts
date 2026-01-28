import { BasePackageManager } from './base.js';
import type { Package, Dependency, DependencyType } from '../types/index.js';
import { parseLines } from '../utils/command.js';
import { getDirectorySize } from '../utils/path.js';
import path from 'path';
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
            const args = ['list', '--format=json'];
            if (!globalOnly) {
                args.push('--user');
            }

            const output = await this.execute(args);
            const data = JSON.parse(output);

            for (const item of data) {
                const pkg = await this.buildPackageInfo(item.name, item.version, globalOnly);
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

    private async buildPackageInfo(name: string, version: string, isGlobal: boolean): Promise<Package | null> {
        const sitePackages = isGlobal
            ? '/usr/local/lib/python3.12/site-packages'
            : path.join(os.homedir(), '.local/lib/python3.12/site-packages');

        const installPath = path.join(sitePackages, name);
        const size = await getDirectorySize(installPath);

        return {
            name,
            version,
            manager: 'pip',
            installPath,
            size,
            dependenciesSize: 0,
            installedDate: new Date(),
            modifiedDate: new Date(),
            isGlobal,
        };
    }
}
