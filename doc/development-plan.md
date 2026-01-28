# term-clean 开发计划 (Development Plan)

**版本**: v1.0  
**日期**: 2026-01-28  
**技术栈**: TypeScript + Node.js + ink + React  
**目标平台**: macOS 12.0+

---

## 1. 项目概述

### 1.1 产品定位
Mac平台的命令行包管理清理工具(TUI),用于可视化管理和清理通过brew/npm/pnpm/yarn/pip安装的软件包。

### 1.2 核心价值
- **发现与识别**: 统一查看所有包管理器安装的包
- **空间分析**: 精确计算磁盘占用(区分主软件和依赖)
- **安全卸载**: 预览模式展示影响,避免误删
- **依赖可视化**: 交互式展示依赖关系树

### 1.3 关键技术决策

#### 为什么选择 TypeScript + ink?
1. **对标Claude Code CLI**: 使用相同技术栈,开发体验一致
2. **React组件化**: 声明式UI,代码复用性强
3. **类型安全**: TypeScript提供完整的类型检查
4. **生态成熟**: ink有丰富的第三方组件库

#### 核心技术选型
| 层级 | 技术 | 理由 |
|------|------|------|
| 语言 | TypeScript 5.x | 类型安全、现代语法 |
| TUI框架 | ink 4.x | React风格、组件化 |
| 状态管理 | zustand | 轻量、简洁 |
| CLI工具 | commander | 成熟的命令行参数解析 |
| 子进程 | execa | 现代化API、Promise支持 |
| 文件系统 | fs-extra | Promise API |
| 测试框架 | vitest | 快速、现代化 |
| 构建工具 | tsup | 零配置TypeScript打包 |

---

## 2. 系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PackageList  │  │DependencyTree│  │PreviewModal  │      │
│  │   (ink)      │  │   (ink)      │  │   (ink)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  AppStore    │  │   Scanner    │  │  Analyzer    │      │
│  │  (zustand)   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PackageRepo  │  │  Calculator  │  │   Cleaner    │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Brew    │  │   NPM    │  │   Yarn   │  │   Pip    │   │
│  │ Manager  │  │ Manager  │  │ Manager  │  │ Manager  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
term-clean/
├── src/
│   ├── cli.tsx                    # CLI入口
│   ├── app.tsx                    # ink根组件
│   │
│   ├── components/                # UI组件层
│   │   ├── PackageList.tsx        # 包列表组件
│   │   ├── PackageListItem.tsx    # 列表项组件
│   │   ├── DependencyTree.tsx     # 依赖树组件
│   │   ├── PreviewModal.tsx       # 预览弹窗组件
│   │   ├── StatusBar.tsx          # 状态栏组件
│   │   ├── SearchBar.tsx          # 搜索栏组件
│   │   ├── TabBar.tsx             # 标签页组件
│   │   └── ProgressIndicator.tsx  # 进度指示器
│   │
│   ├── managers/                  # 包管理器适配层
│   │   ├── base.ts                # 抽象基类
│   │   ├── brew.ts                # Homebrew适配器
│   │   ├── npm.ts                 # NPM适配器
│   │   ├── pnpm.ts                # PNPM适配器
│   │   ├── yarn.ts                # Yarn适配器
│   │   ├── pip.ts                 # Pip适配器
│   │   └── index.ts               # 统一导出
│   │
│   ├── services/                  # 业务逻辑层
│   │   ├── scanner.ts             # 包扫描服务
│   │   ├── analyzer.ts            # 依赖分析服务
│   │   ├── calculator.ts          # 空间计算服务
│   │   ├── cleaner.ts             # 卸载执行服务
│   │   └── logger.ts              # 日志服务
│   │
│   ├── stores/                    # 状态管理
│   │   └── app-store.ts           # 全局应用状态
│   │
│   ├── types/                     # TypeScript类型定义
│   │   ├── index.ts               # 统一导出
│   │   ├── package.ts             # Package相关类型
│   │   ├── dependency.ts          # Dependency相关类型
│   │   └── manager.ts             # Manager相关类型
│   │
│   ├── utils/                     # 工具函数
│   │   ├── command.ts             # 命令执行工具
│   │   ├── format.ts              # 格式化工具
│   │   ├── path.ts                # 路径工具
│   │   └── validation.ts          # 验证工具
│   │
│   └── constants/                 # 常量定义
│       └── index.ts
│
├── tests/                         # 测试文件
│   ├── unit/                      # 单元测试
│   ├── integration/               # 集成测试
│   └── fixtures/                  # 测试数据
│
├── doc/                           # 文档目录
│   ├── development-plan.md        # 本文档
│   ├── architecture.md            # 架构设计文档
│   ├── api-design.md              # API设计文档
│   └── testing-strategy.md        # 测试策略文档
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

---

## 3. 核心模块设计

### 3.1 类型系统设计

#### 文件: `src/types/package.ts`

```typescript
/**
 * 包管理器类型枚举
 */
export enum PackageManagerType {
  BREW_FORMULA = 'brew-formula',
  BREW_CASK = 'brew-cask',
  NPM = 'npm',
  PNPM = 'pnpm',
  YARN = 'yarn',
  PIP_GLOBAL = 'pip-global',
  PIP_USER = 'pip-user',
}

/**
 * 包大小信息
 */
export interface PackageSize {
  /** 主软件大小(字节) */
  main: number;
  /** 依赖总大小(字节,仅展示用) */
  dependencies: number;
  /** 独占依赖大小(字节) */
  exclusiveDeps: number;
  /** 共享依赖大小(字节) */
  sharedDeps: number;
  /** 总大小(字节) */
  total: number;
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
  /** 大小信息 */
  size: PackageSize;
  /** 安装路径 */
  installPath: string;
  /** 安装时间 */
  installedDate: Date | null;
  /** 最后修改时间 */
  lastModified: Date | null;
  /** 是否被选中(UI状态) */
  isSelected: boolean;
  /** 依赖列表(仅存储直接依赖名称) */
  dependencies: string[];
}
```

#### 文件: `src/types/dependency.ts`

