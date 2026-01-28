# term-clean 测试策略文档

**版本**: v1.0  
**日期**: 2026-01-28

---

## 1. 测试目标

### 1.1 质量目标
- **代码覆盖率**: ≥ 80%
- **单元测试**: 覆盖所有业务逻辑
- **集成测试**: 覆盖主要用户流程
- **Bug率**: < 5个/KLOC

### 1.2 性能目标
- 启动时间 < 2秒
- 1000个包加载时间 < 3秒
- 搜索响应时间 < 100ms

---

## 2. 测试金字塔

```
       /\
      /E2E\      端到端测试 (5%)
     /────\      - 完整用户流程
    /      \     - Browser/CLI测试
   /  集成  \    集成测试 (25%)
  /  测试   \   - 服务间集成
 /          \   - 数据流测试
/   单元测试  \  单元测试 (70%)
──────────────  - Manager测试
                - Service测试
                - Utils测试
```

---

## 3. 单元测试 (70%)

### 3.1 测试范围

#### 3.1.1 包管理器层 (Managers)

**文件**: `tests/unit/managers/*.test.ts`

测试每个PackageManager的:
- ✅ `isAvailable()` - 检测是否安装
- ✅ `listPackages()` - 列出包,解析输出
- ✅ `getPackageInfo()` - 获取包详情
- ✅ `getDependencies()` - 解析依赖
- ✅ `calculateSize()` - 计算大小
- ✅ `uninstall()` - 卸载逻辑

**示例**:
```typescript
// tests/unit/managers/brew.test.ts
import { describe, it, expect, vi } from 'vitest';
import { BrewPackageManager } from '@/managers/brew';
import * as command from '@/utils/command';

describe('BrewPackageManager', () => {
  it('should detect if brew is available', async () => {
    vi.spyOn(command, 'executeCommand').mockResolvedValue({
      stdout: 'Homebrew 4.0.0',
      stderr: '',
      exitCode: 0,
      success: true,
    });

    const manager = new BrewPackageManager();
    const available = await manager.isAvailable();

    expect(available).toBe(true);
    expect(command.executeCommand).toHaveBeenCalledWith('brew', ['--version']);
  });

  it('should list all formula packages', async () => {
    const mockOutput = 'node 22.0.0\npython 3.12.0';
    vi.spyOn(command, 'executeCommand').mockResolvedValue({
      stdout: mockOutput,
      stderr: '',
      exitCode: 0,
      success: true,
    });

    const manager = new BrewPackageManager();
    const packages = await manager.listPackages();

    expect(packages).toHaveLength(2);
    expect(packages[0].name).toBe('node');
    expect(packages[0].version).toBe('22.0.0');
  });

  // ... 更多测试
});
```

#### 3.1.2 服务层 (Services)

**文件**: `tests/unit/services/*.test.ts`

**Scanner测试**:
```typescript
describe('PackageScannerService', () => {
  it('should scan all available managers', async () => {
    const mockManagers = [mockBrewManager, mockNpmManager];
    const scanner = new PackageScannerService(mockManagers);
    
    const packages = await scanner.scanAll();
    
    expect(packages).toHaveLength(expectedTotal);
  });

  it('should handle manager unavailable gracefully', async () => {
    // Mock一个manager返回false
    // 验证不会抛出异常,且结果中不包含该manager的包
  });
});
```

