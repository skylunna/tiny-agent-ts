import OpenAI from 'openai';
import { config } from '../config/env';
import { AgentMessage, ToolCall } from '../types';
import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class LLMClient {
    private client: OpenAI;

    constructor() {
        if (!config.llm.apiKey || !config.llm.baseURL) {
            throw new Error('LLM_API_KEY 和 LLM_BASE_URL 必须在 .env 中配置')
        }
        this.client = new OpenAI({
            apiKey: config.llm.apiKey,
            baseURL: config.llm.baseURL,
            timeout: 30_000,
            maxRetries: 2,
        });
    }

    async chat (
        messages: AgentMessage[],
        tools?: ChatCompletionTool[]
    ): Promise<{ content: string; tool_calls?: ToolCall[] }> {
        const res = await this.client.chat.completions.create({
            model: config.llm.model,
            messages: messages as ChatCompletionMessageParam[],
            tools,
            temperature: config.llm.temperature,
            max_tokens: config.llm.maxTokens,
        });
        const choice = res.choices[0];
        return {
            content: choice.message.content || '',
            tool_calls: choice.message.tool_calls as ToolCall[] | undefined,
        };
    };
}