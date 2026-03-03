#!/usr/bin/env node
/**
 * 飞书消息诊断脚本
 * 
 * 用法：
 *   node scripts/diagnose.js
 *   node scripts/diagnose.js --webhook <url>
 */

const https = require('https');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 解析参数
const args = process.argv.slice(2);
const webhookArg = args.find(a => a.startsWith('--webhook='))?.split('=')[1];
const webhook = webhookArg || process.env.FEISHU_WEBHOOK;

async function main() {
  log('blue', '🔍 飞书消息诊断工具');
  log('blue', '='.repeat(50));
  console.log('');

  // 检查 1: 环境变量
  log('blue', '【检查 1】环境变量配置');
  if (!webhook) {
    log('red', '❌ FEISHU_WEBHOOK 未设置');
    log('yellow', '提示：设置方法：');
    console.log('  export FEISHU_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"');
    console.log('');
  } else {
    log('green', '✅ FEISHU_WEBHOOK 已设置');
    console.log(`   URL: ${webhook.substring(0, 50)}...`);
    console.log('');
  }

  // 检查 2: Webhook 格式
  log('blue', '【检查 2】Webhook URL 格式');
  const pattern = /^https:\/\/open\.feishu\.cn\/open-apis\/bot\/v2\/hook\/[a-zA-Z0-9_-]+$/;
  if (webhook && pattern.test(webhook)) {
    log('green', '✅ URL 格式正确');
    console.log('');
  } else if (webhook) {
    log('red', '❌ URL 格式不正确');
    log('yellow', '正确格式：https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx');
    console.log('');
  }

  // 检查 3: 发送测试消息
  if (!webhook) {
    log('yellow', '跳过发送测试（缺少 webhook）');
    return;
  }

  log('blue', '【检查 3】发送测试消息');
  log('blue', '正在发送...');
  console.log('');

  const testPayload = {
    msg_type: 'text',
    content: {
      text: `🔧 飞书诊断测试 - ${new Date().toLocaleString('zh-CN')}`
    }
  };

  try {
    const result = await makeRequest(webhook, testPayload);
    
    if (result.code === 0 || result.StatusCode === 200) {
      log('green', '✅ 发送成功！');
      console.log('   响应:', JSON.stringify(result));
      console.log('');
      log('green', '🎉 配置正确，可以正常使用');
    } else {
      log('red', '❌ 发送失败');
      console.log('   响应:', JSON.stringify(result));
      console.log('');
      
      // 错误码解释
      if (result.code === 99991663) {
        log('yellow', '错误 99991663: invalid webhook url');
        console.log('   可能原因：');
        console.log('   - Webhook URL 错误或已失效');
        console.log('   - 机器人已被移出群聊');
        console.log('   - 需要重新获取 webhook');
      } else if (result.code === 99991661) {
        log('yellow', '错误 99991661: app access token invalid');
        console.log('   可能原因：');
        console.log('   - App ID 或 App Secret 错误');
        console.log('   - Token 已过期');
      } else {
        log('yellow', `错误 ${result.code}: ${result.msg}`);
      }
    }
  } catch (error) {
    log('red', '❌ 请求失败');
    console.log('   错误:', error.message);
    console.log('');
    log('yellow', '可能原因：');
    console.log('   - 网络连接问题');
    console.log('   - 飞书服务器暂时不可用');
    console.log('   - 防火墙阻止了请求');
  }

  console.log('');
  log('blue', '='.repeat(50));
  log('blue', '诊断完成');
}

function makeRequest(webhook, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhook);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          result.StatusCode = res.statusCode;
          resolve(result);
        } catch (e) {
          reject(new Error(`解析响应失败：${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(data);
    req.end();
  });
}

main().catch(console.error);
