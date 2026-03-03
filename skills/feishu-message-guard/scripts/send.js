#!/usr/bin/env node
/**
 * 飞书消息发送脚本
 * 
 * 用法：
 *   node scripts/send.js --webhook <url> --content "消息内容"
 *   node scripts/send.js --webhook <url> --file message.json
 */

const feishu = require('../index.js');

// 解析参数
const args = process.argv.slice(2);
const webhook = args.find(a => a.startsWith('--webhook='))?.split('=')[1] || process.env.FEISHU_WEBHOOK;
const content = args.find(a => a.startsWith('--content='))?.split('=')[1];
const file = args.find(a => a.startsWith('--file='))?.split('=')[1];
const msgType = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'text';

async function main() {
  if (!webhook) {
    console.error('错误：缺少 webhook URL');
    console.error('用法：node send.js --webhook <url> --content "消息"');
    process.exit(1);
  }

  let messageContent;
  
  if (file) {
    // 从文件读取
    const fs = require('fs');
    try {
      messageContent = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (e) {
      console.error(`错误：无法读取文件 ${file}`);
      console.error(e.message);
      process.exit(1);
    }
  } else if (content) {
    // 使用命令行内容
    messageContent = { text: content };
  } else {
    // 从 stdin 读取
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    messageContent = { text: await new Promise(resolve => {
      rl.question('输入消息内容：', resolve);
    })};
    rl.close();
  }

  console.log('📤 发送消息...');
  console.log('Webhook:', webhook.substring(0, 50) + '...');
  console.log('类型:', msgType);
  console.log('内容:', JSON.stringify(messageContent));
  console.log('');

  const result = await feishu.send({
    webhook,
    msgType,
    content: messageContent
  });

  if (result.success) {
    console.log('✅ 发送成功！');
    console.log('使用格式:', result.format);
    console.log('响应:', JSON.stringify(result.result));
  } else {
    console.log('❌ 发送失败');
    console.log('错误:', result.error);
    console.log('错误码:', result.code);
    if (result.triedFormats) {
      console.log('尝试过的格式:', result.triedFormats.join(', '));
    }
    process.exit(1);
  }
}

main().catch(console.error);
