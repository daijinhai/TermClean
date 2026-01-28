import { promises as fs } from 'fs';
import path from 'path';

/**
 * 计算目录大小
 * @param dirPath - 目录路径
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
        const stat = await fs.stat(dirPath);

        if (stat.isFile()) {
            return stat.size;
        }

        if (stat.isDirectory()) {
            const files = await fs.readdir(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                try {
                    const fileSize = await getDirectorySize(filePath);
                    totalSize += fileSize;
                } catch {
                    // 忽略无法访问的文件
                    continue;
                }
            }
        }
    } catch {
        // 目录不存在或无法访问
        return 0;
    }

    return totalSize;
}

/**
 * 检查路径是否存在
 * @param filePath - 文件路径
 */
export async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * 确保目录存在
 * @param dirPath - 目录路径
 */
export async function ensureDir(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
            throw error;
        }
    }
}
