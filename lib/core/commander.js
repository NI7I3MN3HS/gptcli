// lib/core/commander.js
import { program } from 'commander';
import processCommand from './action.js';
import showHelp from './help.js';
import { viewCommandHistory } from './history.js';

function setupCLI() {
    // 设置命令行工具的基本信息
    program
    .name('gptcli')
    .description('CLI for converting natural language to command line commands.')
    .version('1.0.0');

    // 直接处理主命令的自然语言输入
    program
    .argument('<string...>', 'Natural language input')
    .action((strings) => {
        const naturalLanguageInput = strings.join(' '); // 将数组元素组合成一个字符串
        processCommand(naturalLanguageInput);
    });

    // 'help' 命令
    program
    .command('help')
    .description('Display help information.')
    .action(showHelp);

    // 添加 'history' 命令
    program
        .command('history')
        .description('查看命令历史记录')
        .action(viewCommandHistory);

    // 解析命令行参数
    program.parse(process.argv);

    // 如果没有提供参数，显示帮助
    if (!process.argv.slice(2).length) {
    program.outputHelp();
    }
}

export default setupCLI;