#!/usr/bin/env node
/**
 * 记录事件
 * 用法：node scripts/record.js "事件描述" [类型]
 */

const { recordEvent } = require('../index');

async function main() {
  const summary = process.argv[2];
  const type = process.argv[3] || 'general';

  if (!summary) {
    console.log('用法：node scripts/record.js "事件描述" [类型]');
    console.log('类型：config_change, skill_install, system_event, user_preference, task_complete, lesson_learned');
    process.exit(1);
  }

  const result = await recordEvent({
    type,
    summary,
    channel: 'cli'
  });

  console.log('✅ 事件已记录:', result.file);
}

main().catch(console.error);