```typescript
/**
 * 依赖类型
 */
export enum DependencyType {
  /** 独占依赖(仅一个包使用) */
  EXCLUSIVE = 'exclusive',
  /** 共享依赖(多个包共享) */
  SHARED = 'shared',
}

/**
 * 依赖信息
 */
export interface Dependency {
  /** 依赖包名 */
  name: string;
  /** 版本号 */
  version: string;
  /** 依赖类型 */
  type: DependencyType;
  /** 哪些包依赖此包(反向依赖) */
  dependents: string[];
  /** 大小(字节) */
  size: number;
}

/**
 * 依赖树节点
 */
export interface DependencyTreeNode {
  name: string;
  version: string;
  type: DependencyType;
  size: number;
  children: DependencyTreeNode[];
  /** 是否展开(UI状态) */
  isExpanded: boolean;
}
```

#### 文件: `src/types/manager.ts`

```typescript
import { Package, Dependency } from './index';

/**
 * 包管理器抽象接口
 */
export interface IPackageManager {
  /**
   * 获取包管理器名称
   */
  getName(): string;

  /**
   * 检查包管理器是否可用
   */
  isAvailable(): Promise<boolean>;

  /**
   * 列出所有已安装的包
   */
  listPackages(): Promise<Package[]>;

  /**
   * 获取指定包的详细信息
   */
  getPackageInfo(name: string): Promise<Package | null>;

  /**
   * 获取指定包的依赖列表
   */
  getDependencies(name: string): Promise<Dependency[]>;

  /**
   * 计算指定包的磁盘占用
   */
  calculateSize(name: string): Promise<number>;

  /**
   * 卸载指定包
   */
  uninstall(name: string): Promise<{ success: boolean; message: string }>;
}
```

### 3.2 包管理器适配层

#### 文件: `src/managers/base.ts`

```typescript
import { IPackageManager } from '../types/manager';
import { Package, Dependency } from '../types';

/**
 * 包管理器抽象基类
 */
export abstract class BasePackageManager implements IPackageManager {
  abstract getName(): string;
  abstract isAvailable(): Promise<boolean>;
  abstract listPackages(): Promise<Package[]>;
  abstract getPackageInfo(name: string): Promise<Package | null>;
  abstract getDependencies(name: string): Promise<Dependency[]>;
  abstract calculateSize(name: string): Promise<number>;
  abstract uninstall(name: string): Promise<{ success: boolean; message: string }>;

  /**
   * 执行shell命令的通用方法
   */
  protected async executeCommand(
    command: string,
    args: string[]
  ): Promise<{ stdout: string; stderr: string }> {
    // 使用execa执行命令
    // 实现细节在EXECUTE阶段
  }

  /**
   * 解析JSON输出
   */
  protected parseJSON<T>(output: string): T | null {
    try {
      return JSON.parse(output);
    } catch {
      return null;
    }
  }
}
```

#### 文件: `src/managers/brew.ts`

```typescript
import { BasePackageManager } from './base';
import { Package, PackageManagerType } from '../types';

/**
 * Homebrew包管理器适配器
 * 支持Formula和Cask
 */
export class BrewPackageManager extends BasePackageManager {
  getName(): string {
    return 'Homebrew';
  }

  async isAvailable(): Promise<boolean> {
    // 执行: brew --version
    // 返回是否成功
  }

  async listPackages(): Promise<Package[]> {
    // 1. 执行: brew list --formula --versions
    // 2. 执行: brew list --cask --versions
    // 3. 解析输出,构造Package对象数组
    // 4. 并发获取每个包的详细信息
  }

  async getPackageInfo(name: string): Promise<Package | null> {
    // 执行: brew info --json=v2 --formula <name>
    // 或: brew info --json=v2 --cask <name>
    // 解析JSON,返回Package对象
  }

  async getDependencies(name: string): Promise<Dependency[]> {
    // 从brew info的JSON中提取dependencies字段
    // 构造Dependency对象数组
  }

  async calculateSize(name: string): Promise<number> {
    // 1. 获取包路径: $(brew --prefix)/Cellar/<name>/<ver>
    // 2. 执行: du -sk <path>
    // 3. 解析输出,返回字节数
  }

  async uninstall(name: string): Promise<{ success: boolean; message: string }> {
    // 执行: brew uninstall <name>
    // 或: brew uninstall --cask <name>
    // 返回执行结果
  }
}
```

#### 文件: `src/managers/npm.ts`

```typescript
import { BasePackageManager } from './base';
import { Package, PackageManagerType } from '../types';

/**
 * NPM包管理器适配器
 */
export class NpmPackageManager extends BasePackageManager {
  getName(): string {
    return 'npm';
  }

  async isAvailable(): Promise<boolean> {
    // 执行: npm --version
  }

  async listPackages(): Promise<Package[]> {
    // 执行: npm ls -g --depth=0 --json
    // 解析JSON,构造Package数组
  }

  async getDependencies(name: string): Promise<Dependency[]> {
    // 1. 获取全局根目录: npm root -g
    // 2. 读取: <root>/<name>/package.json
    // 3. 提取dependencies字段
  }

  async calculateSize(name: string): Promise<number> {
    // 1. 获取包路径: <npm-root>/<name>
    // 2. 执行: du -sk <path>
  }

  async uninstall(name: string): Promise<{ success: boolean; message: string }> {
    // 执行: npm -g uninstall <name>
  }
}
```

> **注**: pnpm.ts、yarn.ts、pip.ts结构类似,根据各自的CLI命令调整实现

### 3.3 业务逻辑层

#### 文件: `src/services/scanner.ts`

```typescript
import { Package } from '../types';
import { IPackageManager } from '../types/manager';

/**
 * 包扫描服务
 * 负责从所有包管理器收集已安装的包
 */
export class PackageScannerService {
  private managers: IPackageManager[];

  constructor(managers: IPackageManager[]) {
    this.managers = managers;
  }

  /**
   * 扫描所有包管理器,收集包列表
   */
  async scanAll(): Promise<Package[]> {
    // 1. 检查每个manager是否可用
    // 2. 并发调用listPackages()
    // 3. 合并结果
    // 4. 返回完整的包列表
  }

  /**
   * 扫描指定类型的包管理器
   */
  async scanByManager(managerName: string): Promise<Package[]> {
    // 找到对应的manager并调用listPackages()
  }
}
```

