// 飞书集成模块 - 用于 Nanobot 与飞书交互

const { message } = require('@openclaw/core');

class FeishuIntegration {
  constructor() {
    this.botName = 'OpenClaw维修师';
    this.triggerKeywords = ['@维修师', '@nanobot', '维修师', 'nanobot'];
  }

  // 发送维护报告到飞书
  async sendReport(content, target = null) {
    try {
      await message({
        action: 'send',
        channel: 'feishu',
        target: target || process.env.FEISHU_DEFAULT_TARGET,
        message: `🔧 **${this.botName}**\n\n${content}`
      });
      return true;
    } catch (error) {
      console.error('❌ 飞书消息发送失败:', error.message);
      return false;
    }
  }

  // 检查消息是否触发 nanobot
  isTriggerMessage(text) {
    return this.triggerKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // 处理飞书消息
  async handleMessage(messageText, senderId, chatId) {
    if (this.isTriggerMessage(messageText)) {
      // 触发手动维护
      const { manualTrigger } = require('./main.js');
      await manualTrigger();
      
      // 发送确认消息
      await this.sendReport('✅ 收到指令，开始手动诊断和修复...', chatId);
      return true;
    }
    return false;
  }
}

module.exports = FeishuIntegration;