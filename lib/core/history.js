import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const historyFilePath = path.join(__dirname, '..', 'command_history.txt');

export function saveCommandToHistory(command) {
    fs.appendFileSync(historyFilePath, command + '\n');
}

export function viewCommandHistory() {
    if (fs.existsSync(historyFilePath)) {
        const history = fs.readFileSync(historyFilePath, 'utf8');
        console.log('命令历史记录:\n' + history);
    } else {
        console.log('暂无历史记录。');
    }
}
