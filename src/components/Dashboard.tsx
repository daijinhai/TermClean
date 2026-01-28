import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppStore } from '../stores/app-store.js';
import { formatBytes } from '../utils/format.js';
import type { ManagerStatus } from './ManagerStatus.js';

const LOGO = `
  _______                  _____ _                 
 |__   __|                / ____| |                
    | | ___ _ __ _ __ ___| |    | | ___  __ _ _ __ 
    | |/ _ \\ '__| '_ \` _ \\ |    | |/ _ \\/ _\` | '_ \\
    | |  __/ |  | | | | | | |____| |  __/ (_| | | | |
    |_|\\___|_|  |_| |_| |_|\\_____|_|\\___|\\__,_|_| |_|
`;

interface DashboardProps {
    isLoading?: boolean;
    statuses?: ManagerStatus[];
}

export const Dashboard: React.FC<DashboardProps> = ({ isLoading = false, statuses = [] }) => {
    const { packages, setCurrentView } = useAppStore();
    const [blink, setBlink] = useState(true);
    const [progressChar, setProgressChar] = useState(0);

    useInput((input, key) => {
        if (!isLoading && key.return) {
            setCurrentView('list');
        }
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setBlink(b => !b);
            setProgressChar((p) => (p + 1) % 20);
        }, isLoading ? 100 : 800);
        return () => clearInterval(timer);
    }, [isLoading]);

    const totalSize = packages.reduce((sum, pkg) => sum + pkg.size, 0);
    const byManager = packages.reduce((acc, pkg) => {
        acc[pkg.manager] = (acc[pkg.manager] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Progress Calculation
    const completedCount = statuses.filter(s => s.status === 'completed' || s.status === 'failed').length;
    const totalCount = statuses.length;
    const percentage = totalCount > 0 ? Math.floor((completedCount / totalCount) * 100) : 0;
    const barLength = 30;
    const filledLength = Math.floor((percentage / 100) * barLength);
    const bar = '▓'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    return (
        <Box flexDirection="column" alignItems="center" paddingY={2} height="100%">
            <Box marginBottom={2}>
                <Text color="cyan" bold>{LOGO}</Text>
            </Box>

            {/* Loading View */}
            {isLoading ? (
                <Box flexDirection="column" alignItems="center" borderStyle="round" borderColor="yellow" paddingX={2} paddingY={1}>
                    <Text bold color="yellow">SYSTEM SCANNING IN PROGRESS...</Text>
                    <Box marginTop={1} marginBottom={1}>
                        <Text color="cyan">[{bar}] {percentage}%</Text>
                    </Box>
                    <Box flexDirection="column" alignItems="flex-start" width={40}>
                        {statuses.map(s => (
                            <Box key={s.name} justifyContent="space-between" width="100%">
                                <Text> {s.name.toUpperCase()} </Text>
                                {s.status === 'scanning' ? <Text color="yellow">Scanning...</Text> :
                                    s.status === 'completed' ? <Text color="green">Done</Text> :
                                        s.status === 'failed' ? <Text color="red">Failed</Text> : <Text color="gray">Waiting</Text>}
                            </Box>
                        ))}
                    </Box>
                </Box>
            ) : (
                /* Result View */
                <>
                    <Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1} marginBottom={2}>
                        <Box marginRight={4} flexDirection="column" alignItems="center">
                            <Text color="gray">TOTAL SIZE</Text>
                            <Text bold color="yellow" backgroundColor="black"> {totalSize > 0 ? formatBytes(totalSize) : 'Calculation Done'} </Text>
                        </Box>
                        <Box flexDirection="column" alignItems="center">
                            <Text color="gray">PACKAGES</Text>
                            <Text bold color="white">{packages.length}</Text>
                        </Box>
                    </Box>

                    <Box marginBottom={3} flexDirection="row" gap={2}>
                        {Object.entries(byManager).map(([manager, count]) => (
                            <Box key={manager} borderStyle="single" borderColor="gray" paddingX={1}>
                                <Text>{manager}: <Text bold color="cyan">{count}</Text></Text>
                            </Box>
                        ))}
                    </Box>

                    <Box>
                        <Text dimColor={!blink} bold color="green">Press [Enter] to Start Cleaning</Text>
                    </Box>
                </>
            )}

            <Box marginTop={1}>
                <Text dimColor>v2.0 - Optimized for Speed & Clarity</Text>
            </Box>
        </Box>
    );
};
