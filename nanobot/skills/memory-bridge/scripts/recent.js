#!/usr/bin/env node
/**
 * 查看最近事件
 */

const { getRecentEvents } = require('../index');

async function main() {
  const limit = parseInt(process.argv[2]) || 20;
  const events = await getRecentEvents(limit);

  console.log('=== 最近事件 ===\n');
  events.forEach(e => console.log(e));
  console.log(`\n共 ${events.length} 条`);
}

main().catch(console.error);
