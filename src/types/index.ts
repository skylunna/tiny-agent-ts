export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface AgentMessage {
    role: Role;
    content: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: { name: string; arguments: string};
}

export interface ToolResult {
    tool_call_id: string;
    content: string;
    isError?: boolean;
}

export interface AgentState {
    messages: AgentMessage[];
    currentTask: string;
    stepCount: number;
    maxSteps: number;
    isCompleted: boolean;
}