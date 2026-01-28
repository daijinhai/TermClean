import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        // 测试环境
        environment: 'node',

        // 全局测试API
        globals: true,

        // 覆盖率配置
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'dist/',
                'tests/',
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/types/',
                '**/constants/',
            ],
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80,
        },

        // 测试文件匹配模式
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],

        // 排除文件
        exclude: [
            'node_modules',
            'dist',
            '.idea',
            '.git',
            '.cache',
        ],

        // 超时设置
        testTimeout: 10000,
        hookTimeout: 10000,
    },

    // 路径别名
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
