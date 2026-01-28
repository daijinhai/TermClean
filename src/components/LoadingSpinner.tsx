import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface LoadingSpinnerProps {
    message?: string;
    stage?: string;
    progress?: string;
}

// Braille 旋转动画字符
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Loading...',
    stage,
    progress
}) => {
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setFrameIndex((prev) => (prev + 1) % spinnerFrames.length);
        }, 80);
        return () => clearInterval(timer);
    }, []);

    return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
            <Text color="cyan">
                {spinnerFrames[frameIndex]} {message}
            </Text>
            {stage && (
                <Text color="yellow" dimColor>
                    {progress && `[${progress}] `}{stage}
                </Text>
            )}
        </Box>
    );
};
