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

            <Box marginBottom={1} flexDirection="column">
                <Box>
                    <Text color="green">v{pkg.version}</Text>
                    {pkg.isGlobal && <Text dimColor> (Global)</Text>}
                    {pkg.isDev && <Text dimColor> (Dev)</Text>}
                </Box>
                {pkg.updateAvailable && pkg.latestVersion && (
                    <Box marginTop={0}>
                        <Text color="yellow">⬆️  Latest: </Text>
                        <Text bold color="green">v{pkg.latestVersion}</Text>
                    </Box>
                )}
                {pkg.latestVersion && !pkg.updateAvailable && (
                    <Box marginTop={0}>
                        <Text dimColor>✓ Up to date</Text>
                    </Box>
                )}
            </Box>

            <Box marginBottom={1}>
                <Text>{pkg.description || 'No description available.'}</Text>
            </Box>

            <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderBottom={true} borderColor="gray" marginBottom={1} />

            <Box flexDirection="column">
                <Box>
                    <Box width={10}><Text bold>Manager:</Text></Box>
                    <Text>{pkg.manager}</Text>
                </Box>
                <Box>
                    <Box width={10}><Text bold>Size:</Text></Box>
                    <Text>{pkg.size > 0 ? formatBytes(pkg.size) : 'Calculated...'}</Text>
                </Box>
                <Box>
                    <Box width={10}><Text bold>Installed:</Text></Box>
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