**Analyzer测试**:
```typescript
describe('DependencyAnalyzerService', () => {
  it('should build correct dependency graph', () => {
    const packages = [
      { name: 'A', dependencies: ['B', 'C'] },
      { name: 'B', dependencies: [] },
      { name: 'C', dependencies: ['B'] },
    ];

    const analyzer = new DependencyAnalyzerService();
    const graph = analyzer.buildDependencyGraph(packages);

    expect(graph.get('B')).toEqual(['A', 'C']);
    expect(graph.get('C')).toEqual(['A']);
  });

  it('should detect circular dependencies', () => {
    const packages = [
      { name: 'A', dependencies: ['B'] },
      { name: 'B', dependencies: ['A'] },
    ];

    const analyzer = new DependencyAnalyzerService();
    const circular = analyzer.detectCircularDependencies(packages);

    expect(circular).toHaveLength(1);
    expect(circular[0]).toEqual(['A', 'B', 'A']);
  });

  it('should distinguish exclusive vs shared dependencies', () => {
    const packages = [
      { name: 'A', dependencies: ['C'] },
      { name: 'B', dependencies: ['C', 'D'] },
    ];

    const analyzer = new DependencyAnalyzerService();
    const types = analyzer.analyzeDependencyTypes(packages);

    expect(types.get('C')!.type).toBe('SHARED');
    expect(types.get('D')!.type).toBe('EXCLUSIVE');
  });
});
```

**Calculator测试**:
```typescript
describe('DiskUsageCalculatorService', () => {
  it('should calculate package size correctly', async () => {
    vi.spyOn(command, 'executeCommand').mockResolvedValue({
      stdout: '12345  /path/to/pkg',
      exitCode: 0,
      success: true,
    });

    const calculator = new DiskUsageCalculatorService();
    const size = await calculator.calculateSize('test-pkg');

    expect(size).toBe(12345 * 1024); // du -sk returns KB
  });

  it('should format size in human readable format', () => {
    const calculator = new DiskUsageCalculatorService();

    expect(calculator.formatSize(1024)).toBe('1.00 KB');
    expect(calculator.formatSize(1024 * 1024)).toBe('1.00 MB');
    expect(calculator.formatSize(1024 * 1024 * 1024)).toBe('1.00 GB');
  });
});
```

**Cleaner测试**:
```typescript
describe('PackageCleanerService', () => {
  it('should preview uninstall correctly', async () => {
    const packages = [mockPackage1, mockPackage2];
    const cleaner = new PackageCleanerService(mockManagers);

    const preview = await cleaner.previewUninstall(packages);

    expect(preview.packages).toHaveLength(2);
    expect(preview.totalSize).toBeGreaterThan(0);
    expect(preview.affectedPackages).toBeDefined();
  });

  it('should generate warnings for critical packages', async () => {
    const criticalPackage = { name: 'node', dependencies: [] };
    const cleaner = new PackageCleanerService(mockManagers);

    const preview = await cleaner.previewUninstall([criticalPackage]);

    expect(preview.warnings).toContain(
      expect.stringContaining('may break')
    );
  });
});
```

#### 3.1.3 工具函数 (Utils)

**Command测试**:
```typescript
describe('executeCommand', () => {
  it('should execute command successfully', async () => {
    const result = await executeCommand('echo', ['hello']);

    expect(result.success).toBe(true);
    expect(result.stdout).toContain('hello');
    expect(result.exitCode).toBe(0);
  });

  it('should handle command not found', async () => {
    await expect(
      executeCommand('nonexistent-command', [])
    ).rejects.toThrow(CommandNotFoundError);
  });

  it('should handle timeout', async () => {
    await expect(
      executeCommand('sleep', ['10'], { timeout: 100 })
    ).rejects.toThrow(TimeoutError);
  });
});
```

**Format测试**:
```typescript
describe('formatSize', () => {
  it('should format bytes correctly', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(1023)).toBe('1023 B');
    expect(formatSize(1024)).toBe('1.00 KB');
  });
});

describe('formatDate', () => {
  it('should format date in default format', () => {
    const date = new Date('2024-01-15T10:30:00');
    expect(formatDate(date)).toBe('2024-01-15');
  });
});
```

### 3.2 Mock策略

