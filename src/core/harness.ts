import { AgentState, ToolCall, ToolResult, AgentMessage } from '../types';
import { LLMClient } from '../llm/client';
import { ContextManager } from './context';
import { config } from '../config/env';
import * as fs from 'fs';
import * as path from 'path';
import { registry } from '../skills/registry';

export class Harness {
  private state: AgentState;
  private context: ContextManager;
  private llm: LLMClient;
  private traceLog: any[] = [];
  private toolsSchema: any[];

  constructor(task: string, systemPrompt: string, toolsSchema: any[] = []) {
    this.state = {
      messages: [],
      currentTask: task,
      stepCount: 0,
      maxSteps: config.agent.maxSteps,
      isCompleted: false
    };
    this.context = new ContextManager(systemPrompt, task);
    this.llm = new LLMClient();
    // 优先使用传入，否则用注册表
    this.toolsSchema = toolsSchema.length > 0 ? toolsSchema : registry.toOpenAITools();
  }

  async run(): Promise<string> {
    console.log(`🚀 [Harness] 启动任务: ${this.state.currentTask}`);
    console.log(`⏱️  [Harness] 最大步数: ${this.state.maxSteps} | 上下文窗口: ~${config.context.windowLimit} 字符`);

    while (!this.state.isCompleted && this.state.stepCount < this.state.maxSteps) {
      this.state.stepCount++;
      const stepStart = Date.now();
      console.log(`🔄 [Step ${this.state.stepCount}] 思考中...`);

      try {
        // 1. 获取注入上下文
        const messages = this.context.getMessages();
        
        // 2. 调用 LLM（指数退避重试）
        const response = await this.callLLMWithRetry(messages);

        // 3. 记录调试 Trace
        this.logTrace(stepStart, messages, response);

        // 4. 决策分支：工具调用 或 最终回答
        if (response.tool_calls?.length) {
          console.log(`🛠️  [Step ${this.state.stepCount}] 触发工具: ${response.tool_calls.map((t: ToolCall) => t.function.name).join(', ')}`);
          const results = await this.executeTools(response.tool_calls);
          results.forEach(res => {
            const msg: AgentMessage = { role: 'tool', content: res.content, tool_call_id: res.tool_call_id };
            this.context.push(msg);
          });
        } else {
          console.log(`✅ [Step ${this.state.stepCount}] 任务完成`);
          this.context.push({ role: 'assistant', content: response.content });
          this.state.isCompleted = true;
          this.saveTrace();
          return response.content;
        }
      } catch (error: any) {
        console.error(`❌ [Step ${this.state.stepCount}] 异常: ${error.message}`);
        // 容错策略：将错误注入上下文，让 LLM 自我修正
        this.context.push({ role: 'user', content: `执行出错: ${error.message}。请检查参数或换一种策略重试。` });
      }
    }

    if (!this.state.isCompleted) {
      console.warn(`⚠️ 达到最大步数，强制终止。`);
      this.saveTrace();
      return '任务未能在限定步数内完成。';
    }
    return '';
  }

  private async callLLMWithRetry(messages: AgentMessage[], retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.llm.chat(messages, this.toolsSchema);
      } catch (err) {
        if (i === retries - 1) throw err;
        const delay = Math.pow(2, i) * 1000;
        console.warn(`⚠️ LLM 调用失败，${delay}ms 后重试...`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
    throw new Error('LLM 调用最终失败');
  }

  // 下一步将替换为 Skills 注册表调度
  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    for (const tc of toolCalls) {
        const res = await registry.call(tc);    // 真实调度
        results.push({
            tool_call_id: tc.id,
            content: res.content,
            isError: res.isError
        });
    }
    return toolCalls.map(tc => ({
      tool_call_id: tc.id,
      content: `[MOCK] 技能 ${tc.function.name} 已执行，参数: ${tc.function.arguments}`
    }));
  }

  private logTrace(stepStart: number, input: any[], output: any) {
    this.traceLog.push({
      step: this.state.stepCount,
      time: new Date().toISOString(),
      latencyMs: Date.now() - stepStart,
      contextLen: input.length,
      output
    });
  }

  private saveTrace() {
    const dir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `trace-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(this.traceLog, null, 2));
    console.log(`📝 Trace 已保存: ${file}`);
  }
}