import { defineConfig } from 'tsup';

export default defineConfig({
    // 入口文件
    entry: ['src/cli.tsx'],

    // 输出格式
    format: ['esm'],

    // 输出目录
    outDir: 'dist',

    // 生成类型定义
    dts: true,

    // 生成source map
    sourcemap: true,

    // 清理输出目录
    clean: true,

    // 代码分割
    splitting: false,

    // 外部依赖(不打包)
    external: [
        'react',
        'ink',
        'zustand',
    ],

    // 压缩
    minify: false,

    // 目标环境
    target: 'node18',

    // 添加shebang
    shims: true,

    // 监听模式配置
    watch: false,
});