#### 3.2.1 Mock命令执行
```typescript
// tests/mocks/command.ts
export const mockCommandOutput = {
  brew: {
    version: 'Homebrew 4.0.0',
    listFormula: 'node 22.0.0\npython 3.12.0',
    listCask: 'docker 4.15.0',
    info: JSON.stringify({ ... }),
  },
  npm: {
    list: JSON.stringify({ dependencies: { ... } }),
  },
  // ...
};
```

#### 3.2.2 Mock文件系统
```typescript
import { vi } from 'vitest';
import fs from 'fs-extra';

vi.mock('fs-extra', () => ({
  readFile: vi.fn(),
  pathExists: vi.fn(),
  // ...
}));
```

### 3.3 测试覆盖率要求

| 模块 | 目标覆盖率 |
|------|-----------|
| Managers | ≥ 85% |
| Services | ≥ 90% |
| Utils | ≥ 95% |
| Components | ≥ 70% |

---

## 4. 集成测试 (25%)

### 4.1 服务集成测试

**文件**: `tests/integration/services.test.ts`

```typescript
describe('Service Integration', () => {
  it('should scan → analyze → calculate workflow', async () => {
    // 1. 扫描包
    const scanner = new PackageScannerService(realManagers);
    const packages = await scanner.scanAll();

    // 2. 分析依赖
    const analyzer = new DependencyAnalyzerService();
    const graph = analyzer.buildDependencyGraph(packages);

    // 3. 计算大小
    const calculator = new DiskUsageCalculatorService();
    const sizes = await calculator.calculateBatchSizes(packages);

    // 验证结果
    expect(packages).not.toHaveLength(0);
    expect(graph.size).toBeGreaterThan(0);
    expect(sizes.size).toBe(packages.length);
  });
});
```

### 4.2 端到端流程测试

**文件**: `tests/integration/e2e.test.ts`

```typescript
describe('End-to-End Flow', () => {
  it('should complete full uninstall workflow', async () => {
    // 准备: 创建测试包(使用fixtures)
    const testPkg = await createTestPackage();

    // 1. 扫描
    const scanner = new PackageScannerService(managers);
    const packages = await scanner.scanAll();
    expect(packages.some(p => p.name === testPkg.name)).toBe(true);

    // 2. 选择包
    const toUninstall = [testPkg];

    // 3. 预览
    const cleaner = new PackageCleanerService(managers);
    const preview = await cleaner.previewUninstall(toUninstall);
    expect(preview.packages).toHaveLength(1);

    // 4. 执行卸载
    const result = await cleaner.executeUninstall(toUninstall, managers);
    expect(result.success).toBe(true);
    expect(result.succeeded).toContain(testPkg.name);

    // 5. 验证已删除
    const packagesAfter = await scanner.scanAll();
    expect(packagesAfter.some(p => p.name === testPkg.name)).toBe(false);
  });
});
```

---

## 5. UI组件测试

### 5.1 组件测试策略

使用`ink-testing-library`进行组件测试:

```typescript
import { render } from 'ink-testing-library';
import { PackageList } from '@/components/PackageList';

describe('PackageList Component', () => {
  it('should render package list', () => {
    const { lastFrame } = render(
      <PackageList packages={mockPackages} />
    );

    expect(lastFrame()).toContain('node@22');
    expect(lastFrame()).toContain('python@3.12');
  });

  it('should handle empty list', () => {
    const { lastFrame } = render(<PackageList packages={[]} />);

    expect(lastFrame()).toContain('No packages found');
  });
});
```

### 5.2 交互测试

```typescript
import { render } from 'ink-testing-library';
import { App } from '@/app';

describe('User Interactions', () => {
  it('should select package with space key', async () => {
    const { stdin, lastFrame } = render(<App />);

    // 模拟按下Space键
    stdin.write(' ');

    await waitFor(() => {
      expect(lastFrame()).toContain('● node'); // ● 表示选中
    });
  });

  it('should navigate with arrow keys', async () => {
    const { stdin, lastFrame } = render(<App />);

    stdin.write('\x1B[B'); // Down arrow

    await waitFor(() => {
      expect(lastFrame()).toContain('highlighted package');
    });
  });
});
```

