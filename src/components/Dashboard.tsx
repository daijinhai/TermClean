import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppStore } from '../stores/app-store.js';
import { formatBytes } from '../utils/format.js';

const LOGO = `
  _______                  _____ _                 
 |__   __|                / ____| |                
    | | ___ _ __ _ __ ___| |    | | ___  __ _ _ __ 
    | |/ _ \\ '__| '_ \` _ \\ |    | |/ _ \\/ _\` | '_ \\
    | |  __/ |  | | | | | | |____| |  __/ (_| | | | |
    |_|\\___|_|  |_| |_| |_|\\_____|_|\\___|\\__,_|_| |_|
`;

export const Dashboard: React.FC = () => {
    const { packages, setCurrentView } = useAppStore();
    const [blink, setBlink] = useState(true);

    useInput((input, key) => {
        if (key.return) {
            setCurrentView('list');
        }
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setBlink(b => !b);
        }, 800);
        return () => clearInterval(timer);
    }, []);

    const totalSize = packages.reduce((sum, pkg) => sum + pkg.size, 0);
    const byManager = packages.reduce((acc, pkg) => {
        acc[pkg.manager] = (acc[pkg.manager] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <Box flexDirection="column" alignItems="center" paddingY={2}>
            <Box marginBottom={2}>
                <Text color="cyan" bold>{LOGO}</Text>
            </Box>

            <Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1} marginBottom={2}>
                <Box marginRight={4} flexDirection="column" alignItems="center">
                    <Text color="gray">TOTAL SIZE</Text>
                    <Text bold color="yellow" backgroundColor="black"> {totalSize > 0 ? formatBytes(totalSize) : 'Calculating...'} </Text>
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
            <Box marginTop={1}>
                <Text dimColor>v2.0 - Optimized for Speed & Clarity</Text>
            </Box>
        </Box>
    );
};
