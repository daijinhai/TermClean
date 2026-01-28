import { execa } from 'execa';

/**
 * 执行shell命令
 * @param command - 命令
 * @param args - 参数
 * @param options - 选项
 */
export async function executeCommand(
    command: string,
    args: string[] = [],
    options: { cwd?: string; timeout?: number } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
        const result = await execa(command, args, {
            cwd: options.cwd || process.cwd(),
            timeout: options.timeout || 30000, // 30秒超时
            reject: false, // 不抛出异常,返回结果
        });

        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode || 0,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to execute command: ${command} ${args.join(' ')}\n${error.message}`);
        }
        throw error;
    }
}

/**
 * 检查命令是否可用
 * @param command - 命令名称
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
    try {
        const result = await execa('which', [command], { reject: false });
        return result.exitCode === 0;
    } catch {
        return false;
    }
}

/**
 * 解析命令输出为行数组
 * @param output - 命令输出
 */
export function parseLines(output: string): string[] {
    return output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}
