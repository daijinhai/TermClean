# term-clean API设计文档

**版本**: v1.0  
**日期**: 2026-01-28

---

## 1. 包管理器接口

### 1.1 IPackageManager

所有包管理器必须实现的统一接口。

```typescript
interface IPackageManager {
  /**
   * 获取包管理器名称
   * @returns 包管理器名称,例如 "Homebrew", "npm"
   */
  getName(): string;

  /**
   * 检查包管理器是否可用
   * @returns 是否已安装且可用
   */
  isAvailable(): Promise<boolean>;

  /**
   * 列出所有已安装的包
   * @returns 包列表
   * @throws {CommandNotFoundError} 包管理器未安装
   * @throws {PermissionDeniedError} 权限不足
   */
  listPackages(): Promise<Package[]>;

  /**
   * 获取指定包的详细信息
   * @param name - 包名
   * @returns 包信息,不存在返回null
   */
  getPackageInfo(name: string): Promise<Package | null>;

  /**
   * 获取指定包的依赖列表
   * @param name - 包名
   * @returns 依赖列表
   */
  getDependencies(name: string): Promise<Dependency[]>;

  /**
   * 计算指定包的磁盘占用(字节)
   * @param name - 包名
   * @returns 磁盘占用大小
   */
  calculateSize(name: string): Promise<number>;

  /**
   * 卸载指定包
   * @param name - 包名
   * @returns 卸载结果
   */
  uninstall(name: string): Promise<UninstallResult>;
}

interface UninstallResult {
  success: boolean;
  message: string;
}
```

---

## 2. 服务层API

### 2.1 PackageScannerService

负责扫描和收集包信息。

```typescript
class PackageScannerService {
  constructor(managers: IPackageManager[]);

  /**
   * 扫描所有可用的包管理器
   * @returns 所有已安装的包
   * @throws {ServiceError} 扫描失败
   */
  async scanAll(): Promise<Package[]>;

  /**
   * 扫描指定类型的包管理器
   * @param managerName - 包管理器名称
   * @returns 该包管理器的包列表
   */
  async scanByManager(managerName: string): Promise<Package[]>;

  /**
   * 刷新包列表
   * @returns 更新后的包列表
   */
  async refresh(): Promise<Package[]>;
}
```

### 2.2 DependencyAnalyzerService

负责依赖关系分析。

```typescript
class DependencyAnalyzerService {
  /**
   * 构建依赖关系图
   * @param packages - 包列表
   * @returns 依赖图 Map<包名, 依赖此包的包列表>
   */
  buildDependencyGraph(packages: Package[]): Map<string, string[]>;

  /**
   * 分析依赖类型(独占/共享)
   * @param packages - 包列表
   * @returns 依赖类型映射
   */
  analyzeDependencyTypes(packages: Package[]): Map<string, Dependency>;

  /**
   * 构建依赖树(用于UI展示)
   * @param pkg - 根包
   * @param allPackages - 所有包
   * @returns 依赖树根节点
   */
  buildDependencyTree(
    pkg: Package,
    allPackages: Package[]
  ): DependencyTreeNode;

  /**
   * 获取受影响的包
   * @param pkgName - 包名
   * @param dependencyGraph - 依赖图
   * @returns 依赖此包的包名列表
   */
  getAffectedPackages(
    pkgName: string,
    dependencyGraph: Map<string, string[]>
  ): string[];

  /**
   * 检测循环依赖
   * @param packages - 包列表
   * @returns 循环依赖链数组
   */
  detectCircularDependencies(packages: Package[]): string[][];
}
```

### 2.3 DiskUsageCalculatorService

负责磁盘空间计算。

```typescript
class DiskUsageCalculatorService {
  /**
   * 计算单个包的大小信息
   * @param pkg - 包对象
   * @param dependencies - 依赖映射
   * @returns 大小信息
   */
  async calculatePackageSize(
    pkg: Package,
    dependencies: Map<string, Dependency>
  ): Promise<PackageSize>;

  /**
   * 批量计算包大小(并发优化)
   * @param packages - 包列表
   * @returns 包名到大小的映射
   */
  async calculateBatchSizes(
    packages: Package[]
  ): Promise<Map<string, PackageSize>>;

  /**
   * 格式化大小显示
   * @param bytes - 字节数
   * @param precision - 小数位数,默认2位
   * @returns 人类可读格式,例如 "1.23 GB"
   */
  formatSize(bytes: number, precision?: number): string;

  /**
   * 计算总大小
   * @param packages - 包列表
   * @returns 总字节数
   */
  calculateTotalSize(packages: Package[]): number;
}
```

