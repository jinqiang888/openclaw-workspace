#!/usr/bin/env node
/**
 * 飞书问题诊断助手 - 交互式
 * 
 * 用法：node scripts/interactive-diagnose.js
 */

const readline = require('readline');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function log(color, message) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testWebhook(webhook) {
  return new Promise((resolve) => {
    const payload = {
      msg_type: 'text',
      content: {
        text: `🔧 诊断测试 - ${new Date().toLocaleString('zh-CN')}`
      }
    };

    const url = new URL(webhook);
    const data = JSON.stringify(payload);

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, ...result });
        } catch (e) {
          resolve({ error: `解析失败：${e.message}` });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ error: e.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ error: '请求超时 (5 秒)' });
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('');
  log('cyan', '🔍 飞书消息问题诊断助手');
  log('cyan', '='.repeat(60));
  console.log('');

  log('yellow', '问题症状:');
  console.log('  - AppFlow 显示运行完成 ✅');
  console.log('  - 飞书客户端收不到消息 ❌');
  console.log('  - 输出数据显示 "null" ❌');
  console.log('');

  // 步骤 1: 检查 Webhook
  log('blue', '【步骤 1】检查 Webhook 配置');
  console.log('');
  
  const hasWebhook = await question('你有飞书机器人 Webhook URL 吗？(y/n): ');
  
  if (hasWebhook.toLowerCase() !== 'y') {
    console.log('');
    log('yellow', '获取 Webhook 的步骤:');
    console.log('  1. 访问 https://open.feishu.cn/');
    console.log('  2. 登录飞书开放平台');
    console.log('  3. 应用管理 → 创建应用 (或选择已有应用)');
    console.log('  4. 机器人 → 创建机器人');
    console.log('  5. 复制 Webhook 地址');
    console.log('');
    
    const gotWebhook = await question('现在获取到了吗？(y/n): ');
    if (gotWebhook.toLowerCase() !== 'y') {
      log('yellow', '好的，获取到 Webhook 后再运行此诊断工具。');
      rl.close();
      return;
    }
  }
  
  console.log('');
  const webhook = await question('请输入 Webhook URL: ');
  console.log('');

  // 验证格式
  const pattern = /^https:\/\/open\.feishu\.cn\/open-apis\/bot\/v2\/hook\/[a-zA-Z0-9_-]+$/;
  if (!pattern.test(webhook)) {
    log('red', '❌ Webhook 格式不正确');
    log('yellow', '正确格式示例:');
    console.log('  https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx');
    console.log('');
    
    const retry = await question('要重试吗？(y/n): ');
    if (retry.toLowerCase() === 'y') {
      rl.close();
      require('child_process').execSync('node ' + process.argv[1], { stdio: 'inherit' });
      return;
    }
    rl.close();
    return;
  }

  log('green', '✅ Webhook 格式正确');
  console.log('');

  // 步骤 2: 测试发送
  log('blue', '【步骤 2】测试消息发送');
  console.log('正在发送测试消息...');
  console.log('');

  const result = await testWebhook(webhook);

  if (result.error) {
    log('red', '❌ 发送失败');
    log('red', `错误：${result.error}`);
    console.log('');
    log('yellow', '可能原因:');
    console.log('  - 网络连接问题');
    console.log('  - Webhook URL 已失效');
    console.log('  - 防火墙阻止了请求');
  } else if (result.code === 0 || result.statusCode === 200) {
    log('green', '✅ 发送成功！');
    console.log('');
    log('green', '🎉 Webhook 配置正确！');
    console.log('');
    
    // 步骤 3: 分析 AppFlow 问题
    log('blue', '【步骤 3】分析 AppFlow 输出 null 问题');
    console.log('');
    
    console.log('如果 Webhook 测试成功，但 AppFlow 仍输出 null，问题可能在:');
    console.log('');
    
    const issues = [
      {
        title: '问题 1: 函数没有 return',
        check: '检查 AppFlow 代码中是否有 return 语句',
        fix: `async function sendMessage() {
  const result = await fetch(webhook, {...});
  return await result.json(); // ← 添加 return
}`
      },
      {
        title: '问题 2: 异步操作未完成',
        check: '检查是否使用了 await',
        fix: `// ❌ 错误
fetch(webhook, {...}); // 没有 await

// ✅ 正确
const response = await fetch(webhook, {...});
const result = await response.json();`
      },
      {
        title: '问题 3: 错误被捕获但未输出',
        check: '检查 try-catch 块',
        fix: `try {
  const result = await send();
  console.log('成功:', result);
} catch (error) {
  console.error('失败:', error.message); // ← 输出错误
  throw error; // ← 抛出错误
}`
      }
    ];

    issues.forEach((issue, i) => {
      log('yellow', issue.title);
      console.log(`检查：${issue.check}`);
      console.log('修复示例:');
      console.log(issue.fix);
      console.log('');
    });

    // 步骤 4: 推荐方案
    log('blue', '【步骤 4】推荐解决方案');
    console.log('');
    
    log('green', '使用 feishu-message-guard 技能:');
    console.log('');
    console.log('```javascript');
    console.log("const feishu = require('./skills/feishu-message-guard');");
    console.log('');
    console.log('const result = await feishu.send({');
    console.log('  webhook: process.env.FEISHU_WEBHOOK,');
    console.log('  content: { text: "消息内容" }');
    console.log('});');
    console.log('');
    console.log("console.log('发送结果:', result);");
    console.log('// ✅ 输出：{ success: true, format: "text", ... }');
    console.log('```');
    console.log('');
    
    log('cyan', '优势:');
    console.log('  ✅ 自动降级（富文本→卡片→纯文本）');
    console.log('  ✅ 完整的错误处理');
    console.log('  ✅ 明确的返回值（不再 null）');
    console.log('  ✅ 详细的诊断信息');
    
  } else {
    log('red', `❌ 飞书返回错误：${result.code}`);
    log('red', `消息：${result.msg || '未知错误'}`);
    console.log('');
    
    const errorGuide = {
      99991663: 'Webhook URL 无效或已失效，需要重新获取',
      99991661: 'App ID 或 App Secret 错误',
      99991665: '消息内容太长',
      99991666: '缺少必填字段',
      99991667: 'msg_type 不支持'
    };
    
    if (errorGuide[result.code]) {
      log('yellow', '解决方案:');
      console.log(errorGuide[result.code]);
    }
  }

  console.log('');
  log('cyan', '='.repeat(60));
  log('cyan', '诊断完成');
  console.log('');
  
  const saveConfig = await question('要保存 Webhook 配置吗？(y/n): ');
  if (saveConfig.toLowerCase() === 'y') {
    const fs = require('fs');
    const envPath = '/home/admin/.openclaw/workspace/.env';
    const content = `FEISHU_WEBHOOK=${webhook}\n`;
    
    try {
      fs.appendFileSync(envPath, content);
      log('green', `✅ 配置已保存到 ${envPath}`);
    } catch (e) {
      fs.writeFileSync(envPath, content);
      log('green', `✅ 配置已创建 ${envPath}`);
    }
  }

  rl.close();
}

main().catch(console.error);
