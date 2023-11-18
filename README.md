## GPT-CLI 命令行工具
### 介绍
GPT-CLI 是一个基于 Node.js 的命令行工具，它可以将自然语言指令转换为命令行命令。该工具利用 OpenAI 的 GPT 模型来理解和转换自然语言，支持生成多条命令行建议，并允许用户选择其中一条进行执行。

### 特性
- 将自然语言转换为命令行命令。
- 支持 Bash 和 PowerShell 命令。
- 支持中文和英文输入。
- 生成多条命令行建议供用户选择。
- 支持重新生成命令行建议。
- 界面友好，包括加载指示和错误提示。

### 安装
要使用 GPT-CLI，您需要先在您的机器上安装 Node.js 和 npm。然后，您可以通过以下步骤安装 GPT-CLI：

```bash
git clone https://github.com/your-username/gptcli.git
cd gptcli
pnpm install
```

### 使用
在安装完成后，您可以通过以下方式使用 GPT-CLI：

```bash
node ./bin/index.js "您的自然语言指令"
```

### 示例

```bash
node ./bin/index.js "列出当前目录下的所有文件"
```

### 配置
在使用之前，请确保您已经设置了以下环境变量：

- **OPENAI_API_KEY:** 您的 OpenAI API 密钥。
- **OPENAI_MODEL:** 使用的 OpenAI 模型，默认为 gpt-3.5-turbo。