### 2.4 PackageCleanerService

负责卸载操作。

```typescript
class PackageCleanerService {
  constructor(managers: IPackageManager[]);

  /**
   * 预览卸载影响
   * @param packages - 要卸载的包
   * @returns 预览结果
   */
  async previewUninstall(packages: Package[]): Promise<UninstallPreview>;

  /**
   * 执行卸载
   * @param packages - 要卸载的包
   * @param managers - 包管理器列表
   * @returns 执行结果
   */
  async executeUninstall(
    packages: Package[],
    managers: IPackageManager[]
  ): Promise<UninstallExecutionResult>;

  /**
   * 生成卸载日志
   * @param result - 执行结果
   * @param format - 输出格式 'json' | 'markdown'
   * @returns 日志字符串
   */
  generateUninstallLog(
    result: UninstallExecutionResult,
    format?: 'json' | 'markdown'
  ): string;
}

interface UninstallPreview {
  /** 要删除的包列表 */
  packages: Package[];
  /** 受影响的包(依赖这些包的其他包) */
  affectedPackages: string[];
  /** 将释放的总空间(字节) */
  totalSize: number;
  /** 警告信息 */
  warnings: string[];
}

interface UninstallExecutionResult {
  /** 是否全部成功 */
  success: boolean;
  /** 成功卸载的包名 */
  succeeded: string[];
  /** 失败的包及原因 */
  failed: Array<{ name: string; reason: string }>;
  /** 执行时间(毫秒) */
  duration: number;
}
```

---

## 3. 状态管理API

### 3.1 AppStore (zustand)

全局应用状态。

```typescript
interface AppState {
  // ========== 数据状态 ==========
  
  /** 所有包列表 */
  packages: Package[];
  
  /** 过滤后的包列表 */
  filteredPackages: Package[];
  
  /** 已选中的包 */
  selectedPackages: Package[];
  
  /** 依赖图缓存 */
  dependencyGraph: Map<string, string[]> | null;

  // ========== UI状态 ==========
  
  /** 当前标签页 */
  currentTab: PackageManagerType | 'all';
  
  /** 搜索关键词 */
  searchQuery: string;
  
  /** 是否加载中 */
  isLoading: boolean;
  
  /** 当前视图 */
  currentView: 'list' | 'detail' | 'preview';
  
  /** 详情页选中的包 */
  selectedPackageForDetail: Package | null;
  
  /** 排序字段 */
  sortBy: 'name' | 'size' | 'date';
  
  /** 排序顺序 */
  sortOrder: 'asc' | 'desc';
  
  /** 错误信息 */
  error: string | null;

  // ========== Actions ==========
  
  /**
   * 设置包列表
   */
  setPackages: (packages: Package[]) => void;
  
  /**
   * 切换包的选中状态
   */
  togglePackageSelection: (pkgName: string) => void;
  
  /**
   * 全选/全不选
   */
  toggleSelectAll: () => void;
  
  /**
   * 设置搜索关键词
   */
  setSearchQuery: (query: string) => void;
  
  /**
   * 切换标签页
   */
  setCurrentTab: (tab: PackageManagerType | 'all') => void;
  
  /**
   * 设置排序
   */
  setSortBy: (sortBy: 'name' | 'size' | 'date') => void;
  
  /**
   * 切换排序顺序
   */
  toggleSortOrder: () => void;
  
  /**
   * 切换视图
   */
  setCurrentView: (view: 'list' | 'detail' | 'preview') => void;
  
  /**
   * 选择包查看详情
   */
  selectPackageForDetail: (pkg: Package | null) => void;
  
  /**
   * 设置加载状态
   */
  setLoading: (isLoading: boolean) => void;
  
  /**
   * 设置错误信息
   */
  setError: (error: string | null) => void;
  
  /**
   * 刷新包列表
   */
  refresh: () => Promise<void>;
}

// 使用示例
const useAppStore = create<AppState>((set, get) => ({ ... }));

// 在组件中使用
const packages = useAppStore((state) => state.packages);
const setPackages = useAppStore((state) => state.setPackages);
```

