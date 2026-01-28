import React from 'react';
import { Box, Text } from 'ink';

interface LoadingSpinnerProps {
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
    return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
            <Text color="cyan">🔄 {message}</Text>
        </Box>
    );
};
