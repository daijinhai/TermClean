import React from 'react';
import { Box, Text } from 'ink';
import type { Package } from '../types/index.js';
import { formatBytes, formatDate } from '../utils/format.js';

const WINDOW_SIZE = 15; // 每屏显示的包数量

interface PackageListProps {
    packages: Package[];
    selectedPackages: Set<string>;
    highlightedIndex: number;
}

import { useAppStore } from '../stores/app-store.js';

const ColumnHeader = () => {
    const { sortBy, sortOrder } = useAppStore();

    // Helper to render sort indicator
    const renderHeader = (label: string, field: 'name' | 'size' | 'date') => {
        const isSorted = sortBy === field;
        const arrow = isSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '';
        return (
            <Text bold color={isSorted ? 'green' : 'gray'}>
                {label} {arrow}
            </Text>
        );
    };

    return (
        <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderBottom={true} borderColor="gray" paddingX={1} marginBottom={0}>
            <Box width={4}><Text bold color="gray">   </Text></Box>
            <Box width="35%">{renderHeader('NAME', 'name')}</Box>
            <Box width="20%"><Text bold color="gray">VERSION</Text></Box>
            <Box width="15%">{renderHeader('SIZE', 'size')}</Box>
            <Box width="25%">{renderHeader('INSTALLED', 'date')}</Box>
        </Box>
    );
};

export const PackageList: React.FC<PackageListProps> = ({
    packages,
    selectedPackages,
    highlightedIndex,
}) => {
    if (packages.length === 0) {
        return (
            <Box padding={1} borderStyle="single" borderColor="gray">
                <Text dimColor>No packages found</Text>
            </Box>
        );
    }

    // 计算滚动窗口
    let startIndex = 0;
    if (highlightedIndex >= WINDOW_SIZE - 2) {
        startIndex = Math.min(highlightedIndex - WINDOW_SIZE + 3, packages.length - WINDOW_SIZE);
    }
    startIndex = Math.max(0, startIndex);
    const endIndex = Math.min(startIndex + WINDOW_SIZE, packages.length);
    const visiblePackages = packages.slice(startIndex, endIndex);

    return (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" flexGrow={1}>
            <ColumnHeader />

            {visiblePackages.map((pkg, visibleIdx) => {
                const actualIndex = startIndex + visibleIdx;
                const isHighlighted = actualIndex === highlightedIndex;
                const isSelected = selectedPackages.has(pkg.name);

                const sizeStr = pkg.size > 0 ? formatBytes(pkg.size) : '—';

                return (
                    <Box key={pkg.name} paddingX={1} backgroundColor={isHighlighted ? 'cyan' : undefined}>
                        {/* 状态列 */}
                        <Box width={4}>
                            <Text color={isHighlighted ? 'black' : (isSelected ? 'green' : 'gray')}>
                                {isSelected ? '◉' : '○'}
                            </Text>
                        </Box>

                        {/* 名称列 */}
                        <Box width="35%">
                            <Text color={isHighlighted ? 'black' : 'white'} bold={isSelected}>
                                {pkg.name.length > 25 ? pkg.name.substring(0, 24) + '…' : pkg.name}
                            </Text>
                        </Box>

                        {/* 版本列 */}
                        <Box width="20%">
                            <Text color={isHighlighted ? 'black' : 'gray'}>
                                {pkg.version.length > 15 ? pkg.version.substring(0, 14) + '…' : pkg.version}
                            </Text>
                        </Box>

                        {/* 大小列 */}
                        <Box width="15%">
                            <Text color={isHighlighted ? 'black' : 'yellow'}>{sizeStr}</Text>
                        </Box>

                        {/* 日期列 */}
                        <Box width="25%">
                            <Text color={isHighlighted ? 'black' : 'gray'}>{formatDate(pkg.installedDate)}</Text>
                        </Box>
                    </Box>
                );
            })}

            {/* 滚动条指示器 (保留在表格底部) */}
            <Box marginTop={0} paddingX={1} borderStyle="single" borderBottom={false} borderLeft={false} borderRight={false} borderTop={true} borderColor="gray">
                <Text dimColor>
                    Showing {startIndex + 1}-{endIndex} of {packages.length}
                </Text>
                <Box flexGrow={1} />
                <Text dimColor>{Math.round((endIndex / packages.length) * 100)}%</Text>
            </Box>
        </Box>
    );
};