#### 文件: `src/services/analyzer.ts`

```typescript
import { Package, Dependency, DependencyTreeNode } from '../types';

/**
 * 依赖分析服务
 * 负责构建依赖关系图和分析依赖类型
 */
export class DependencyAnalyzerService {
  /**
   * 构建依赖关系图
   * @returns Map<包名, 依赖此包的包列表>
   */
  buildDependencyGraph(packages: Package[]): Map<string, string[]> {
    // 1. 遍历所有包
    // 2. 对每个包的dependencies,记录反向依赖关系
    // 3. 返回依赖图
  }

  /**
   * 分析依赖类型(独占/共享)
   */
  analyzeDependencyTypes(packages: Package[]): Map<string, Dependency> {
    // 1. 构建依赖图
    // 2. 统计每个依赖被引用的次数
    // 3. 引用次数=1为独占,>1为共享
  }

  /**
   * 构建依赖树(用于UI展示)
   */
  buildDependencyTree(pkg: Package, allPackages: Package[]): DependencyTreeNode {
    // 1. 以pkg为根节点
    // 2. 递归构建子节点(pkg的dependencies)
    // 3. 标记每个节点的type(独占/共享)
    // 4. 返回树结构
  }

  /**
   * 获取受影响的包(删除某个包会影响谁)
   */
  getAffectedPackages(pkgName: string, dependencyGraph: Map<string, string[]>): string[] {
    // 从依赖图中查找dependents
  }
}
```

#### 文件: `src/services/calculator.ts`

```typescript
import { Package, PackageSize } from '../types';

/**
 * 空间计算服务
 * 负责计算包的磁盘占用
 */
export class DiskUsageCalculatorService {
  /**
   * 计算单个包的大小信息
   */
  async calculatePackageSize(
    pkg: Package,
    dependencies: Map<string, Dependency>
  ): Promise<PackageSize> {
    // 1. 计算主软件大小: pkg.installPath的du -sk
    // 2. 遍历pkg.dependencies,累加依赖大小
    // 3. 区分独占依赖和共享依赖
    // 4. 返回PackageSize对象
  }

  /**
   * 批量计算包大小
   */
  async calculateBatchSizes(packages: Package[]): Promise<Map<string, PackageSize>> {
    // 1. 并发调用calculatePackageSize
    // 2. 返回Map<包名, PackageSize>
  }

  /**
   * 格式化大小显示(字节转KB/MB/GB)
   */
  formatSize(bytes: number): string {
    // 实现人类可读的大小格式化
  }
}
```

#### 文件: `src/services/cleaner.ts`

```typescript
import { Package } from '../types';
import { IPackageManager } from '../types/manager';

/**
 * 卸载执行服务
 * 负责安全地卸载包
 */
export class PackageCleanerService {
  /**
   * 预览卸载影响
   */
  async previewUninstall(packages: Package[]): Promise<{
    packages: Package[];
    affectedPackages: string[];
    totalSize: number;
    warnings: string[];
  }> {
    // 1. 计算将要删除的总大小(仅顶层包)
    // 2. 分析受影响的包(依赖这些包的其他包)
    // 3. 生成警告信息
    // 4. 返回预览结果
  }

  /**
   * 执行卸载
   */
  async executeUninstall(
    packages: Package[],
    managers: IPackageManager[]
  ): Promise<{
    success: boolean;
    succeeded: string[];
    failed: Array<{ name: string; reason: string }>;
  }> {
    // 1. 遍历packages
    // 2. 找到对应的manager
    // 3. 调用manager.uninstall()
    // 4. 记录成功/失败
    // 5. 返回结果
  }

  /**
   * 生成卸载日志
   */
  generateUninstallLog(result: any): string {
    // 生成JSON或Markdown格式的操作日志
  }
}
```

### 3.4 状态管理

#### 文件: `src/stores/app-store.ts`

```typescript
import { create } from 'zustand';
import { Package, PackageManagerType } from '../types';

/**
 * 应用全局状态
 */
interface AppState {
  // 数据状态
  packages: Package[];
  filteredPackages: Package[];
  selectedPackages: Package[];
  
  // UI状态
  currentTab: PackageManagerType | 'all';
  searchQuery: string;
  isLoading: boolean;
  currentView: 'list' | 'detail' | 'preview';
  selectedPackageForDetail: Package | null;
  
  // 排序状态
  sortBy: 'name' | 'size' | 'date';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setPackages: (packages: Package[]) => void;
  togglePackageSelection: (pkgName: string) => void;
  setSearchQuery: (query: string) => void;
  setCurrentTab: (tab: PackageManagerType | 'all') => void;
  setSortBy: (sortBy: 'name' | 'size' | 'date') => void;
  setCurrentView: (view: 'list' | 'detail' | 'preview') => void;
  selectPackageForDetail: (pkg: Package | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  packages: [],
  filteredPackages: [],
  selectedPackages: [],
  currentTab: 'all',
  searchQuery: '',
  isLoading: false,
  currentView: 'list',
  selectedPackageForDetail: null,
  sortBy: 'name',
  sortOrder: 'asc',
  
  // Actions实现
  setPackages: (packages) => {
    set({ packages });
    // 触发过滤逻辑
  },
  
  togglePackageSelection: (pkgName) => {
    // 切换包的选中状态
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    // 触发过滤逻辑
  },
  
  // ... 其他actions
}));
```

### 3.5 UI组件层

#### 文件: `src/components/PackageList.tsx`

