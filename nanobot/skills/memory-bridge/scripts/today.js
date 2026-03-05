#!/usr/bin/env node
/**
 * 查看今日记忆
 */

const fs = require('fs').promises;
const { getTodayMemoryFile } = require('../index');

async function main() {
  const todayFile = getTodayMemoryFile();
  
  try {
    const content = await fs.readFile(todayFile, 'utf-8');
    console.log('=== 今日记忆 ===\n');
    console.log(content);
  } catch (e) {
    console.log('今日记忆文件不存在');
  }
}

main().catch(console.error);
