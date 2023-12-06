## GPT-CLI 命令行工具

### 介绍

GPT-CLI 是一个基于 Node.js 和 OpenAI 的命令行工具。它能够将自然语言指令转换为命令行命令，并提供了历史记录管理、命令编辑和执行等功能。

### 功能

- **命令转换**：将自然语言指令转换为命令行命令。
- **多语言支持**：支持中文和英文的自然语言输入。
- **历史记录管理**：保存用户执行过的命令，并允许用户查看和重新执行历史命令。
- **命令编辑**：在执行前允许用户编辑生成的命令。
- **复制到剪贴板**：支持将生成的命令复制到剪贴板。
- **用户界面友好**：具有美观的UI界面和良好的用户交互。

### 功能预览


### 安装

要使用 GPT-CLI，您需要先在您的机器上安装 Node.js 和 pnpm。然后，您可以通过以下步骤安装 GPT-CLI：

1. 克隆项目仓库：

   ```bash
   git clone https://github.com/NI7I3MN3HS/gptcli.git
   ```

2. 进入项目目录：

   ```bash
   cd gptcli
   ```

3. 安装依赖：

   ```bash
   pnpm install
   ```

4. 全局链接：

   ```bash
   pnpm link --global
   ```

### 使用

在安装完成后，您可以通过以下方式使用 GPT-CLI：

```bash
node ./bin/index.js "您的自然语言指令"
```

### 示例

```bash
node ./bin/index.js 列出当前目录下的所有文件
```

### 命令历史记录

要查看和重新执行历史命令，请使用以下命令：

```bash
node ./bin/index.js history
```

### 配置

在使用之前，请确保您在 env 文件中已经设置了以下环境变量：

- **OPENAI_API_KEY:** 您的 OpenAI API 密钥。
- **OPENAI_MODEL:** 使用的 OpenAI 模型，默认为 gpt-3.5-turbo。
- **BASE_URL:** OpenAI API 的基础 URL，默认为 https://api.openai.com/v1/engines。