```typescript
import React from 'react';
import { Box, Text } from 'ink';
import { useAppStore } from '../stores/app-store';
import { PackageListItem } from './PackageListItem';

/**
 * 包列表组件
 * 显示所有包的列表,支持上下键选择
 */
export const PackageList: React.FC = () => {
  const { filteredPackages, selectedPackages } = useAppStore();
  
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>📦 Packages ({filteredPackages.length})</Text>
      <Box flexDirection="column" marginTop={1}>
        {filteredPackages.map((pkg) => (
          <PackageListItem
            key={`${pkg.manager}-${pkg.name}`}
            package={pkg}
            isSelected={selectedPackages.some((p) => p.name === pkg.name)}
          />
        ))}
      </Box>
    </Box>
  );
};
```

#### 文件: `src/components/PreviewModal.tsx`

```typescript
import React from 'react';
import { Box, Text } from 'ink';
import { Package } from '../types';

interface PreviewModalProps {
  packages: Package[];
  affectedPackages: string[];
  totalSize: number;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 预览卸载弹窗组件
 * 显示即将删除的包、受影响的包、警告信息
 */
export const PreviewModal: React.FC<PreviewModalProps> = ({
  packages,
  affectedPackages,
  totalSize,
  warnings,
  onConfirm,
  onCancel,
}) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      padding={1}
    >
      <Text bold color="yellow">🔍 Preview Uninstall</Text>
      
      <Box flexDirection="column" marginTop={1}>
        <Text>Selected packages ({packages.length}):</Text>
        {packages.map((pkg) => (
          <Text key={pkg.name}>  ✓ {pkg.name}@{pkg.version}</Text>
        ))}
      </Box>
      
      <Box flexDirection="column" marginTop={1}>
        <Text>Will be removed:</Text>
        <Text>  • {packages.length} main packages</Text>
        <Text>  • Total: {formatSize(totalSize)}</Text>
      </Box>
      
      {affectedPackages.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="red">⚠️  Affected packages (will remain):</Text>
          {affectedPackages.map((pkg) => (
            <Text key={pkg}>  • {pkg}</Text>
          ))}
        </Box>
      )}
      
      {warnings.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {warnings.map((warning, i) => (
            <Text key={i} color="red">⚠️  {warning}</Text>
          ))}
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text>[C]onfirm  [Esc] Cancel</Text>
      </Box>
    </Box>
  );
};
```

---

## 3.6 UI设计线框图

本节提供详细的ASCII线框图,展示term-clean的所有主要界面设计。

### 3.6.1 主界面 - 包列表视图

这是用户启动后看到的默认界面,展示所有已安装的包。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ term-clean v1.0                                  [brew] [npm] [pip] [all]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📦 Packages (125 total)                        🔍 Search: [          ] │
│                                                                         │
│  Sort by: [Name ▼] [Size] [Date]                                       │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ ● node@22.0.0              120 MB │ 240 MB    2024-01-15    [✓]  │ │
│  │   └─ brew-formula        主软件 │ 依赖占用                       │ │
│  │                                                                   │ │
│  │ ○ ffmpeg@6.1              450 MB │ 800 MB    2023-11-20    [ ]  │ │
│  │   └─ brew-formula                                                │ │
│  │                                                                   │ │
│  │ ○ python@3.12             180 MB │ 350 MB    2024-01-10    [ ]  │ │
│  │   └─ brew-formula                                                │ │
│  │                                                                   │ │
│  │ ○ docker                  550 MB │   0 MB    2024-01-20    [ ]  │ │
│  │   └─ brew-cask                                                   │ │
│  │                                                                   │ │
│  │ ○ typescript@5.3.3         35 MB │  85 MB    2023-12-15    [ ]  │ │
│  │   └─ npm-global                                                  │ │
│  │                                                                   │ │
│  │ ○ redis@7.2.4              45 MB │ 120 MB    2023-08-05    [ ]  │ │
│  │   └─ brew-formula                                                │ │
│  │                                                                   │ │
│  │ ○ numpy@1.26.0            150 MB │ 420 MB    2024-01-05    [ ]  │ │
│  │   └─ pip-global                                                  │ │
│  │                                                                   │ │
│  │ ... (showing 7 of 125)                                           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Selected: 1 package │ Total Size: 120 MB │ Deps: 240 MB (display only) │
│                                                                         │
│ 💡 Tips: [↑↓] Move  [Space] Select  [Enter] Details  [/] Search        │
│          [p] Preview  [u] Uninstall  [r] Refresh  [q] Quit             │
└─────────────────────────────────────────────────────────────────────────┘
```

**说明**:
- **顶部标题栏**: 显示版本和包管理器标签页
- **搜索栏**: 实时搜索过滤
- **排序按钮**: 按名称/大小/日期排序
- **包列表区**: 虚拟滚动,显示包名、版本、大小、日期、选择框
- **底部状态栏**: 显示选中统计和快捷键提示
- **● 符号**: 当前高亮的包
- **✓ 符号**: 已选中要卸载的包

---

### 3.6.2 搜索激活状态

用户按下 `/` 键后进入搜索模式。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ term-clean v1.0                                  [brew] [npm] [pip] [all]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📦 Packages (3 matching "node")               🔍 Search: [node_      ] │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ ● node@22.0.0              120 MB │ 240 MB    2024-01-15    [✓]  │ │
│  │   └─ brew-formula        主软件 │ 依赖占用                       │ │
│  │                                                                   │ │
│  │ ○ nodejs-lts@20.11.0       110 MB │ 220 MB    2023-10-15    [ ]  │ │
│  │   └─ brew-formula                                                │ │
│  │                                                                   │ │
│  │ ○ nodemon@3.0.2             12 MB │  45 MB    2024-01-08    [ ]  │ │
│  │   └─ npm-global                                                  │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  💡 Matching packages highlighted                                      │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Filtered: 3 of 125 packages                                            │
│                                                                         │
│ [Esc] Clear search  [Enter] Select first match                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**说明**:
- 搜索框获得焦点,显示光标
- 实时过滤显示匹配的包
- 底部显示匹配数量

---

### 3.6.3 详情视图 - 分屏依赖树

用户在列表上按 `Enter` 查看包详情和依赖关系。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ term-clean v1.0                                              Detail View│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────┬─────────────────────────────────────┐ │
│ │ 📦 Package Info             │ 🔗 Dependencies                     │ │
│ ├─────────────────────────────┼─────────────────────────────────────┤ │
│ │                             │                                     │ │
│ │ Name:     ffmpeg            │ ffmpeg depends on (8):              │ │
│ │ Version:  6.1               │                                     │ │
│ │ Manager:  Homebrew Formula  │ ├─ 🟡 aom@3.8.0 (shared)           │ │
│ │ Installed: 2023-11-20       │ │    └─ Used by: 3 packages        │ │
│ │ Modified:  2023-11-20       │ │                                   │ │
│ │                             │ ├─ 🟡 brotli@1.1.0 (shared)        │ │
│ │ Size Breakdown:             │ │    └─ Used by: 5 packages        │ │
│ │   Main:        450 MB       │ │                                   │ │
│ │   Dependencies: 800 MB      │ ├─ 🔴 cairo@1.18.0 (exclusive)     │ │
│ │   Total:       1.25 GB      │ │    └─ Only used by ffmpeg       │ │
│ │                             │ │                                   │ │
│ │ Install Path:               │ ├─ 🟡 fontconfig@2.15.0 (shared)  │ │
│ │ /opt/homebrew/Cellar/       │ │                                   │ │
│ │   ffmpeg/6.1                │ ├─ 🟡 freetype@2.13.2 (shared)    │ │
│ │                             │ │                                   │ │
│ │ Last Used:                  │ ├─ 🟡 libass@0.17.1 (shared)      │ │
│ │   19 days ago               │ │                                   │ │
│ │                             │ ├─ 🟡 libvpx@1.13.1 (shared)      │ │
│ │                             │ │                                   │ │
│ │                             │ └─ 🟡 opus@1.4 (shared)            │ │
│ │                             │                                     │ │
│ │                             │                                     │ │
│ │                             │ Used by (1):                        │ │
│ │                             │                                     │ │
│ │                             │ ├─ 🟢 video-converter              │ │
│ │                             │    └─ If uninstalled, this may     │ │
│ │                             │       break video-converter        │ │
│ │                             │                                     │ │
│ └─────────────────────────────┴─────────────────────────────────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Legend: 🔴 Exclusive  🟡 Shared  🟢 Dependent                          │
│                                                                         │
│ [Esc] Back to list  [Space] Select for uninstall  [p] Preview          │
└─────────────────────────────────────────────────────────────────────────┘
```

