import { LLMClient } from "../llm/client";
import { ContextManager } from "../core/context";

const ctx = new ContextManager('你是一个极简AI助手，用中文回答。', "");
ctx.push ({ role: 'user', content: '1+1等于几？只回答数字。 '});

const client = new LLMClient();
client.chat(ctx.getMessages()).then(console.log).catch(console.error);