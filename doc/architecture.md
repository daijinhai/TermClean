# term-clean 架构设计文档

**版本**: v1.0  
**日期**: 2026-01-28  
**状态**: Draft

---

## 1. 架构概览

term-clean采用**分层架构**,从上到下分为:

1. **表现层 (Presentation Layer)**: ink React组件
2. **应用层 (Application Layer)**: 状态管理和服务协调
3. **领域层 (Domain Layer)**: 核心业务逻辑
4. **基础设施层 (Infrastructure Layer)**: 包管理器适配

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│                    (ink Components)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PackageList  │  │DependencyTree│  │PreviewModal  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                    │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │  AppStore    │◄─┤  Services Coordinator           │ │
│  │  (zustand)   │  │  (Scanner/Analyzer/Calculator)  │ │
│  └──────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                      Domain Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PackageRepo  │  │  Calculator  │  │   Cleaner    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Brew    │  │   NPM    │  │   Pip    │  │ ...    │  │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │  │        │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 设计原则

### 2.1 SOLID原则

- **单一职责 (SRP)**: 每个类/模块只负责一个功能
  - `BrewPackageManager` 只负责Homebrew集成
  - `DependencyAnalyzer` 只负责依赖分析
  
- **开闭原则 (OCP)**: 对扩展开放,对修改关闭
  - 新增包管理器只需实现`IPackageManager`接口
  
- **里氏替换 (LSP)**: 子类可以替换父类
  - 所有PackageManager子类可互换使用
  
- **接口隔离 (ISP)**: 接口应该细粒度
  - `IPackageManager`只定义必要的方法
  
- **依赖倒置 (DIP)**: 依赖抽象而非具体实现
  - Service层依赖`IPackageManager`接口,而非具体的Manager

### 2.2 设计模式

#### 适配器模式 (Adapter Pattern)
用于统一不同包管理器的接口:

```typescript
interface IPackageManager {
  listPackages(): Promise<Package[]>;
  // ...
}

class BrewPackageManager implements IPackageManager { }
class NpmPackageManager implements IPackageManager { }
```

#### 仓储模式 (Repository Pattern)
抽象数据访问:

```typescript
class PackageRepository {
  async findAll(): Promise<Package[]> { }
  async findByName(name: string): Promise<Package | null> { }
}
```

#### 服务模式 (Service Pattern)
封装业务逻辑:

```typescript
class DependencyAnalyzerService {
  buildDependencyGraph(packages: Package[]): DependencyGraph { }
}
```

---

## 3. 核心模块详解

### 3.1 包管理器适配层

**目的**: 统一不同包管理器的差异,提供一致的接口

**设计**:
```
BasePackageManager (抽象类)
├── BrewPackageManager
├── NpmPackageManager
├── PnpmPackageManager
├── YarnPackageManager
└── PipPackageManager
```

**关键方法**:
- `isAvailable()`: 检查包管理器是否安装
- `listPackages()`: 列出所有已安装的包
- `getDependencies()`: 获取依赖列表
- `calculateSize()`: 计算包大小
- `uninstall()`: 卸载包

**实现细节**:
- 使用`execa`执行shell命令
- 解析JSON或文本输出
- 错误处理和降级策略

### 3.2 依赖分析器

**目的**: 构建依赖关系图,分析依赖类型

**核心算法**:

1. **构建依赖图**:
```typescript
buildDependencyGraph(packages: Package[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  for (const pkg of packages) {
    for (const dep of pkg.dependencies) {
      if (!graph.has(dep)) {
        graph.set(dep, []);
      }
      graph.get(dep)!.push(pkg.name);
    }
  }
  
  return graph;
}
```

2. **分析依赖类型**:
```typescript
analyzeDependencyTypes(graph: DependencyGraph): Map<string, DependencyType> {
  const types = new Map();
  
  for (const [dep, dependents] of graph) {
    types.set(dep, dependents.length === 1 ? 'EXCLUSIVE' : 'SHARED');
  }
  
  return types;
}
```

3. **构建依赖树 (DFS)**:
```typescript
buildDependencyTree(pkg: Package, visited = new Set()): DependencyTreeNode {
  if (visited.has(pkg.name)) {
    return { name: pkg.name, children: [], isCircular: true };
  }
  
  visited.add(pkg.name);
  
  const children = pkg.dependencies.map(dep => 
    buildDependencyTree(findPackage(dep), visited)
  );
  
  return { name: pkg.name, children };
}
```