**说明**:
- **左侧面板**: 包的详细信息
- **右侧面板**: 依赖树和反向依赖
- **颜色标记**: 
  - 🔴 独占依赖 (仅此包使用)
  - 🟡 共享依赖 (多包共享)
  - 🟢 被依赖 (其他包依赖此包)

---

### 3.6.4 预览卸载弹窗

用户选中包后按 `p` 进入预览模式,显示卸载影响分析。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ term-clean v1.0                                  [brew] [npm] [pip] [all]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  🔍 Preview Uninstall                           │   │
│  │                                                                 │   │
│  │  Selected packages (3):                                        │   │
│  │    ✓ node@22.0.0           (brew-formula)                      │   │
│  │    ✓ ffmpeg@6.1            (brew-formula)                      │   │
│  │    ✓ python@3.12           (brew-formula)                      │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  Will be removed:                                              │   │
│  │    • 3 main packages                                           │   │
│  │    • Total size: 750 MB                                        │   │
│  │                                                                 │   │
│  │  Dependencies (display only, will NOT be removed):             │   │
│  │    • 23 dependencies (1.39 GB)                                 │   │
│  │    • 5 exclusive deps                                          │   │
│  │    • 18 shared deps                                            │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  ⚠️  WARNING: Affected packages (will remain):                 │   │
│  │                                                                 │   │
│  │    • npm (depends on node@22)                                  │   │
│  │      └─ May not work without Node.js!                         │   │
│  │                                                                 │   │
│  │    • video-converter (depends on ffmpeg)                       │   │
│  │      └─ Video processing will fail!                           │   │
│  │                                                                 │   │
│  │    • jupyter (depends on python@3.12)                          │   │
│  │      └─ Notebook server will not start!                       │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  💡 Disk space to be freed: 750 MB                             │   │
│  │     (Dependencies remain: 1.39 GB)                             │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ [C] Confirm & Uninstall                                 │  │   │
│  │  ├─────────────────────────────────────────────────────────┤  │   │
│  │  │ [E] Export plan (JSON/Markdown)                         │  │   │
│  │  ├─────────────────────────────────────────────────────────┤  │   │
│  │  │ [Esc] Cancel                                            │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**说明**:
- **选中包列表**: 即将删除的包
- **移除统计**: 仅统计顶层包大小
- **依赖信息**: 展示依赖,但不会删除
- **警告区域**: 高亮显示受影响的包
- **操作按钮**: 确认、导出、取消

---

### 3.6.5 执行卸载 - 进度界面

用户确认卸载后显示的实时进度界面。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ term-clean v1.0                                       Uninstalling...   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    🔄 Uninstalling Packages                     │   │
│  │                                                                 │   │
│  │  Progress: [████████████░░░░░░░░░░░░] 2 of 3 (66%)            │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  ✅ node@22.0.0                                                │   │
│  │     └─ Successfully uninstalled (120 MB freed)                │   │
│  │                                                                 │   │
│  │  ✅ ffmpeg@6.1                                                 │   │
│  │     └─ Successfully uninstalled (450 MB freed)                │   │
│  │                                                                 │   │
│  │  🔄 python@3.12                                                │   │
│  │     └─ Uninstalling... (please wait)                          │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  Elapsed: 12s                                                  │   │
│  │  Freed: 570 MB                                                 │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  💡 Do not close this window...                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**说明**:
- **进度条**: 实时显示卸载进度
- **状态列表**: 
  - ✅ 已完成
  - 🔄 进行中
  - ❌ 失败(如果有)
- **实时统计**: 耗时和已释放空间

---

### 3.6.6 卸载完成 - 结果界面