---

## 6. 性能测试

### 6.1 加载性能测试

```typescript
describe('Performance', () => {
  it('should load 1000 packages within 3 seconds', async () => {
    const packages = generateMockPackages(1000);

    const start = Date.now();
    const scanner = new PackageScannerService(mockManagers);
    await scanner.scanAll();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });

  it('should search within 100ms', async () => {
    const packages = generateMockPackages(1000);
    const store = createStore(packages);

    const start = Date.now();
    store.setSearchQuery('node');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
```

### 6.2 内存测试

```typescript
it('should not leak memory during batch calculation', async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  for (let i = 0; i < 100; i++) {
    await calculator.calculateBatchSizes(packages);
  }

  global.gc(); // 需要--expose-gc运行

  const finalMemory = process.memoryUsage().heapUsed;
  const growth = finalMemory - initialMemory;

  expect(growth).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

---

## 7. 测试数据 (Fixtures)

### 7.1 目录结构

```
tests/
└── fixtures/
    ├── brew/
    │   ├── list-formula.txt
    │   ├── list-cask.txt
    │   └── info-node.json
    ├── npm/
    │   └── list-global.json
    ├── pip/
    │   └── list.json
    └── packages/
        └── mock-packages.ts
```

### 7.2 Mock包数据

```typescript
// tests/fixtures/packages/mock-packages.ts
export const mockPackages: Package[] = [
  {
    name: 'node',
    version: '22.0.0',
    manager: PackageManagerType.BREW_FORMULA,
    size: {
      main: 120 * 1024 * 1024,
      dependencies: 240 * 1024 * 1024,
      exclusive: 0,
      shared: 240 * 1024 * 1024,
      total: 360 * 1024 * 1024,
    },
    installPath: '/opt/homebrew/Cellar/node/22.0.0',
    installedDate: new Date('2024-01-10'),
    lastModified: new Date('2024-01-15'),
    isSelected: false,
    dependencies: ['icu4c', 'libnghttp2'],
  },
  // ... 更多mock数据
];
```

---

## 8. CI/CD集成

### 8.1 GitHub Actions配置

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### 8.2 测试脚本

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --run tests/unit",
    "test:integration": "vitest --run tests/integration",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## 9. 测试最佳实践

### 9.1 命名约定
- 测试文件: `*.test.ts`
- Mock文件: `*.mock.ts`
- Fixture文件: `*.fixture.ts`

### 9.2 测试结构
```typescript
describe('Component/Service Name', () => {
  // Setup
  beforeEach(() => {
    // 准备测试环境
  });

  // Teardown
  afterEach(() => {
    // 清理
  });

  describe('Method/Feature Name', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = ...;

      // Act
      const result = doSomething(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### 9.3 断言原则
- 一个测试只验证一个行为
- 使用具体的断言而非通用断言
- 提供清晰的错误消息

---

## 10. 测试检查清单

### 10.1 单元测试检查
- [ ] 所有Manager实现已测试
- [ ] 所有Service方法已测试
- [ ] 所有Utils函数已测试
- [ ] 边界条件已覆盖
- [ ] 异常处理已测试

### 10.2 集成测试检查
- [ ] 主要用户流程已测试
- [ ] 服务间集成已测试
- [ ] 数据流已验证

### 10.3 性能测试检查
- [ ] 启动时间已验证
- [ ] 加载性能已验证
- [ ] 搜索性能已验证
- [ ] 内存泄漏已检查

### 10.4 发布前检查
- [ ] 覆盖率达标 (≥80%)
- [ ] 所有测试通过
- [ ] 无ESLint错误
- [ ] 无TypeScript错误
- [ ] CI/CD通过

---

**文档版本**: v1.0  
**维护者**: QA Team
