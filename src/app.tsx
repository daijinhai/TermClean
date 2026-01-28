import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { useAppStore } from './stores/app-store.js';
import { PackageScannerService, PackageCleanerService } from './services/index.js';
import {
    PackageList,
    StatusBar,
    HelpBar,
    TabBar,
    LoadingSpinner,
    PreviewModal,
} from './components/index.js';
import type { Package, PackageManagerType, UninstallPreview } from './types/index.js';

interface AppProps {
    managerFilter?: string;
    debugMode: boolean;
}

export const App: React.FC<AppProps> = ({ managerFilter, debugMode }) => {
    const { exit } = useApp();
    const store = useAppStore();
    const [scanner] = useState(() => new PackageScannerService());
    const [cleaner] = useState(() => new PackageCleanerService(scanner));
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [availableManagers, setAvailableManagers] = useState<PackageManagerType[]>([]);
    const [preview, setPreview] = useState<UninstallPreview | null>(null);

    // 初始化加载
    useEffect(() => {
        const init = async () => {
            store.setIsLoading(true);
            try {
                // 获取可用的包管理器
                const managers = await scanner.getAvailableManagers();
                setAvailableManagers(managers);

                // 设置过滤器
                if (managerFilter && managerFilter !== 'all') {
                    store.setManagerFilter(managerFilter as PackageManagerType);
                }

                // 扫描包
                const packages = await scanner.scanAll();
                store.setPackages(packages);
            } catch (error) {
                store.setError(error instanceof Error ? error.message : 'Unknown error');
            } finally {
                store.setIsLoading(false);
            }
        };

        init();
    }, []);

    // 键盘输入处理
    useInput((input, key) => {
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
        } else if (input === ' ') {
            // 空格选择/取消选择
            const pkg = filteredPackages[highlightedIndex];
            if (pkg) {
                store.togglePackage(pkg.name);
            }
        } else if (input === 'p' || input === 'P') {
            // 预览卸载
            handlePreview();
        } else if (input === 'r' || input === 'R') {
            // 刷新
            handleRefresh();
        } else if (input === 'q' || input === 'Q') {
            // 退出
            exit();
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
            const log = cleaner.generateLog(preview.packages, results);

            // 清除选择
            store.clearSelection();

            // 刷新包列表
            const packages = await scanner.scanAll();
            store.setPackages(packages);

            // 显示结果
            const successCount = results.filter((r) => r.success).length;
            store.setError(
                `Uninstalled ${successCount}/${results.length} packages. Log saved.`
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

    const filteredPackages = getFilteredPackages();

    // 计算选中的包的统计信息
    const selectedPkgs = store.packages.filter((pkg) => store.selectedPackages.has(pkg.name));
    const totalSize = selectedPkgs.reduce((sum, pkg) => sum + pkg.size, 0);
    const dependenciesSize = selectedPkgs.reduce((sum, pkg) => sum + pkg.dependenciesSize, 0);

    if (store.isLoading) {
        return <LoadingSpinner message="Scanning packages..." />;
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
        <Box flexDirection="column" padding={1}>
            {/* 标题栏 */}
            <Box borderStyle="round" borderColor="green" paddingX={1}>
                <Text bold color="green">
                    term-clean v1.0
                </Text>
                <Text> - Package Manager Cleaner</Text>
            </Box>

            {/* 标签栏 */}
            <Box marginTop={1}>
                <TabBar activeTab={store.managerFilter} availableManagers={availableManagers} />
            </Box>

            {/* 包列表 */}
            <Box marginTop={1} flexDirection="column">
                <Box paddingX={1}>
                    <Text>
                        📦 Packages (<Text color="yellow">{filteredPackages.length}</Text> total)
                    </Text>
                </Box>

                <Box marginTop={1}>
                    <PackageList
                        packages={filteredPackages}
                        selectedPackages={store.selectedPackages}
                        highlightedIndex={highlightedIndex}
                        onToggle={store.togglePackage}
                    />
                </Box>
            </Box>

            {/* 状态栏 */}
            <Box marginTop={1}>
                <StatusBar
                    selectedCount={store.selectedPackages.size}
                    totalSize={totalSize}
                    dependenciesSize={dependenciesSize}
                />
            </Box>

            {/* 帮助栏 */}
            <Box marginTop={1}>
                <HelpBar />
            </Box>

            {/* 错误信息 */}
            {store.error && (
                <Box marginTop={1} paddingX={1}>
                    <Text color="yellow">💡 {store.error}</Text>
                </Box>
            )}

            {/* 调试信息 */}
            {debugMode && (
                <Box marginTop={1} paddingX={1}>
                    <Text dimColor>
                        Debug: Highlighted={highlightedIndex} Managers={availableManagers.join(',')}
                    </Text>
                </Box>
            )}
        </Box>
    );
};