所有包卸载完成后显示的汇总结果。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ term-clean v1.0                                          Completed ✅   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    ✅ Uninstall Complete                        │   │
│  │                                                                 │   │
│  │  Successfully removed 3 packages in 18 seconds                 │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  ✅ Succeeded (3):                                             │   │
│  │     • node@22.0.0           (120 MB freed)                     │   │
│  │     • ffmpeg@6.1            (450 MB freed)                     │   │
│  │     • python@3.12           (180 MB freed)                     │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  📊 Summary:                                                   │   │
│  │     Total freed:      750 MB                                   │   │
│  │     Duration:         18 seconds                               │   │
│  │     Success rate:     100%                                     │   │
│  │                                                                 │   │
│  │  📝 Log saved to:                                              │   │
│  │     ~/Library/Logs/term-clean/uninstall-2024-01-28.log        │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  💡 Tip: Run 'term-clean' again to see updated package list   │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ [V] View Log                                            │  │   │
│  │  ├─────────────────────────────────────────────────────────┤  │   │
│  │  │ [R] Return to Main                                      │  │   │
│  │  ├─────────────────────────────────────────────────────────┤  │   │
│  │  │ [Q] Quit                                                │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**说明**:
- **成功列表**: 显示所有成功卸载的包和释放的空间
- **失败列表**: 如果有失败,显示原因
- **汇总统计**: 总释放空间、耗时、成功率
- **日志路径**: 保存操作日志的位置
- **操作选项**: 查看日志、返回主界面、退出

---

### 3.6.7 加载状态

初始扫描包列表时的加载界面。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ term-clean v1.0                                  [brew] [npm] [pip] [all]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                                                                         │
│                                                                         │
│                        🔄 Scanning Packages...                         │
│                                                                         │
│                     ┌─────────────────────────────┐                    │
│                     │                             │                    │
│                     │  ✅ Homebrew    (45 pkgs)   │                    │
│                     │  ✅ npm         (38 pkgs)   │                    │
│                     │  🔄 pnpm        (scanning)  │                    │
│                     │  ⏳ yarn        (waiting)   │                    │
│                     │  ⏳ pip         (waiting)   │                    │
│                     │                             │                    │
│                     └─────────────────────────────┘                    │
│                                                                         │
│                     Progress: [████████░░░░░░] 60%                     │
│                                                                         │
│                     Found 83 packages so far...                        │
│                                                                         │
│                                                                         │
│                                                                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ 💡 Scanning all package managers, please wait...                       │
│                                                                         │
│ [Esc] Cancel scan                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**说明**:
- **扫描状态**: 显示每个包管理器的扫描进度
  - ✅ 完成
  - 🔄 进行中
  - ⏳ 等待
  - ❌ 失败/不可用
- **进度条**: 总体扫描进度
- **实时计数**: 已发现的包数量

---

### 3.6.8 错误处理界面

当发生错误时的提示界面。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ term-clean v1.0                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    ⚠️  Permission Denied                        │   │
│  │                                                                 │   │
│  │  Unable to uninstall 'python@3.12'                             │   │
│  │                                                                 │   │
│  │  Error Details:                                                │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │  Permission denied when executing:                             │   │
│  │    brew uninstall python@3.12                                  │   │
│  │                                                                 │   │
│  │  The package may have been installed with sudo or requires    │   │
│  │  administrator privileges to uninstall.                        │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  💡 Suggested Solutions:                                       │   │
│  │                                                                 │   │
│  │  1. Run term-clean with sudo:                                 │   │
│  │     $ sudo term-clean                                          │   │
│  │                                                                 │   │
│  │  2. Manually uninstall the package:                            │   │
│  │     $ sudo brew uninstall python@3.12                          │   │
│  │                                                                 │   │
│  │  3. Check file permissions:                                    │   │
│  │     $ ls -la /opt/homebrew/Cellar/python@3.12                 │   │
│  │                                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ [R] Retry                                               │  │   │
│  │  ├─────────────────────────────────────────────────────────┤  │   │
│  │  │ [S] Skip this package                                   │  │   │
│  │  ├─────────────────────────────────────────────────────────┤  │   │
│  │  │ [V] View full error log                                 │  │   │
│  │  ├─────────────────────────────────────────────────────────┤  │   │
│  │  │ [Esc] Cancel uninstall                                  │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**说明**:
- **错误类型**: 明确显示错误类型(权限、网络、命令失败等)
- **错误详情**: 显示具体错误信息和命令
- **解决方案**: 提供3-5个可能的解决方案
- **操作选项**: 重试、跳过、查看详情、取消

---

### 3.6.9 UI设计原则总结

1. **信息层次清晰**: 使用边框、分隔线区分不同区域
2. **状态可视化**: 使用emoji和符号表示状态(✅/🔄/❌/⚠️)
3. **颜色区分**: 使用颜色标记重要信息(红色警告、绿色成功等)
4. **实时反馈**: 所有操作都有进度和状态反馈
5. **友好提示**: 底部始终显示可用的快捷键
6. **错误引导**: 错误时提供明确的解决方案
7. **安全保护**: 关键操作有二次确认,预览必须先于执行

---

## 4. 开发阶段规划

### Phase 1: 项目脚手架与基础设施 (Week 1)

**目标**: 搭建项目基础结构,配置开发环境

**交付物**:
- 完整的项目目录结构
- TypeScript + ink开发环境
- 基础的CLI入口
- 单元测试框架配置

**详细任务**: 见实施清单第1-15项

---

### Phase 2: 包管理器集成 (Week 2-4)

**目标**: 实现所有包管理器的适配器,能够正确读取已安装的包列表

**Week 2**: Homebrew集成
- 实现BrewPackageManager
- 支持Formula和Cask
- 测试覆盖

**Week 3**: Node生态集成
- 实现NpmPackageManager、PnpmPackageManager、YarnPackageManager
- 统一接口测试

**Week 4**: Pip集成
- 实现PipPackageManager
- 支持全局和--user安装
- 集成测试

**交付物**:
- 5个包管理器适配器全部实现
- 能够正确列出所有已安装的包
- 单元测试覆盖率 > 80%

**详细任务**: 见实施清单第16-35项

---