### 3.3 空间计算器

**目的**: 精确计算磁盘占用

**策略**:
- **主软件大小**: 直接`du -sk <package-path>`
- **依赖大小**: 累加所有依赖的大小(仅展示)
- **可清理空间**: 仅计算顶层包大小

**优化**:
- 并发计算: `Promise.all(packages.map(pkg => calculateSize(pkg)))`
- 缓存结果: 避免重复计算同一个包
- 进度反馈: 实时更新计算进度

### 3.4 状态管理

**技术选型**: zustand (轻量级 React 状态管理)

**状态结构**:
```typescript
interface AppState {
  // 数据
  packages: Package[];
  selectedPackages: Package[];
  
  // UI状态
  currentTab: PackageManagerType | 'all';
  currentView: 'list' | 'detail' | 'preview';
  searchQuery: string;
  
  // Actions
  setPackages: (packages: Package[]) => void;
  toggleSelection: (pkgName: string) => void;
  // ...
}
```

**数据流**:
```
User Action → Action Creator → Update State → Re-render Components
```

---

## 4. 数据流

### 4.1 启动流程

```
1. CLI入口 (cli.tsx)
   └─► 2. 初始化Managers
       └─► 3. 检查可用性
           └─► 4. 渲染App (app.tsx)
               └─► 5. 触发扫描
                   └─► 6. 更新Store
                       └─► 7. 渲染列表
```

### 4.2 卸载流程

```
1. 用户选择包 (Space键)
   └─► 2. 更新selectedPackages
       └─► 3. 按p键进入预览
           └─► 4. 调用previewUninstall()
               ├─► 分析受影响的包
               ├─► 计算释放空间
               └─► 生成警告
           └─► 5. 显示PreviewModal
               └─► 6. 用户确认
                   └─► 7. 调用executeUninstall()
                       └─► 8. 显示结果
```

---

## 5. 性能优化

### 5.1 启动优化

- **延迟加载**: 只加载当前标签页的包
- **并发初始化**: 多个manager并发检查

### 5.2 渲染优化

- **虚拟滚动**: 仅渲染可见区域 (ink-virtual-list)
- **memo化组件**: 避免不必要的重渲染
- **防抖搜索**: 300ms延迟

### 5.3 计算优化

- **并发计算**: Promise.all
- **缓存**: Map<pkgName, size>
- **增量计算**: 仅计算新增的包

---

## 6. 错误处理

### 6.1 分层错误处理

```
UI层: 友好的错误提示
  ▼
Service层: 业务异常处理
  ▼
Manager层: 命令执行异常
  ▼
Utils层: 底层错误捕获
```

### 6.2 错误类型

- **CommandNotFoundError**: 包管理器未安装
- **PermissionDeniedError**: 权限不足
- **ParseError**: 输出解析失败
- **UninstallFailedError**: 卸载失败

### 6.3 降级策略

- Manager不可用 → 隐藏对应标签页
- 输出解析失败 → 显示基础信息,标注"数据不完整"
- 单个包卸载失败 → 继续处理其他包,记录失败原因

---

## 7. 安全性

### 7.1 卸载保护

- **强制预览**: 必须先预览再确认
- **二次确认**: 关键操作弹窗确认
- **仅删顶层包**: 不主动删除依赖目录

### 7.2 命令注入防护

- 使用`execa`的参数数组模式,避免shell注入
- 验证包名格式,拒绝非法字符

---

## 8. 可扩展性

### 8.1 新增包管理器

只需3步:
1. 创建新的Manager类,实现`IPackageManager`
2. 在`managers/index.ts`中注册
3. 添加对应的测试

### 8.2 新增功能

- Service层: 添加新的服务类
- Component层: 添加新的React组件
- Store层: 扩展AppState

---

## 9. 测试策略

### 9.1 测试金字塔

```
     /\
    /  \    E2E Tests (5%)
   /────\
  / Unit \  Integration Tests (25%)
 /  Tests \ 
/   (70%)  \ Unit Tests
────────────
```

### 9.2 测试覆盖

- **单元测试**: 覆盖所有Manager、Service、Utils
- **集成测试**: 覆盖完整流程
- **Mock策略**: Mock shell命令,使用fixtures

---

**文档版本**: v1.0  
**维护者**: Development Team
