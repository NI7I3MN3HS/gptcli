// lib/core/help.js
import chalk from 'chalk';

function showHelp() {
    console.log(chalk.hex('#34ace0').bold('GPT-CLI 命令行工具帮助')); // 淡蓝色
    console.log(chalk.hex('#ff5252')('-------------------------------------------------')); // 红色
    console.log(chalk.hex('#ff793f').bold('使用方法:')); // 橙色
    console.log(chalk.hex('#33d9b2')('  gptcli <自然语言指令>')); // 薄荷绿
    console.log('');
    console.log(chalk.hex('#ffb142').bold('功能:')); // 金色
    console.log(chalk.hex('#2ed573')('  将自然语言指令转换为命令行命令。')); // 草绿色
    console.log(chalk.hex('#2ed573')('  支持命令行建议的重新生成。'));
    console.log(chalk.hex('#2ed573')('  支持取消操作。'));
    console.log('');
    console.log(chalk.hex('#ff793f').bold('示例:')); // 橙色
    console.log(chalk.hex('#1e90ff')('  gptcli "显示当前目录下的所有文件"')); // 钴蓝色
    console.log('');
    console.log(chalk.hex('#ff5252').bold('注意:')); // 红色
    console.log(chalk.hex('#fffa65')('  请确保您的环境配置正确，包括OpenAI API密钥。')); // 柠檬黄
    console.log('');
    console.log(chalk.hex('#34ace0').bold('更多信息:')); // 淡蓝色
    console.log(chalk.hex('#fffff3')('  访问 https://github.com/NI7I3MN3HS/gptcli 以获取更多信息。')); // 乳白色
}

export default showHelp;