### Phase 3: 核心业务逻辑 (Week 5-7)

**Week 5**: 扫描与分析
- 实现PackageScannerService
- 实现DependencyAnalyzerService
- 依赖图构建算法

**Week 6**: 空间计算
- 实现DiskUsageCalculatorService
- 并发优化
- 缓存机制

**Week 7**: 卸载逻辑
- 实现PackageCleanerService
- 预览模式
- 安全卸载机制

**交付物**:
- 完整的业务逻辑层
- 依赖分析准确率100%
- 空间计算误差 < 5%

**详细任务**: 见实施清单第36-55项

---

### Phase 4: TUI界面开发 (Week 8-9)

**Week 8**: 主界面
- 实现PackageList组件
- 实现TabBar、SearchBar、StatusBar
- 键盘交互

**Week 9**: 详情与预览
- 实现DependencyTree组件
- 实现PreviewModal组件
- 完整的交互流程

**交付物**:
- 完整的TUI界面
- 流畅的键盘操作体验
- 符合设计稿

**详细任务**: 见实施清单第56-75项

---

### Phase 5: 测试与优化 (Week 10)

**目标**: 完善测试、性能优化、发布准备

**任务**:
- 集成测试覆盖所有用例
- 性能优化(启动时间、加载速度)
- 文档完善
- 打包配置

**交付物**:
- 测试覆盖率 > 80%
- 性能指标达标
- 用户文档
- 可发布的npm包

**详细任务**: 见实施清单第76-90项

---

## 5. 技术规范

### 5.1 代码规范

- **TypeScript严格模式**: 启用`strict: true`
- **ESLint**: 使用`@typescript-eslint`推荐规则
- **Prettier**: 统一代码格式
- **命名约定**:
  - 类名: PascalCase (例: `BrewPackageManager`)
  - 函数/变量: camelCase (例: `listPackages`)
  - 常量: UPPER_SNAKE_CASE (例: `MAX_RETRY_COUNT`)
  - 类型/接口: PascalCase,接口以`I`开头 (例: `IPackageManager`)

### 5.2 Git工作流

- **分支策略**:
  - `main`: 稳定版本
  - `develop`: 开发主分支
  - `feature/*`: 功能分支
  - `fix/*`: 修复分支

- **提交规范**: 遵循Conventional Commits
  ```
  feat: 新功能
  fix: 修复bug
  docs: 文档更新
  refactor: 重构
  test: 测试相关
  chore: 构建/工具链更新
  ```

### 5.3 测试策略

- **单元测试**: 覆盖所有业务逻辑和工具函数
- **集成测试**: 覆盖包管理器集成和端到端流程
- **Mock策略**: 使用vitest的mock功能模拟子进程调用
- **测试数据**: 使用fixtures提供测试数据

---

## 6. 性能优化策略

### 6.1 启动优化
- 延迟加载: 组件按需加载
- 并发初始化: 多个manager并发检查可用性

### 6.2 列表渲染优化
- 虚拟滚动: 仅渲染可见区域的包
- 防抖搜索: 搜索输入防抖300ms

### 6.3 空间计算优化
- 并发计算: 使用Promise.all并发计算包大小
- 缓存结果: 缓存已计算的大小,避免重复计算
- 进度反馈: 显示计算进度

---

## 7. 风险控制

### 7.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| ink性能问题 | 大量包时卡顿 | 虚拟滚动、懒加载 |
| 包管理器输出变化 | 解析失败 | 版本检测、降级处理 |
| 权限问题 | 无法执行命令 | 友好提示、手动重试 |

### 7.2 用户风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 误删重要包 | 系统损坏 | 强制预览、二次确认 |
| 依赖分析错误 | 提示不准确 | 充分测试、用户反馈渠道 |

---

## 8. 实施清单

以下是完整的编号清单,每一项对应一个具体的实施步骤:

### Phase 1: 项目脚手架 (15项)

1. 初始化npm项目,创建`package.json`
2. 安装核心依赖: `ink`, `react`, `zustand`, `commander`, `execa`, `fs-extra`
3. 安装开发依赖: `typescript`, `tsup`, `vitest`, `@types/*`
4. 配置`tsconfig.json`,启用严格模式
5. 配置`tsup.config.ts`,设置打包入口和输出
6. 配置`vitest.config.ts`,设置测试环境
7. 创建 `src/` 目录结构(components, managers, services, stores, types, utils, constants)
8. 创建 `tests/` 目录结构(unit, integration, fixtures)
9. 创建 `doc/` 目录,初始化文档文件
10. 创建 `src/cli.tsx` CLI入口文件,集成commander
11. 创建 `src/app.tsx` ink根组件
12. 配置ESLint和Prettier规则
13. 编写`.gitignore`文件
14. 编写`README.md`基础说明
15. 验证环境: 运行`npm run dev`,确保可以启动

### Phase 2: 包管理器集成 (20项)

16. 创建 `src/types/package.ts`,定义Package、PackageSize、PackageManagerType
17. 创建 `src/types/dependency.ts`,定义Dependency、DependencyType、DependencyTreeNode
18. 创建 `src/types/manager.ts`,定义IPackageManager接口
19. 创建 `src/utils/command.ts`,封装execa执行命令的通用函数
20. 创建 `src/managers/base.ts`,实现BasePackageManager抽象类
21. 实现 `src/managers/brew.ts` - BrewPackageManager.isAvailable()
22. 实现 `src/managers/brew.ts` - BrewPackageManager.listPackages()
23. 实现 `src/managers/brew.ts` - BrewPackageManager.getPackageInfo()
24. 实现 `src/managers/brew.ts` - BrewPackageManager.getDependencies()
25. 实现 `src/managers/brew.ts` - BrewPackageManager.calculateSize()
26. 实现 `src/managers/brew.ts` - BrewPackageManager.uninstall()
27. 编写 `tests/unit/managers/brew.test.ts` 单元测试
28. 实现 `src/managers/npm.ts` - NpmPackageManager完整实现
29. 编写 `tests/unit/managers/npm.test.ts` 单元测试
30. 实现 `src/managers/pnpm.ts` - PnpmPackageManager完整实现
31. 编写 `tests/unit/managers/pnpm.test.ts` 单元测试
32. 实现 `src/managers/yarn.ts` - YarnPackageManager完整实现
33. 编写 `tests/unit/managers/yarn.test.ts` 单元测试
34. 实现 `src/managers/pip.ts` - PipPackageManager完整实现
35. 编写 `tests/unit/managers/pip.test.ts` 单元测试

