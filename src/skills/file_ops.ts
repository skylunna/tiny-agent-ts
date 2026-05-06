import { z } from 'zod';
import { BaseSkill } from './base';
import * as fs from 'fs/promises';
import * as path from 'path';
import { registry } from './registry'

// 安全根目录 (防止任意文件读取)
const WORKSPACE = path.join(process.cwd(), 'workspace');
// 确保目录存在
fs.mkdir(WORKSPACE, { recursive: true }).catch(() => {});

const safePath = (filename: string): string => {
    const resolved = path.resolve(WORKSPACE, filename);
    if (!resolved.startsWith(WORKSPACE)) {
        throw new Error('非法路径访问');
    }
    return resolved;
};

export class FileOpsSkill extends BaseSkill {

    get definition() {
        return {
            name: 'file_ops',
            description: '安全读写本地文件 (权限 ./workspace 目录)',
            inputSchema: z.object({
                action: z.enum(['read', 'write']),
                filename: z.string().min(1).describe('相对路径, 如: notes.txt'),
                content: z.string().optional().describe('写入时的文件内容')
            }),
            execute: async(args: {action: 'read' | 'write'; filename: string; content?: string}) => {
                const filepath = safePath(args.filename);

                if (args.action === 'read') {
                    const content = await fs.readFile(filepath, 'utf-8');
                    return `📄 文件内容 (${args.filename}):\n\`\`\`\n${content}\n\`\`\``;
                } else {
                    await fs.writeFile(filepath, args.content || '', 'utf-8');
                    return `✅ 文件已写入: ${args.filename} (${(args.content || '').length} 字符)`;
                }
            }
        };
    }
}

// 自动注册
registry.register(new FileOpsSkill());