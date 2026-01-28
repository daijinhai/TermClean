import React from 'react';
import { Box, Text } from 'ink';
import { formatBytes } from '../utils/format.js';

interface StatusBarProps {
    selectedCount: number;
    totalSize: number;
    dependenciesSize: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    selectedCount,
    totalSize,
    dependenciesSize,
}) => {
    return (
        <Box borderStyle="single" borderColor="gray" paddingX={1}>
            <Text>
                Selected: <Text color="yellow">{selectedCount}</Text> package{selectedCount !== 1 ? 's' : ''} │
                Total Size: <Text color="green">{formatBytes(totalSize)}</Text> │
                Deps: <Text color="cyan">{formatBytes(dependenciesSize)}</Text> (display only)
            </Text>
        </Box>
    );
};