---

## 4. 工具函数API

### 4.1 命令执行工具

```typescript
/**
 * 执行shell命令
 * @param command - 命令
 * @param args - 参数数组
 * @param options - 执行选项
 * @returns 执行结果
 */
async function executeCommand(
  command: string,
  args: string[],
  options?: ExecuteOptions
): Promise<CommandResult>;

interface ExecuteOptions {
  /** 工作目录 */
  cwd?: string;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 超时时间(毫秒) */
  timeout?: number;
}

interface CommandResult {
  /** 标准输出 */
  stdout: string;
  /** 标准错误 */
  stderr: string;
  /** 退出码 */
  exitCode: number;
  /** 是否成功 */
  success: boolean;
}
```

### 4.2 格式化工具

```typescript
/**
 * 格式化大小
 */
function formatSize(bytes: number, precision?: number): string;

/**
 * 格式化日期
 */
function formatDate(date: Date, format?: string): string;

/**
 * 格式化持续时间
 */
function formatDuration(ms: number): string;

/**
 * 高亮搜索关键词
 */
function highlightMatch(text: string, query: string): string;
```

### 4.3 验证工具

```typescript
/**
 * 验证包名格式
 */
function isValidPackageName(name: string): boolean;

/**
 * 验证路径
 */
function isValidPath(path: string): boolean;

/**
 * 检查命令是否存在
 */
async function commandExists(command: string): Promise<boolean>;
```

---

## 5. 类型定义

### 5.1 核心类型

详细类型定义见 `src/types/` 目录:

- `package.ts`: Package、PackageSize、PackageManagerType
- `dependency.ts`: Dependency、DependencyType、DependencyTreeNode
- `manager.ts`: IPackageManager、UninstallResult
- `error.ts`: 自定义错误类型

---

## 6. CLI入口API

### 6.1 命令行参数

```bash
# 启动TUI
term-clean

# 仅扫描指定包管理器
term-clean --manager brew
term-clean --manager npm,pip

# 直接执行命令(非交互)
term-clean list                    # 列出所有包
term-clean list --manager brew     # 列出brew包
term-clean info <package>          # 查看包详情
term-clean deps <package>          # 查看依赖树
term-clean clean <package>         # 卸载包(需确认)
term-clean clean <pkg1> <pkg2>     # 批量卸载

# 其他选项
term-clean --version               # 查看版本
term-clean --help                  # 帮助信息
```

### 6.2 导出功能

```bash
# 导出包列表
term-clean export packages.json

# 导出清理计划
term-clean export --preview plan.md
```

---

## 7. 事件系统

### 7.1 事件定义

```typescript
type AppEvent =
  | { type: 'SCAN_START' }
  | { type: 'SCAN_PROGRESS'; payload: { current: number; total: number } }
  | { type: 'SCAN_COMPLETE'; payload: { packages: Package[] } }
  | { type: 'UNINSTALL_PROGRESS'; payload: { current: number; total: number } }
  | { type: 'UNINSTALL_COMPLETE'; payload: UninstallExecutionResult }
  | { type: 'ERROR'; payload: { message: string } };

/**
 * 事件发射器
 */
class EventEmitter {
  on(event: AppEvent['type'], handler: (payload: any) => void): void;
  off(event: AppEvent['type'], handler: (payload: any) => void): void;
  emit(event: AppEvent): void;
}
```

---

## 8. 错误代码

### 8.1 错误码定义

```typescript
enum ErrorCode {
  // 1xxx: 包管理器错误
  MANAGER_NOT_FOUND = 1001,
  MANAGER_VERSION_INCOMPATIBLE = 1002,
  
  // 2xxx: 权限错误
  PERMISSION_DENIED = 2001,
  
  // 3xxx: 解析错误
  PARSE_ERROR = 3001,
  JSON_PARSE_ERROR = 3002,
  
  // 4xxx: 业务错误
  PACKAGE_NOT_FOUND = 4001,
  CIRCULAR_DEPENDENCY = 4002,
  UNINSTALL_FAILED = 4003,
  
  // 5xxx: 系统错误
  UNKNOWN_ERROR = 5000,
}
```

---

**文档版本**: v1.0  
**维护者**: Development Team
