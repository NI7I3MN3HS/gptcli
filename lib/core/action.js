// lib/core/action.js
import OpenAI from "openai";
import inquirer from "inquirer";
import { exec } from "child_process";
import chalk from "chalk";
import ora from "ora";
import iconv from "iconv-lite";
import clipboardy from "clipboardy";
import { saveCommandToHistory } from "./history.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const systemPromptPath = path.join(__dirname, '..', 'prompt', 'system_prompt.txt');
let systemPrompt = '';

async function loadSystemPrompt() {
  const rawPrompt = fs.readFileSync(systemPromptPath, 'utf8');
  const OS = process.platform;

  //根据不同的操作系统，加载不同的shell类型
  let shell = '';
  if (process.platform === 'win32') {
    const shellChoice = await askForShell();
    shell = shellChoice === '1. PowerShell' ? 'PowerShell' : 'CMD';
  }
  else
  {
    shell = process.env.SHELL;
  }

  // 替换模板中的 ${OS} 和 ${shell} 变量
  systemPrompt = rawPrompt.replace('${OS}', OS).replace('${Shell}', shell);
}

// 加载配置文件
const configPath = path.join(__dirname, '..', '..', 'config.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  process.env.OPENAI_API_KEY = config.OPENAI_API_KEY;
  process.env.BASE_URL = config.BASE_URL;
  process.env.OPENAI_MODEL = config.OPENAI_MODEL;
}

// 初始化 OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.BASE_URL,
});


// 主处理函数
async function processCommand(naturalLanguageInput) {
  if (!systemPrompt) {
    await loadSystemPrompt();
  }
  
  const spinner = ora("正在处理命令...").start();
  try {
    //先翻译
    const translatedInput = await translateToEnglishIfNeeded(
      naturalLanguageInput
    );
    spinner.text = "正在生成命令...";

    let response;

    // 调用 OpenAI API 生成命令行命令建议
    response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-1106",
      n: 1,
      temperature: 0.2,
      messages: [{ role: "system", content: systemPrompt },{ role: "user", content: translatedInput}],
      response_format: { type: "json_object" },
    });

    let suggestion = response.choices[0].message.content.trim();
    if (suggestion.includes("UNKNOWN")) {
      spinner.stop();
      console.log(chalk.yellow("我不理解您的需求，请重新输入"));
      return;
    }

    spinner.stop();

    let continueExecution = true;
    while (continueExecution) {
      const action = await askForAction(suggestion);

      if (action === "✅直接执行") {
        executeCommand(suggestion);
        continueExecution = false;
      } else if (action === "📝编辑命令") {
        const editedCommand = await editCommand(suggestion);
        const executeEdited = await confirmExecution(editedCommand);
        suggestion = editedCommand;
        if (executeEdited) {
          executeCommand(editedCommand);
          continueExecution = false;
        }
      } else if (action === "🧭重新生成命令") {
        await processCommand(await askForInput());
        continueExecution = false;
      } else if (action === "📋复制到剪贴板") {
        clipboardy.writeSync(suggestion);
        console.log(chalk.green("命令已复制到剪贴板"));
      } else {
        // 如果选择“取消”，则不执行任何操作
        continueExecution = false;
      }
    }
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(`处理命令时发生错误: ${error}`));
  }
}

//翻译层
async function translateToEnglishIfNeeded(input) {
  // 检查输入是否为中文
  if (isChinese(input)) {
    const translation = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-1106",
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

//检查中文
function isChinese(text) {
  return /[\u3400-\u9FBF]/.test(text);
}

// 询问用户是否要输入命令
async function askForInput() {
  const { newInput } = await inquirer.prompt({
    type: "input",
    name: "newInput",
    message: "请输入您的指令:",
  });
  return newInput;
}

// 询问用户是否要执行命令
async function askForAction(command) {
  const { action } = await inquirer.prompt({
    type: "list",
    name: "action",
    message: command,
    choices: [
      "✅直接执行",
      "📝编辑命令",
      "🧭重新生成命令",
      "📋复制到剪贴板",
      "❌取消",
    ],
  });
  return action;
}

// 询问用户是否要编辑命令
async function editCommand(command) {
  const { editedCommand } = await inquirer.prompt({
    type: "editor",
    name: "editedCommand",
    message: "编辑您的命令:",
    default: command,
  });
  return editedCommand;
}

// 确认是否执行编辑后的命令
async function confirmExecution(command) {
  const { confirm } = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: `是否执行该命令? ${command}`,
    default: true,
  });
  return confirm;
}

// 询问用户选择的 shell（仅针对 Windows）
async function askForShell() {
  const { shellChoice } = await inquirer.prompt({
    type: "list",
    name: "shellChoice",
    message: "请选择您的 shell:",
    choices: ["1. PowerShell", "2. CMD"],
  });
  return shellChoice;
}

// 执行命令
function executeCommand(command) {
  saveCommandToHistory(command); // 保存命令到历史
  exec(
    command,
    { encoding: "buffer" },
    (errorBuffer, stdoutBuffer, stderrBuffer) => {
      if (errorBuffer && errorBuffer.length) {
        console.error(
          chalk.red(`执行出错: ${iconv.decode(errorBuffer, "gbk")}`)
        );
        return;
      }
      if (stdoutBuffer && stdoutBuffer.length) {
        console.log(iconv.decode(stdoutBuffer, "gbk"));
      }
      if (stderrBuffer && stderrBuffer.length) {
        console.error(chalk.yellow(iconv.decode(stderrBuffer, "gbk")));
      }
    }
  );
}

export default processCommand;
