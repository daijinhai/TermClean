import React from 'react';
import { Box, Text } from 'ink';
import type { Package } from '../types/index.js';
import { formatBytes, formatDate } from '../utils/format.js';

interface PackageDetailsProps {
    pkg?: Package;
}

export const PackageDetails: React.FC<PackageDetailsProps> = ({ pkg }) => {
    if (!pkg) {
        return (
            <Box flexDirection="column" paddingX={1} borderStyle="single" borderColor="gray">
                <Text dimColor>Select a package to view details</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" paddingX={1} borderStyle="single" borderColor="cyan">
            <Box marginBottom={1}>
                <Text bold color="cyan" backgroundColor="black">
                    📦 {pkg.name.toUpperCase()}
                </Text>
            </Box>

            <Box marginBottom={1}>
                <Text color="green">v{pkg.version}</Text>
                {pkg.isGlobal && <Text dimColor> (Global)</Text>}
                {pkg.isDev && <Text dimColor> (Dev)</Text>}
            </Box>

            <Box marginBottom={1}>
                <Text>{pkg.description || 'No description available.'}</Text>
            </Box>

            <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderBottom={true} borderColor="gray" marginBottom={1} />

            <Box flexDirection="column">
                <Box>
                    <Text bold width={10}>Manager:</Text>
                    <Text>{pkg.manager}</Text>
                </Box>
                <Box>
                    <Text bold width={10}>Size:</Text>
                    <Text>{pkg.size > 0 ? formatBytes(pkg.size) : 'Calculated...'}</Text>
                </Box>
                <Box>
                    <Text bold width={10}>Installed:</Text>
                    <Text>{formatDate(pkg.installedDate)}</Text>
                </Box>
                <Box marginTop={1}>
                    <Text bold>Path:</Text>
                </Box>
                <Box>
                    <Text dimColor wrap="wrap">{pkg.installPath}</Text>
                </Box>
            </Box>
        </Box>
    );
};
