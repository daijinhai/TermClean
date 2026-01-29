import React from 'react';
import { Box, Text } from 'ink';
import type { UninstallPreview } from '../types/index.js';
import { formatBytes } from '../utils/format.js';

interface PreviewModalProps {
    preview: UninstallPreview;
    onConfirm: () => void;
    onCancel: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ preview, onConfirm: _onConfirm, onCancel: _onCancel }) => {
    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="yellow"
            padding={1}
            width={70}
        >
            <Box justifyContent="center">
                <Text bold color="yellow">
                    🔍 Preview Uninstall
                </Text>
            </Box>

            <Box flexDirection="column" marginTop={1}>
                <Text>
                    Selected packages (<Text color="yellow">{preview.packages.length}</Text>):
                </Text>
                {preview.packages.slice(0, 5).map((pkg) => (
                    <Text key={pkg.name} dimColor>
                        {'  '}✓ {pkg.name}@{pkg.version} ({pkg.manager})
                    </Text>
                ))}
                {preview.packages.length > 5 && (
                    <Text dimColor>{'  '}... and {preview.packages.length - 5} more</Text>
                )}
            </Box>

            <Box flexDirection="column" marginTop={1}>
                <Text>Will be removed:</Text>
                <Text>
                    {'  '}• {preview.packages.length} main package{preview.packages.length !== 1 ? 's' : ''}
                </Text>
                <Text>
                    {'  '}• Total size: <Text color="green">{formatBytes(preview.totalSize)}</Text>
                </Text>
            </Box>

            <Box flexDirection="column" marginTop={1}>
                <Text>Dependencies (display only, will NOT be removed):</Text>
                <Text>
                    {'  '}• {preview.dependencies.length} dependencies (
                    {formatBytes(preview.dependenciesTotalSize)})
                </Text>
            </Box>

            {preview.affectedPackages.length > 0 && (
                <Box flexDirection="column" marginTop={1}>
                    <Text color="red" bold>
                        ⚠️  WARNING: Affected packages (will remain):
                    </Text>
                    {preview.affectedPackages.slice(0, 3).map((item) => (
                        <Text key={item.package.name} color="yellow">
                            {'  '}• {item.package.name}: {item.reason}
                        </Text>
                    ))}
                </Box>
            )}

            <Box marginTop={1} justifyContent="center">
                <Text>
                    💡 Disk space to be freed: <Text color="green" bold>{formatBytes(preview.totalSize)}</Text>
                </Text>
            </Box>

            <Box marginTop={1} justifyContent="center" gap={2}>
                <Text>
                    <Text backgroundColor="green" color="black">
                        {' '}[C] Confirm & Uninstall{' '}
                    </Text>
                    {'  '}
                    <Text backgroundColor="gray">
                        {' '}[Esc] Cancel{' '}
                    </Text>
                </Text>
            </Box>
        </Box>
    );
};
