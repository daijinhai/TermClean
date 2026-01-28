import React from 'react';
import { Box, Text } from 'ink';
import type { PackageManagerType } from '../types/index.js';

interface TabBarProps {
    activeTab: PackageManagerType | 'all';
    availableManagers: PackageManagerType[];
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, availableManagers }) => {
    const tabs: Array<PackageManagerType | 'all'> = ['all', ...availableManagers];

    return (
        <Box paddingX={1}>
            {tabs.map((tab) => {
                const isActive = tab === activeTab;
                return (
                    <Box key={tab} marginRight={1}>
                        <Text
                            backgroundColor={isActive ? 'blue' : undefined}
                            color={isActive ? 'white' : 'gray'}
                            bold={isActive}
                        >
                            [{tab}]
                        </Text>
                    </Box>
                );
            })}
        </Box>
    );
};
