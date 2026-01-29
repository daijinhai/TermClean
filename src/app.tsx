import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { useAppStore } from './stores/app-store.js';
import { PackageScannerService, PackageCleanerService } from './services/index.js';
import { versionCheckService } from './services/version-check.js';
import { configService } from './services/config.js';
import {
    PackageList,
    StatusBar,
    HelpBar,
    TabBar,
    LoadingSpinner,
    PreviewModal,
    PackageDetails,
    ManagerStatus,
    Dashboard,
} from './components/index.js';
import type { Package, PackageManagerType, UninstallPreview } from './types/index.js';

interface AppProps {
    managerFilter?: string;
    debugMode: boolean;
}

export const App: React.FC<AppProps> = ({ managerFilter, debugMode: _debugMode }) => {
    const { exit } = useApp();
    const store = useAppStore();
    const [scanner] = useState(() => new PackageScannerService());
    const [cleaner] = useState(() => new PackageCleanerService(scanner));
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [availableManagers, setAvailableManagers] = useState<PackageManagerType[]>([]);
    const [preview, setPreview] = useState<UninstallPreview | null>(null);
    const [confirmMode, setConfirmMode] = useState(false); // 快速确认模式
    const [searchMode, setSearchMode] = useState(false); // 搜索模式
    const [searchInput, setSearchInput] = useState(''); // 搜索输入
    const [managerStatuses, setManagerStatuses] = useState<ManagerStatus[]>([]); // 管理器扫描状态

    // 初始化加载
    useEffect(() => {
        const init = async () => {
            store.setIsLoading(true);
            try {
                // 1. 获取可用的包管理器
                const managers = await scanner.getAvailableManagers();
                setAvailableManagers(managers);

                // 初始化状态
                setManagerStatuses(managers.map(m => ({
                    name: m,
                    status: 'pending',
                    count: 0,
                    message: 'Waiting queue...'
                })));

                // 设置过滤器（默认第一个可用管理器）
                if (managerFilter && managerFilter !== 'all') {
                    store.setManagerFilter(managerFilter as PackageManagerType);
                } else if (managers.length > 0 && managers[0]) {
                    store.setManagerFilter(managers[0]);
                }

                // 2. 并行扫描所有包管理器
                const scanPromises = managers.map(async (name) => {
                    // 更新为扫描中
                    setManagerStatuses(prev => prev.map(s =>
                        s.name === name ? { ...s, status: 'scanning', message: 'Scanning...' } : s
                    ));

                    try {
                        const pkgs = await scanner.scanByManager(name);

                        // 更新为完成
                        setManagerStatuses(prev => prev.map(s =>
                            s.name === name ? {
                                ...s,
                                status: 'completed',
                                count: pkgs.length,
                                message: `Found ${pkgs.length} packages`
                            } : s
                        ));

                        return pkgs;
                    } catch (error) {
                        // 更新为失败
                        setManagerStatuses(prev => prev.map(s =>
                            s.name === name ? {
                                ...s,
                                status: 'failed',
                                count: 0,
                                message: 'Scan failed'
                            } : s
                        ));
                        return [];
                    }
                });

                // 等待所有扫描完成
                const results = await Promise.all(scanPromises);
                const allPackages = results.flat();

                // 为了让用户看清动画，人为延迟一小会儿（可选，比如 800ms）
                // await new Promise(resolve => setTimeout(resolve, 800));

                store.setPackages(allPackages);

                // 异步计算包大小（静默）
                calculatePackageSizes(allPackages);

                // 启动版本检查（后台静默运行）
                versionCheckService.checkAll(allPackages, (pkg, result) => {
                    store.updatePackageVersion(pkg.name, result.latestVersion, result.updateAvailable);
                });
            } catch (error) {
                store.setError(error instanceof Error ? error.message : 'Unknown error');
            } finally {
                // 确保动画能展示完整，稍微延迟一下关闭 Loading
                setTimeout(() => store.setIsLoading(false), 500);
            }
        };

        init();
    }, []);

    // 异步计算包大小（静默后台运行）
    const calculatePackageSizes = async (packages: Package[]) => {
        const { getDirectorySize } = await import('./utils/path.js');

        // 分批计算，每批5个，避免阻塞
        const batchSize = 5;
        for (let i = 0; i < packages.length; i += batchSize) {
            const batch = packages.slice(i, i + batchSize);
            await Promise.all(
                batch.map(async (pkg) => {
                    try {
                        const size = await getDirectorySize(pkg.installPath);
                        if (size > 0) {
                            store.updatePackageSize(pkg.name, size);
                        }
                    } catch {
                        // 静默忽略单个包的大小计算错误
                    }
                })
            );
        }
    };


    // 键盘输入处理
    useInput((input, key) => {
        // 快速确认模式处理
        if (confirmMode) {
            if (input === 'y' || input === 'Y') {
                handleQuickUninstall();
            } else {
                setConfirmMode(false);
                store.setError('Uninstall cancelled');
            }
            return;
        }

        // 搜索模式处理
        if (searchMode) {
            if (key.escape || input === 'q' || input === 'Q') {
                // Esc 或 q 退出搜索模式
                setSearchMode(false);
                setSearchInput('');
                store.setSearchQuery('');
                return;
            } else if (key.return) {
                // Enter 确认搜索并退出搜索模式
                setSearchMode(false);
                return;
            } else if (key.backspace || key.delete) {
                const newInput = searchInput.slice(0, -1);
                setSearchInput(newInput);
                store.setSearchQuery(newInput);
                setHighlightedIndex(0);
                return;
            } else if (key.upArrow || key.downArrow || key.tab) {
                // 允许在搜索模式下使用上下键和 Tab，不返回，继续执行后面的逻辑
            } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
                const newInput = searchInput + input;
                setSearchInput(newInput);
                store.setSearchQuery(newInput);
                setHighlightedIndex(0);
                return;
            }
            // 其他情况继续执行后面的逻辑
        }

        // 如果在预览模式
        if (preview) {
            if (input === 'c' || input === 'C') {
                handleConfirmUninstall();
            } else if (key.escape) {
                setPreview(null);
            }
            return;
        }

        // 正常模式
        const filteredPackages = getFilteredPackages();

        if (key.upArrow) {
            setHighlightedIndex(Math.max(0, highlightedIndex - 1));
        } else if (key.downArrow) {
            setHighlightedIndex(Math.min(filteredPackages.length - 1, highlightedIndex + 1));
        } else if (key.tab) {
            // 切换 Tab (在可用管理器之间循环，移除了 all)
            const tabs = availableManagers;
            const currentIndex = tabs.indexOf(store.managerFilter as PackageManagerType);
            const shift = key.shift;

            let nextIndex;
            if (shift) {
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            } else {
                nextIndex = (currentIndex + 1) % tabs.length;
            }

            const nextTab = tabs[nextIndex];
            if (nextTab) {
                store.setManagerFilter(nextTab);
            }
            setHighlightedIndex(0);
            // 切换 Tab 后重置选中位置
        } else if (input === ' ') {
            // 空格选择/取消选择
            const pkg = filteredPackages[highlightedIndex];
            if (pkg) {
                store.togglePackage(pkg.name);
            }
        } else if (input === 'p' || input === 'P') {
            // 预览卸载 (详细预览)
            handlePreview();
        } else if (input === 'g' || input === 'G') {
            // 升级选中的包
            handleUpgrade();
        } else if (input === 'w') {
            // 切换单个包的监控状态（小写w）
            const pkg = filteredPackages[highlightedIndex];
            if (pkg) {
                configService.togglePackageWatch(pkg.name);
                const isWatched = configService.isPackageWatched(pkg.name);
                store.setError(`${isWatched ? '⭐ Watching' : '🚫 Unwatched'} ${pkg.name} for updates`);
            }
        } else if (input === 'W') {
            // 批量监控选中的包（大写W）
            const selectedPkgs = store.packages.filter((pkg) => store.selectedPackages.has(pkg.name));
            if (selectedPkgs.length === 0) {
                store.setError('⚠️ No packages selected. Use [Space] to select packages first.');
            } else {
                // 批量添加到监控列表
                selectedPkgs.forEach(pkg => {
                    if (!configService.isPackageWatched(pkg.name)) {
                        configService.togglePackageWatch(pkg.name);
                    }
                });
                store.setError(`⭐ Watching ${selectedPkgs.length} package(s) for updates`);
            }
        } else if (input === 'u' || input === 'U') {
            // 快速卸载确认
            const selectedPkgs = store.packages.filter((pkg) => store.selectedPackages.has(pkg.name));
            if (selectedPkgs.length === 0) {
                store.setError('⚠️ No packages selected. Use [Space] to select first.');
            } else {
                setConfirmMode(true);
                store.setError(`⚠️ Uninstall ${selectedPkgs.length} package(s)? Press [y] to confirm, any key to cancel`);
            }
        } else if (key.return) {
            // 显示详情 (Enter)
            const pkg = filteredPackages[highlightedIndex];
            if (pkg) {
                store.setError(`Detail: ${pkg.name} | Path: ${pkg.installPath} | Desc: ${pkg.description || 'N/A'}`);
            }
        } else if (input === 'r' || input === 'R') {
            // 刷新
            handleRefresh();
        } else if (input === 'q' || input === 'Q') {
            // 退出
            exit();
        } else if (input === '/' && !searchMode && !preview) {
            setSearchMode(true);
        }

        // Toggle sort order
        if (input === 's' && !searchMode && !preview) {
            // Cycle: name -> size -> date -> name
            if (store.sortBy === 'name') store.toggleSort('size');
            else if (store.sortBy === 'size') store.toggleSort('date');
            else store.toggleSort('name');
        }

        // Toggle update check for selected package
        if (input === 'v' && !searchMode && !preview) {
            const pkg = filteredPackages[highlightedIndex];
            if (pkg) {
                store.toggleUpdateCheck(pkg.name);
            }
        }

        if (input === 'a' || input === 'A') {
            // 全选/取消全选当前过滤的包
            const allSelected = filteredPackages.every((pkg) => store.selectedPackages.has(pkg.name));
            if (allSelected) {
                // 取消全选
                filteredPackages.forEach((pkg) => {
                    if (store.selectedPackages.has(pkg.name)) {
                        store.togglePackage(pkg.name);
                    }
                });
                store.setError(`📋 Deselected all ${filteredPackages.length} packages`);
            } else {
                // 全选
                filteredPackages.forEach((pkg) => {
                    if (!store.selectedPackages.has(pkg.name)) {
                        store.togglePackage(pkg.name);
                    }
                });
                store.setError(`📋 Selected all ${filteredPackages.length} packages`);
            }
        } else if (input === 'i' || input === 'I') {
            // 反选
            filteredPackages.forEach((pkg) => store.togglePackage(pkg.name));
            store.setError(`📋 Inverted selection`);
        }
    });

    const getFilteredPackages = (): Package[] => {
        let filtered = store.packages;

        // 按包管理器过滤
        if (store.managerFilter !== 'all') {
            filtered = filtered.filter((pkg) => pkg.manager === store.managerFilter);
        }

        // 按搜索查询过滤
        if (store.searchQuery) {
            const query = store.searchQuery.toLowerCase();
            filtered = filtered.filter((pkg) => pkg.name.toLowerCase().includes(query));
        }

        return filtered;
    };

    const handlePreview = async () => {
        const selectedPkgs = store.packages.filter((pkg) => store.selectedPackages.has(pkg.name));

        if (selectedPkgs.length === 0) {
            store.setError('No packages selected');
            return;
        }

        try {
            const previewData = await cleaner.previewUninstall(selectedPkgs);
            setPreview(previewData);
        } catch (error) {
            store.setError(error instanceof Error ? error.message : 'Preview failed');
        }
    };

    const handleConfirmUninstall = async () => {
        if (!preview) return;

        setPreview(null);
        store.setIsLoading(true);

        try {
            const results = await cleaner.executeUninstall(preview.packages);
            cleaner.generateLog(preview.packages, results);

            // 获取成功卸载的包名
            const successfullyUninstalled = new Set(
                results.filter((r) => r.success).map((r) => r.package.name)
            );

            // 直接从列表中移除已卸载的包（不重新扫描）
            const remainingPackages = store.packages.filter(
                (pkg) => !successfullyUninstalled.has(pkg.name)
            );
            store.setPackages(remainingPackages);

            // 清除选择
            store.clearSelection();

            // 显示结果
            const successCount = results.filter((r) => r.success).length;
            store.setError(
                `✅ Uninstalled ${successCount}/${results.length} packages successfully!`
            );
        } catch (error) {
            store.setError(error instanceof Error ? error.message : 'Uninstall failed');
        } finally {
            store.setIsLoading(false);
        }
    };

    // 快速卸载（跳过预览）
    const handleQuickUninstall = async () => {
        setConfirmMode(false);
        const selectedPkgs = store.packages.filter((pkg) => store.selectedPackages.has(pkg.name));

        if (selectedPkgs.length === 0) return;

        store.setIsLoading(true);

        try {
            const results = await cleaner.executeUninstall(selectedPkgs);

            // 获取成功卸载的包名
            const successfullyUninstalled = new Set(
                results.filter((r) => r.success).map((r) => r.package.name)
            );

            // 直接从列表中移除已卸载的包（不重新扫描）
            const remainingPackages = store.packages.filter(
                (pkg) => !successfullyUninstalled.has(pkg.name)
            );
            store.setPackages(remainingPackages);

            // 清除选择
            store.clearSelection();

            // 显示结果
            const successCount = results.filter((r) => r.success).length;
            store.setError(
                `✅ Uninstalled ${successCount}/${results.length} packages successfully!`
            );
        } catch (error) {
            store.setError(error instanceof Error ? error.message : 'Uninstall failed');
        } finally {
            store.setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        store.setIsLoading(true);
        try {
            const packages = await scanner.scanAll();
            store.setPackages(packages);
            store.setError('Refreshed successfully');
        } catch (error) {
            store.setError(error instanceof Error ? error.message : 'Refresh failed');
        } finally {
            store.setIsLoading(false);
        }
    };

    const handleUpgrade = async () => {
        const selectedPkgs = store.packages.filter((pkg) => store.selectedPackages.has(pkg.name));

        if (selectedPkgs.length === 0) {
            store.setError('⚠️ No packages selected. Use [Space] to select first.');
            return;
        }

        const upgradeablePkgs = selectedPkgs.filter(pkg => pkg.updateAvailable);
        if (upgradeablePkgs.length === 0) {
            store.setError('📦 No updates available for selected packages');
            return;
        }

        store.setIsLoading(true);

        try {
            const results = [];
            for (const pkg of upgradeablePkgs) {
                const startTime = Date.now();
                try {
                    const manager = scanner.getManager(pkg.manager);
                    if (manager) {
                        await manager.upgrade(pkg.name);
                    }
                    results.push({ success: true, package: pkg, duration: Date.now() - startTime });
                } catch (error) {
                    results.push({
                        success: false,
                        package: pkg,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        duration: Date.now() - startTime
                    });
                }
            }

            // 刷新包列表以获取新版本
            const packages = await scanner.scanAll();
            store.setPackages(packages);
            store.clearSelection();

            // 重新运行版本检查（等待完成后再显示结果）
            await versionCheckService.checkAll(packages, (pkg, result) => {
                store.updatePackageVersion(pkg.name, result.latestVersion, result.updateAvailable);
            });

            // 显示结果
            const successCount = results.filter((r) => r.success).length;
            store.setError(
                `✅ Upgraded ${successCount}/${results.length} packages successfully!`
            );
        } catch (error) {
            store.setError(error instanceof Error ? error.message : 'Upgrade failed');
        } finally {
            store.setIsLoading(false);
        }
    };

    const filteredPackages = getFilteredPackages();

    // 计算选中的包的统计信息
    const selectedPkgs = store.packages.filter((pkg) => store.selectedPackages.has(pkg.name));
    const totalSize = selectedPkgs.reduce((sum, pkg) => sum + pkg.size, 0);
    const dependenciesSize = selectedPkgs.reduce((sum, pkg) => sum + pkg.dependenciesSize, 0);

    // 4. 应用排序
    const sortedPackages = [...filteredPackages].sort((a, b) => {
        const order = store.sortOrder === 'asc' ? 1 : -1;
        if (store.sortBy === 'size') {
            return (a.size - b.size) * order;
        }
        if (store.sortBy === 'date') {
            const dateA = a.installedDate ? a.installedDate.getTime() : 0;
            const dateB = b.installedDate ? b.installedDate.getTime() : 0;
            return (dateA - dateB) * order;
        }
        // Default name sort
        return a.name.localeCompare(b.name) * order;
    });

    const currentPackage = sortedPackages[highlightedIndex];

    // 如果处于 Dashboard 视图，由 Dashboard 组件自己处理 Loading 状态展示
    if (store.currentView === 'dashboard') {
        return <Dashboard isLoading={store.isLoading} statuses={managerStatuses} />;
    }

    // 如果不在 Dashboard 但仍处于 Loading (例如刷新列表)，显示简单 Spinner
    if (store.isLoading) {
        return <LoadingSpinner message="Processing..." />;
    }

    if (preview) {
        return (
            <Box flexDirection="column" padding={1}>
                <PreviewModal
                    preview={preview}
                    onConfirm={handleConfirmUninstall}
                    onCancel={() => setPreview(null)}
                />
            </Box>
        );
    }

    return (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
            {/* 顶部 Header 和 Tabs 整合 */}
            <Box borderStyle="round" borderColor="cyan" paddingX={1} justifyContent="space-between" alignItems="center" marginBottom={1}>
                <Box>
                    <Text bold color="cyan">TERM-CLEAN</Text>
                    <Text dimColor> v2.0</Text>
                </Box>

                <TabBar activeTab={store.managerFilter} availableManagers={availableManagers} />

                <Box width={35} justifyContent="flex-end">
                    {searchMode ? (
                        <Text color="cyan">🔍 <Text bold>{searchInput}</Text>_</Text>
                    ) : (
                        store.searchQuery ? (
                            <Text color="yellow">Filter: {store.searchQuery}</Text>
                        ) : (
                            <Text dimColor>
                                Sort: <Text bold color="green">{store.sortBy.toUpperCase()}</Text> ({store.sortOrder === 'asc' ? '▲' : '▼'}) [s]
                            </Text>
                        )
                    )}
                </Box>
            </Box>

            {/* 主体内容：左右分栏 */}
            <Box flexDirection="row">
                {/* 左侧：包列表 */}
                <Box flexDirection="column" flexGrow={1} marginRight={1}>
                    <CommonHeader count={sortedPackages.length} />
                    <PackageList
                        packages={sortedPackages}
                        selectedPackages={store.selectedPackages}
                        highlightedIndex={highlightedIndex}
                    />
                </Box>

                {/* 右侧：详细信息 */}
                <Box width={40} flexDirection="column">
                    <PackageDetails pkg={currentPackage} />
                </Box>
            </Box>

            {/* 底部状态栏和帮助 */}
            <Box marginTop={1} flexDirection="column">
                <StatusBar
                    selectedCount={store.selectedPackages.size}
                    totalSize={totalSize}
                    dependenciesSize={dependenciesSize}
                />

                {store.error && (
                    <Box marginTop={0} paddingX={1}>
                        <Text color="yellow">💡 {store.error}</Text>
                    </Box>
                )}

                <Box marginTop={0}>
                    <HelpBar />
                </Box>
            </Box>
        </Box>
    );
};

// 辅助组件：列表顶部标题行
const CommonHeader = ({ count }: { count: number }) => (
    <Box paddingX={1} marginBottom={0}>
        <Text>📦 Found <Text color="yellow" bold>{count}</Text> packages</Text>
    </Box>
);