### Phase 3: 业务逻辑层 (20项)

36. 创建 `src/services/scanner.ts`,定义PackageScannerService类
37. 实现 PackageScannerService.scanAll() 方法
38. 实现 PackageScannerService.scanByManager() 方法
39. 编写 `tests/unit/services/scanner.test.ts` 单元测试
40. 创建 `src/services/analyzer.ts`,定义DependencyAnalyzerService类
41. 实现 DependencyAnalyzerService.buildDependencyGraph() 方法
42. 实现 DependencyAnalyzerService.analyzeDependencyTypes() 方法
43. 实现 DependencyAnalyzerService.buildDependencyTree() 方法
44. 实现 DependencyAnalyzerService.getAffectedPackages() 方法
45. 编写 `tests/unit/services/analyzer.test.ts` 单元测试
46. 创建 `src/services/calculator.ts`,定义DiskUsageCalculatorService类
47. 实现 DiskUsageCalculatorService.calculatePackageSize() 方法
48. 实现 DiskUsageCalculatorService.calculateBatchSizes() 方法(并发优化)
49. 实现 DiskUsageCalculatorService.formatSize() 方法
50. 编写 `tests/unit/services/calculator.test.ts` 单元测试
51. 创建 `src/services/cleaner.ts`,定义PackageCleanerService类
52. 实现 PackageCleanerService.previewUninstall() 方法
53. 实现 PackageCleanerService.executeUninstall() 方法
54. 实现 PackageCleanerService.generateUninstallLog() 方法
55. 编写 `tests/unit/services/cleaner.test.ts` 单元测试

### Phase 4: UI组件层 (20项)

56. 创建 `src/stores/app-store.ts`,定义AppState接口和useAppStore
57. 实现所有state和actions
58. 编写 `tests/unit/stores/app-store.test.ts` 单元测试
59. 创建 `src/components/PackageListItem.tsx`,实现单个列表项
60. 创建 `src/components/PackageList.tsx`,实现包列表组件
61. 实现PackageList的键盘交互(上下键选择、空格选中)
62. 创建 `src/components/TabBar.tsx`,实现标签页切换
63. 创建 `src/components/SearchBar.tsx`,实现搜索栏
64. 创建 `src/components/StatusBar.tsx`,实现底部状态栏
65. 创建 `src/components/ProgressIndicator.tsx`,实现加载进度指示器
66. 创建 `src/components/DependencyTree.tsx`,实现依赖树组件
67. 实现DependencyTree的展开/折叠交互
68. 创建 `src/components/PreviewModal.tsx`,实现预览弹窗
69. 实现PreviewModal的确认/取消交互
70. 在 `src/app.tsx` 中集成所有组件,实现主布局
71. 实现视图切换逻辑(列表 ↔ 详情 ↔ 预览)
72. 实现全局快捷键处理(Tab切换、/搜索、p预览、q退出等)
73. 优化UI样式和布局
74. 编写 `tests/integration/ui-flow.test.ts` UI流程测试
75. 手工测试所有交互流程

### Phase 5: 测试与发布 (15项)

76. 创建 `tests/fixtures/` 测试数据(模拟包管理器输出)
77. 编写端到端集成测试: 扫描 → 分析 → 预览 → 卸载
78. 性能测试: 1000个包的加载时间
79. 性能优化: 实现虚拟滚动
80. 性能优化: 搜索防抖
81. 性能优化: 空间计算缓存
82. 异常处理: 包管理器不可用时的降级处理
83. 异常处理: 命令执行失败时的错误提示
84. 异常处理: 权限不足时的友好提示
85. 编写 `doc/architecture.md` 架构设计文档
86. 编写 `doc/api-design.md` API设计文档
87. 编写 `doc/testing-strategy.md` 测试策略文档
88. 完善 `README.md` 用户使用文档
89. 配置npm发布: 设置`bin`字段、`files`字段
90. 执行 `npm publish` 发布到npm registry

---

## 9. 验收标准

### 9.1 功能验收

- [ ] 能正确列出所有包管理器的已安装包
- [ ] 空间计算准确(误差 < 5%)
- [ ] 依赖分析准确(无遗漏)
- [ ] 预览模式正确展示影响
- [ ] 卸载功能仅删除顶层包,不删除依赖
- [ ] 所有快捷键正常工作

### 9.2 性能验收

- [ ] 启动时间 < 2秒
- [ ] 1000个包的加载时间 < 3秒
- [ ] 搜索响应时间 < 100ms
- [ ] 依赖分析时间 < 5秒

### 9.3 质量验收

- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖所有主要用例
- [ ] 无ESLint错误
- [ ] 无TypeScript类型错误
- [ ] 代码通过Prettier格式化

### 9.4 用户体验验收

- [ ] UI布局清晰,信息层次分明
- [ ] 键盘操作流畅,无卡顿
- [ ] 错误提示友好,有明确的解决建议
- [ ] 5分钟内新手可以完成首次清理

---

## 10. 后续迭代规划

### V1.1 (Phase 6)
- 支持cargo(Rust)、gem(Ruby)包管理器
- 导出清理报告(JSON/Markdown)
- 配置文件支持(自定义排除包等)

### V1.2 (Phase 7)
- 使用频率追踪(基于文件修改时间)
- 智能推荐可清理的包
- 标记长期未使用的包

### V2.0 (Phase 8)
- 快照回滚机制
- 批量操作优化
- 多语言支持(中文/英文)

---

**文档结束**

此开发计划为term-clean项目的完整技术指南,涵盖架构设计、模块划分、开发清单和验收标准。按照此计划逐步实施,可以确保项目高质量交付。
