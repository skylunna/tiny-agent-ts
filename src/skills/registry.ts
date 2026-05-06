import { BaseSkill, SkillDef } from './base';
import { ToolCall } from '../types';

export class SkillRegistry {
    private skills = new Map<string, BaseSkill>();

    register(skill: BaseSkill): void {
        const { name } = skill.definition;
        if (this.skills.has(name)) {
            throw new Error(`技能 "${name}" 已注册`);
        }

        this.skills.set(name, skill);
        console.log(`注册技能: ${name}`);
    }

    list(): SkillDef[] {
        return Array.from(this.skills.values()).map(s => s.definition);
    }

    toOpenAITools(): Array<Record<string, unknown>> {
        return Array.from(this.skills.values()).map(s => s.toOpenAITool());
    }

    async call(toolCall: ToolCall): Promise<{ content: string; isError?: boolean}> {
        const skill = this.skills.get(toolCall.function.name);
        if (!skill) {
            return { content: `❌ 未知技能: ${toolCall.function.name}`, isError: true };
        }
        return skill.safeExecute(toolCall);
    }
}

// 全局单例 (后续可改为依赖注入)
export const registry = new SkillRegistry();