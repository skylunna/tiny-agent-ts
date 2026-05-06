import dotenv from 'dotenv';

dotenv.config();

export const config = {
    llm: {
        apiKey: process.env.LLM_API_KEY || '',
        baseURL: process.env.LLM_BASE_URL || '',
        model: process.env.LLM_MODEL || 'deepseek-chat',
        temperature: 0.1,
        maxTokens: 2048,
    },
    context: {
        windowLimit: parseInt(process.env.CONTEXT_WINDOW_LIMIT || '8000', 10),
    },
    agent: {
        maxSteps: parseInt(process.env.AGENT_MAX_STEPS || '10', 10),
    }
};