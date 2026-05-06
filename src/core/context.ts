import { AgentMessage } from "../types";
import { config } from '../config/env'

export class ContextManager {
    private history: AgentMessage[] = [];
    private systemPrompt: string = '你是我的人工智能助手，协助我完成任务。';

    constructor(systemPrompt: string, task: string) {
        this.systemPrompt = systemPrompt.replace('{{task}}', task);
    }

    // 记录 Agent 思考/工具结果
    push(msg: AgentMessage): void {
        this.history.push(msg);
    }

    // 上下文注入（含压缩策略雏形）
    getMessages(): AgentMessage[] {
        // 简易窗口管理：保留 system + 最近 N 条消息
        // 生产环境建议替换为 @anthropic-ai/tokenizer 或 tiktoken 进行精确截断
        const systemMsg: AgentMessage = { role: 'system', content: this.systemPrompt };
        const maxHistory = Math.floor(config.context.windowLimit / 150); // 粗略估算：150字≈1token

        const trimmed = this.history.slice(-maxHistory);
        return [systemMsg, ...trimmed];
    }

    clear(): void {
        this.history = [];
    }
}