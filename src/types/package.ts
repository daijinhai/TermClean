/**
 * 包管理器类型
 */
export enum PackageManagerType {
    BREW = 'brew',
    BREW_CASK = 'brew-cask',
    NPM = 'npm',
    PNPM = 'pnpm',
    YARN = 'yarn',
    PIP = 'pip',
}

/**
 * 包信息
 */
export interface Package {
    /** 包名 */
    name: string;
    /** 版本号 */
    version: string;
    /** 包管理器类型 */
    manager: PackageManagerType;
    /** 安装路径 */
    installPath: string;
    /** 主软件大小(字节) */
    size: number;
    /** 依赖占用大小(字节) */
    dependenciesSize: number;
    /** 安装日期 */
    installedDate: Date;
    /** 最后修改日期 */
    modifiedDate: Date;
    /** 描述 */
    description?: string;
    /** 是否是开发依赖 */
    isDev?: boolean;
    /** 是否是全局安装 */
    isGlobal?: boolean;
    /** 最新版本 */
    latestVersion?: string;
    /** 是否有更新 */
    updateAvailable?: boolean;
    /** 是否正在检查更新 */
    isChecking?: boolean;
}

/**
 * 依赖关系类型
 */
export enum DependencyType {
    /** 直接依赖 */
    DIRECT = 'direct',
    /** 间接依赖(传递依赖) */
    INDIRECT = 'indirect',
    /** 可选依赖 */
    OPTIONAL = 'optional',
    /** 开发依赖 */
    DEV = 'dev',
}

/**
 * 依赖信息
 */
export interface Dependency {
    /** 依赖包名 */
    name: string;
    /** 依赖版本 */
    version: string;
    /** 依赖类型 */
    type: DependencyType;
    /** 是否为共享依赖(被多个包依赖) */
    isShared: boolean;
    /** 依赖此包的包列表 */
    usedBy: string[];
    /** 大小(字节) */
    size: number;
}

/**
 * 依赖树节点
 */
export interface DependencyTreeNode {
    /** 包名 */
    name: string;
    /** 版本 */
    version: string;
    /** 依赖类型 */
    type: DependencyType;
    /** 是否共享 */
    isShared: boolean;
    /** 子依赖 */
    children: DependencyTreeNode[];
    /** 深度 */
    depth: number;
}

/**
 * 卸载预览信息
 */
export interface UninstallPreview {
    /** 要卸载的包列表 */
    packages: Package[];
    /** 总释放空间(字节) */
    totalSize: number;
    /** 受影响的包(依赖这些包的其他包) */
    affectedPackages: Array<{
        package: Package;
        reason: string;
        severity: 'warning' | 'error';
    }>;
    /** 将被移除的依赖(仅展示,不会删除) */
    dependencies: Dependency[];
    /** 依赖总大小(字节) */
    dependenciesTotalSize: number;
}

/**
 * 卸载结果
 */
export interface UninstallResult {
    /** 是否成功 */
    success: boolean;
    /** 卸载的包 */
    package: Package;
    /** 错误信息 */
    error?: string;
    /** 释放的空间(字节) */
    freedSpace: number;
    /** 耗时(毫秒) */
    duration: number;
}

/**
 * 卸载日志
 */
export interface UninstallLog {
    /** 时间戳 */
    timestamp: Date;
    /** 卸载的包列表 */
    packages: Package[];
    /** 卸载结果 */
    results: UninstallResult[];
    /** 总释放空间 */
    totalFreedSpace: number;
    /** 总耗时 */
    totalDuration: number;
    /** 成功率 */
    successRate: number;
}

/**
 * 升级预览信息
 */
export interface UpgradePreview {
    /** 要升级的包 */
    package: Package;
    /** 当前版本 */
    currentVersion: string;
    /** 目标版本 */
    targetVersion: string;
    /** 变更类型 */
    changeType: 'major' | 'minor' | 'patch' | 'unknown';
    /** 预估下载大小(字节) */
    estimatedSize?: number;
    /** 潜在风险 */
    risks: Array<{
        level: 'low' | 'medium' | 'high';
        message: string;
    }>;
    /** 变更日志URL */
    changelogUrl?: string;
}

/**
 * 升级结果
 */
export interface UpgradeResult {
    /** 是否成功 */
    success: boolean;
    /** 升级的包 */
    package: Package;
    /** 原版本 */
    fromVersion: string;
    /** 新版本 */
    toVersion: string;
    /** 错误信息 */
    error?: string;
    /** 耗时(毫秒) */
    duration: number;
    /** 下载大小(字节) */
    downloadedSize?: number;
}

/**
 * 批量升级结果
 */
export interface BatchUpgradeResult {
    /** 时间戳 */
    timestamp: Date;
    /** 升级的包列表 */
    packages: Package[];
    /** 升级结果 */
    results: UpgradeResult[];
    /** 总耗时 */
    totalDuration: number;
    /** 成功率 */
    successRate: number;
    /** 总下载大小 */
    totalDownloadedSize: number;
}
