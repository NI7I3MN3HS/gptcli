import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import iconv from "iconv-lite";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const historyFilePath = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "command_history.txt"
);

export function saveCommandToHistory(command) {
  // 确保 data 文件夹存在，如果不存在则创建
  const dataDir = path.dirname(historyFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  // 获取历史记录数量作为编号
  const history = fs.existsSync(historyFilePath)
    ? fs.readFileSync(historyFilePath, "utf8")
    : "";
  const commandNumber = history.split("\n").length;

  fs.appendFileSync(historyFilePath, `${commandNumber}: ${command}\n`);
}

// 执行命令
function executeCommand(command) {
  //saveCommandToHistory(command); // 保存命令到历史
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

// 查看命令历史记录
export function viewCommandHistory() {
  if (fs.existsSync(historyFilePath)) {
    const history = fs.readFileSync(historyFilePath, "utf8");
    console.log("命令历史记录:\n" + history);

    // 提示用户输入编号来执行命令
    inquirer
      .prompt([
        {
          type: "input",
          name: "commandNumber",
          message: '请输入要执行的命令编号（或输入 "exit" 以退出）:',
        },
      ])
      .then((answers) => {
        if (answers.commandNumber.toLowerCase() !== "exit") {
          const selectedCommand = history
            .split("\n")
            .find((line) => line.startsWith(answers.commandNumber + ":"));
          if (selectedCommand) {
            const commandToExecute = selectedCommand.split(": ")[1];
            executeCommand(commandToExecute);
          } else {
            console.log("未找到指定编号的命令。");
          }
        }
      });
  } else {
    console.log("暂无历史记录。");
  }
}
