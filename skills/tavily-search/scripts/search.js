#!/usr/bin/env node
/**
 * Tavily Search CLI
 * 
 * 用法:
 *   node scripts/search.js "query" [options]
 */

const tavily = require('../index.js');

const args = process.argv.slice(2);
const query = args.find(a => !a.startsWith('-'));

if (!query) {
  console.log('用法：node search.js "搜索关键词" [选项]');
  console.log('');
  console.log('选项:');
  console.log('  -n, --max-results <n>  结果数量 (默认：5)');
  console.log('  -d, --depth <level>    搜索深度：basic|advanced (默认：basic)');
  console.log('  -a, --include-answer   包含 AI 答案摘要');
  console.log('  -j, --json             JSON 输出格式');
  console.log('  --days <n>             时间范围（天数）');
  console.log('');
  console.log('示例:');
  console.log('  node search.js "AI agent" -n 10 -a');
  console.log('  node search.js "OpenClaw" --json');
  process.exit(0);
}

// 解析选项
const options = {
  maxResults: parseInt(args.find(a => a === '-n' || a.startsWith('--max-results'))?.split('=').pop() || '5'),
  depth: args.find(a => a === '-d' || a.startsWith('--depth'))?.split('=').pop() || 'basic',
  includeAnswer: args.includes('-a') || args.includes('--include-answer'),
  days: parseInt(args.find(a => a.startsWith('--days'))?.split('=').pop()) || null
};

async function main() {
  try {
    console.log(`🔍 搜索：${query}`);
    console.log(`选项：${JSON.stringify(options)}\n`);
    
    const result = await tavily.search(query, options);
    
    if (args.includes('-j') || args.includes('--json')) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.answer) {
        console.log('📝 答案摘要:');
        console.log(result.answer);
        console.log('');
      }
      
      console.log(`📊 找到 ${result.results?.length || 0} 个结果:\n`);
      
      (result.results || []).forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   ${r.url}`);
        console.log(`   ${r.content?.substring(0, 150) || ''}...`);
        if (r.publishedDate) {
          console.log(`   📅 ${r.publishedDate}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error(`❌ 错误：${error.message}`);
    process.exit(1);
  }
}

main();
