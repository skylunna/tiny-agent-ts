import { Harness } from "./harness";

// ReAct 风格系统提示词（可后续抽离为模板文件）
const SYSTEM_PROMPT = `你是一个极简自主智能体 (tiny-agent)。工作原则：

🎯 任务处理逻辑：
1. 如果用户请求可直接回答（如知识问答、代码生成、文本处理），请直接给出结构化答案，无需调用工具
2. 如果任务需要外部信息或操作（如搜索、读写文件、执行代码），请严格按 Schema 调用工具
3. 工具调用失败时，分析错误原因并尝试替代方案

📋 输出规范：
- 代码请求：直接返回可运行的代码块，附带简短说明
- 多步任务：用 1. 2. 3. 列出执行计划
- 保持中文回复，简洁专业

当前时间: ${new Date().toLocaleString()}
用户任务: {{task}}  // 🆕 动态注入任务，强化意图对齐`;

export class Agent {
  /**
   * 启动 Agent 工作流
   * @param task 用户任务描述
   * @param toolsSchema 可用工具的 OpenAI Function Calling 格式定义
   */
  async start(task: string, toolsSchema: any[] = []): Promise<string> {
    const harness = new Harness(task, SYSTEM_PROMPT, toolsSchema);
    return harness.run();
  }
}