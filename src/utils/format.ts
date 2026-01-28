/**
 * 格式化字节大小为人类可读格式
 * @param bytes - 字节数
 * @param decimals - 小数位数
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * 格式化日期
 * @param date - 日期对象
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 格式化时长
 * @param ms - 毫秒数
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

/**
 * 截断字符串
 * @param str - 字符串
 * @param maxLength - 最大长度
 */
export function truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength - 3)}...`;
}
