#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './app.js';

const program = new Command();

program
    .name('term-clean')
    .description('A TUI tool for managing and cleaning command-line packages on Mac')
    .version('1.0.0');

program
    .option('-m, --manager <type>', 'Filter by package manager (brew, npm, pnpm, yarn, pip)')
    .option('-d, --debug', 'Enable debug mode')
    .action((options) => {
        // 渲染ink应用
        const { waitUntilExit } = render(
            <App
                managerFilter={options.manager}
                debugMode={options.debug || false}
            />
        );

        // 等待用户退出
        waitUntilExit().catch((error: Error) => {
            console.error('Error:', error.message);
            process.exit(1);
        });
    });

// 添加子命令: list (列出包)
program
    .command('list')
    .description('List all installed packages')
    .option('-m, --manager <type>', 'Filter by package manager')
    .option('-j, --json', 'Output as JSON')
    .action(() => {
        console.log('List command - to be implemented');
        // TODO: 实现非交互式列表命令
    });

// 添加子命令: info (查看包详情)
program
    .command('info <package>')
    .description('Show package information')
    .action((packageName: string) => {
        console.log(`Info for ${packageName} - to be implemented`);
        // TODO: 实现包详情命令
    });

program.parse(process.argv);
