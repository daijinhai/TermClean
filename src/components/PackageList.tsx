import React from 'react';
import { Box, Text } from 'ink';
import type { Package } from '../types/index.js';
import { formatBytes, formatDate } from '../utils/format.js';

interface PackageListProps {
    packages: Package[];
    selectedPackages: Set<string>;
    highlightedIndex: number;
    onToggle: (packageName: string) => void;
}

export const PackageList: React.FC<PackageListProps> = ({
    packages,
    selectedPackages,
    highlightedIndex,
}) => {
    if (packages.length === 0) {
        return (
            <Box padding={1}>
                <Text dimColor>No packages found</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column">
            {packages.slice(0, 10).map((pkg, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = selectedPackages.has(pkg.name);

                return (
                    <Box key={pkg.name} paddingLeft={1}>
                        <Text
                            backgroundColor={isHighlighted ? 'blue' : undefined}
                            color={isHighlighted ? 'white' : undefined}
                        >
                            {isHighlighted ? '● ' : '○ '}
                            {pkg.name}@{pkg.version}
                            {' '.repeat(Math.max(0, 30 - pkg.name.length - pkg.version.length))}
                            {formatBytes(pkg.size)} │ {formatBytes(pkg.dependenciesSize)}
                            {'  '}
                            {formatDate(pkg.installedDate)}
                            {'  '}
                            {isSelected ? '[✓]' : '[ ]'}
                        </Text>
                    </Box>
                );
            })}

            {packages.length > 10 && (
                <Box paddingLeft={1}>
                    <Text dimColor>... (showing 10 of {packages.length})</Text>
                </Box>
            )}
        </Box>
    );
};
