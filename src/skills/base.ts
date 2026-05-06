import { z, ZodType } from 'zod';
import { ToolCall } from '../types';


export interface SkillDef {
    name: string;
    description: string;
    inputSchema: ZodType;   // Zod Schema, 用于校验 + 生成 OpenAI tools 描述
    execute: (args: any) => Promise<string>;
}

export abstract class BaseSkill {
    abstract get definition(): SkillDef;

    // 将 Zod schema 转为 OpenAI Function Calling 格式
    toOpenAITool(): Record<string, unknown> {
        const { name, description, inputSchema } = this.definition;
        return {
            type: 'function',
            function: {
                name,
                description,
                parameters: (inputSchema as any)._def,  // 直接使用 Zod 内部定义，OpenAI 兼容 JSON Schema
            }
        };
    }

    // 安全执行: 校验 + 捕获异常 + 格式化结果
    async safeExecute(toolCall: ToolCall): Promise<{ content: string; isError?: boolean }> {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            const validated = this.definition.inputSchema.parse(args);
            const result = await this.definition.execute(validated);
            return { content: result };
        } catch (err: any) {
            return {
                content: `技能执行失败: ${err.message || '参数校验错误'}`,
                isError: true
            };
        }
    }
}

