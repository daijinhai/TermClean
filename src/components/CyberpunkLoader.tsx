import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { PackageManagerType } from '../types/index.js';

export interface ManagerStatus {
    name: PackageManagerType;
    status: 'pending' | 'scanning' | 'completed' | 'failed';
    count: number;
    message: string;
}

interface CyberpunkLoaderProps {
    statuses: ManagerStatus[];
}

export const CyberpunkLoader: React.FC<CyberpunkLoaderProps> = ({ statuses }) => {
    const [progressChar, setProgressChar] = useState(0);
    const [dots, setDots] = useState('');

    // 动画效果
    useEffect(() => {
        const timer = setInterval(() => {
            setProgressChar((prev) => (prev + 1) % 20);
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
        }, 100);
        return () => clearInterval(timer);
    }, []);

    // 计算总进度条
    const completedCount = statuses.filter(s => s.status === 'completed' || s.status === 'failed').length;
    const totalCount = statuses.length;
    const percentage = totalCount > 0 ? Math.floor((completedCount / totalCount) * 100) : 0;

    // 生成进度条字符串 [▓▓▓▓░░░░]
    const barLength = 20;
    const filledLength = Math.floor((percentage / 100) * barLength);
    const bar = '▓'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    return (
        <Box flexDirection="column" padding={1}>
            <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={2} paddingY={1}>
                <Box marginBottom={1}>
                    <Text bold color="cyan">╭── SYSTEM DIAGNOSTIC ──────────────────────────────╮</Text>
                </Box>

                {statuses.map((m) => (
                    <Box key={m.name} marginBottom={0}>
                        <Text color="cyan">│  ⚡ {m.name.toUpperCase().padEnd(6)} </Text>
                        <Box width={8}>
                            {m.status === 'pending' && <Text color="gray">[WAIT]</Text>}
                            {m.status === 'scanning' && <Text color="yellow">[SCAN]</Text>}
                            {m.status === 'completed' && <Text color="green">[ OK ]</Text>}
                            {m.status === 'failed' && <Text color="red">[FAIL]</Text>}
                        </Box>
                        <Text>  {m.message}</Text>
                    </Box>
                ))}

                <Box marginTop={1}>
                    <Text color="cyan">│</Text>
                    <Text>  </Text>
                    <Text color={percentage === 100 ? "green" : "yellow"}>[{bar}] {percentage}%</Text>
                </Box>

                <Box marginTop={0}>
                    <Text bold color="cyan">╰───────────────────────────────────────────────────╯</Text>
                </Box>
            </Box>

            <Box marginLeft={2}>
                <Text dimColor>
                    {'>'} Initializing cleanup protocols{dots}
                </Text>
            </Box>
        </Box>
    );
};
