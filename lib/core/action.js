// lib/core/action.js
import OpenAI from "openai";
import inquirer from "inquirer";
import { exec } from "child_process";
import chalk from "chalk";
import { HttpsProxyAgent } from "https-proxy-agent";
import ora from "ora";
import iconv from "iconv-lite";
import clipboardy from "clipboardy";
import dotenv from "dotenv";
import { saveCommandToHistory } from './history.js';

// 加载配置文件
dotenv.config();

// 获取代理配置（如果存在）
const proxy = "https://127.0.0.1:7890";

// 初始化 OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.BASE_URL,
});

let context = ""; // 用于保存对话上下文

// 主处理函数
async function processCommand(naturalLanguageInput) {
  const spinner = ora("正在处理命令...").start();
  // 更新上下文
  context += "\n" + naturalLanguageInput;
  try {
    //先翻译
    const translatedInput = await translateToEnglishIfNeeded(
      naturalLanguageInput
    );
    spinner.text = "正在生成命令...";

    let response;

    // 调用 OpenAI API 生成命令行命令建议
    response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      n: 1,
      messages: [
        { role: "system", content: generatePrompt(translatedInput) },
      ],
    });

    const suggestion = response.choices[0].message.content.trim();
    if (suggestion.includes('UNKNOWN')) {
      spinner.stop();
      console.log(chalk.yellow('我不理解您的需求，请重新输入'));
      return;
    }

    spinner.stop();
    
    const action = await askForAction(suggestion);

    if (action === '✅直接执行') {
      executeCommand(suggestion);
    } else if (action === '📝编辑命令') {
      const editedCommand = await editCommand(suggestion);
      executeCommand(editedCommand);
    } else if (action === '🧭重新生成命令') {
      await processCommand(await askForInput());
    }
      // 如果选择“取消”，则不执行任何操作
    } catch (error) {
      spinner.fail();
      console.error(chalk.red(`处理命令时发生错误: ${error}`));
    }
}

// 生成 OpenAI API 的提示
function generatePrompt(input) {
  const OS = process.platform; // 获取操作系统类型
  return `You are a command line translation program for '${OS}' os. You can translate natural language instructions from human language into corresponding command line statements.\n\nSimply output the translated instruction without any explanation. \n\nIf you don't understand what I'm saying or are unsure how to convert my instructions into a computer command line, simply output the 7 letters "UNKNOWN" without any other explanation.\n\nIf the translated result consists of more than one line of commands, please use '&' or '&&' to combine them into a single line of command.\n\nIf this is a dangerous command, please start a new line at the end of the output and output "DANGEROUS" without any other warnings or prompts.\n\n${input}`;
}

//翻译层
async function translateToEnglishIfNeeded(input) {
  // 检查输入是否为中文
  if (isChinese(input)) {
    const translation = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Translate the following Chinese text to English:\n\n${input}\n\nTranslation:`,
        },
      ],
    });
    //console.log(translation.choices[0].message);
    return translation.choices[0].message.content.trim();
  }
  return input;
}

//标准化输出检查
function isChinese(text) {
  return /[\u3400-\u9FBF]/.test(text);
}

// 询问用户是否要输入命令
async function askForInput() {
  const { newInput } = await inquirer.prompt({
    type: 'input',
    name: 'newInput',
    message: '请输入您的指令:',
  });
  return newInput;
}

// 询问用户是否要执行命令
async function askForAction(command) {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: command,
    choices: ['✅直接执行', '📝编辑命令', '🧭重新生成命令', '❌取消'],
  });
  return action;
}

// 询问用户是否要编辑命令
async function editCommand(command) {
  const { editedCommand } = await inquirer.prompt({
    type: 'editor',
    name: 'editedCommand',
    message: '编辑您的命令:',
    default: command,
  });
  return editedCommand;
}

// 执行命令
function executeCommand(command) {
  saveCommandToHistory(command); // 保存命令到历史
  exec(command, { encoding: 'buffer' }, (errorBuffer, stdoutBuffer, stderrBuffer) => {
    if (errorBuffer && errorBuffer.length) {
      console.error(chalk.red(`执行出错: ${iconv.decode(errorBuffer, 'gbk')}`));
      return;
    }
    if (stdoutBuffer && stdoutBuffer.length) {
      console.log(iconv.decode(stdoutBuffer, 'gbk'));
    }
    if (stderrBuffer && stderrBuffer.length) {
      console.error(chalk.yellow(iconv.decode(stderrBuffer, 'gbk')));
    }
  });
}

export default processCommand;
