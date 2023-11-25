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
    let shouldRegenerate = true;

    while (shouldRegenerate) {
      // 调用 OpenAI API 生成命令行命令建议
      response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        n: 1,
        messages: [
          { role: "system", content: generatePrompt(translatedInput) },
        ],
      });

      // 提取并去重命令行命令建议
      const suggestionsSet = new Set(
        response.choices.map((choice) => {
          const content = choice.message.content.trim();
          return content.includes("UNKNOWN") ? null : content;
        })
      );
      const suggestions = Array.from(suggestionsSet).filter((s) => s);

      if (suggestions.length === 0) {
        spinner.stop(); // 停止加载指示器
        console.log(chalk.yellow("我不理解您的需求，请重新输入"));
        break;
      }

      // 标红 DANGEROUS 命令
      const formattedSuggestions = suggestions.map((s) =>
        s.includes("DANGEROUS") ? chalk.red(s) : s
      );

      // 添加重新生成和取消选项
      formattedSuggestions.push("重新生成");
      formattedSuggestions.push("取消");

      spinner.stop(); // 停止加载指示器

      // 让用户选择一个命令来执行
      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "selectedCommand",
          message: "请选择一个命令来执行:",
          choices: formattedSuggestions,
        },
      ]);

      if (answer.selectedCommand === "取消") {
        console.log(chalk.green("再见！"));
        process.exit(0);
      }

      shouldRegenerate = answer.selectedCommand === "重新生成";

      if (!shouldRegenerate) {
        // 执行选定的命令
        exec(
          answer.selectedCommand,
          { encoding: "buffer" },
          (errorBuffer, stdoutBuffer, stderrBuffer) => {
            if (errorBuffer && errorBuffer.length) {
              const error = iconv.decode(errorBuffer, "gbk");
              console.error(chalk.red(`执行出错: ${error}`));
              return;
            }
            if (stdoutBuffer && stdoutBuffer.length) {
              const stdout = iconv.decode(stdoutBuffer, "gbk");
              console.log(stdout);
            }
            if (stderrBuffer && stderrBuffer.length) {
              const stderr = iconv.decode(stderrBuffer, "gbk");
              console.error(chalk.yellow(stderr));
            }
            spinner.succeed("命令执行成功！");
          }
        );
        break;
      }

      spinner.start("正在重新生成命令...");
    }
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
    //console.log(translation.choices[0].message.content.trim());
    return translation.choices[0].message.content.trim();
  }
  return input;
}

function isChinese(text) {
  return /[\u3400-\u9FBF]/.test(text);
}

export default processCommand;
