import React from 'react';
import { Box, Text } from 'ink';

export const HelpBar: React.FC = () => {
    return (
        <Box flexDirection="column" paddingX={1}>
            <Text dimColor>
                💡 <Text bold>[↑↓]</Text> Move  <Text bold>[Space]</Text> Select  <Text bold>[Tab]</Text> Switch  <Text bold>[/]</Text> Search  <Text bold>[s]</Text> Sort  <Text bold>[v]</Text> View
            </Text>
            <Text dimColor>
                {'   '}<Text bold>[a]</Text> All  <Text bold>[i]</Text> Invert  <Text bold>[w]</Text> Watch  <Text bold>[W]</Text> Batch  <Text bold>[g]</Text> Upgrade  <Text bold>[u]</Text> Uninstall  <Text bold>[r]</Text> Refresh  <Text bold>[q]</Text> Quit
            </Text>
        </Box>
    );
};
