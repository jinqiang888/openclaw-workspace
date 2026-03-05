#!/usr/bin/env node

// 独立 Nanobot 脚本 - 直接使用飞书 Webhook API
// 绕过 OpenClaw 主实例，实现完全独立

const axios = require('axios');
const { execSync } = require('child_process');

// 飞书 Webhook URL (需要在飞书群设置中获取)
const FEISHU_WEBHOOK_URL = process.env.FEISHU_NANOBOT_WEBHOOK || 'YOUR_FEISHU_WEBHOOK_URL';

class StandaloneNanobot {
  constructor() {
    this.logFile = '/tmp/standalone-nanobot.log';
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    require('fs').appendFileSync(this.logFile, logEntry);
    console.log(logEntry.trim());
  }

  async sendFeishuMessage(content) {
    try {
      const message = {
        msg_type: "text",
        content: {
          text: `🔧 Nanobot 维修师\n\n${content}`
        }
      };

      await axios.post(FEISHU_WEBHOOK_URL, message);
      this.log('✅ 消息已通过独立 Webhook 发送');
      return true;
    } catch (error) {
      this.log(`❌ Webhook 发送失败: ${error.message}`);
      return false;
    }
  }

  async healthCheck() {
    this.log('🔍 开始独立健康检查...');
    
    let issues = [];
    
    // 检查 Gateway 状态
    try {
      const gatewayStatus = execSync('openclaw gateway status', { encoding: 'utf8' });
      if (!gatewayStatus.includes('Runtime: running')) {
        issues.push('Gateway 未运行');
      }
    } catch (error) {
      issues.push('Gateway 状态检查失败');
    }
    
    // 检查端口
    try {
      const ports = execSync('ss -tuln | grep -E "(22|16195)"', { encoding: 'utf8' });
      if (!ports.includes('16195')) {
        issues.push('OpenClaw 端口 16195 未监听');
      }
    } catch (error) {
      issues.push('端口检查失败');
    }
    
    if (issues.length === 0) {
      await this.sendFeishuMessage('✅ 系统健康检查通过！所有服务正常运行。');
    } else {
      await this.sendFeishuMessage(`⚠️ 发现问题:\n${issues.join('\n')}`);
    }
    
    return issues.length === 0;
  }
}

// 使用示例:
// 1. 在飞书群设置中创建 Webhook
// 2. 设置环境变量: export FEISHU_NANOBOT_WEBHOOK="你的webhook_url"
// 3. 运行: node standalone-nanobot.js

if (require.main === module) {
  const bot = new StandaloneNanobot();
  
  // 检查是否提供了 Webhook URL
  if (FEISHU_WEBHOOK_URL === 'YOUR_FEISHU_WEBHOOK_URL') {
    console.error('❌ 请设置 FEISHU_NANOBOT_WEBHOOK 环境变量');
    console.error('在飞书群设置中获取 Webhook URL，然后:');
    console.error('export FEISHU_NANOBOT_WEBHOOK="你的实际webhook_url"');
    process.exit(1);
  }
  
  // 执行健康检查
  bot.healthCheck().catch(console.error);
}