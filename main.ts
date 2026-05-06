import { Agent } from './src/core/agent';
import './src/skills/file_ops'; // 侧边导入，触发自动注册

async function main() {
  const agent = new Agent();
  // 默认任务，也可通过命令行传入: npx tsx main.ts "帮我查一下北京今天天气"
  const task = process.argv[2] || 
  '请先在 ./workspace 创建文件 hello.txt，内容为 "Hello Tiny Agent!"，然后读取它并告诉我内容。';
  
  console.log(`🎯 接收任务: ${task}\n`);
  const result = await agent.start(task);
  console.log(`\n🏁 最终输出: ${result}`);
}

main().catch(console.error);