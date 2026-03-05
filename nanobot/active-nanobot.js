#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ActiveNanobot {
  constructor() {
    this.appId = 'cli_a92d0073a838dbb5';
    this.appSecret = 's5wbmYJcg8WZL0eBeG6f0cstPw3HjR6G';
    this.triggerFile = path.join(__dirname, 'test-trigger.md');
    this.logFile = path.join(__dirname, 'nanobot-active.log');
    this.accessToken = null;
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
    console.log(logEntry.trim());
  }

  async getAccessToken() {
    try {
      const response = await axios.post(
        'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
        {
          app_id: this.appId,
          app_secret: this.appSecret
        }
      );
      
      this.accessToken = response.data.app_access_token;
      this.log('Access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      this.log(`Failed to get access token: ${error.message}`);
      throw error;
    }
  }

  async sendMessage(content) {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    try {
      // 正确的飞书消息格式
      const messageData = {
        receive_id: 'ou_295ca01249884166c867107d48ffd49c',
        msg_type: 'text',
        content: JSON.stringify({
          text: content
        }),
        receive_id_type: 'user_id'
      };

      const response = await axios.post(
        'https://open.feishu.cn/open-apis/im/v1/messages',
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            receive_id_type: 'user_id'
          }
        }
      );

      this.log(`Message sent successfully: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.log(`Failed to send message: ${error.message}`);
      this.log(`Error details: ${JSON.stringify(error.response?.data || error)}`);
      throw error;
    }
  }

  async monitorTrigger() {
    this.log('Active Nanobot started, monitoring trigger file...');
    
    // 检查触发文件
    if (fs.existsSync(this.triggerFile)) {
      const content = fs.readFileSync(this.triggerFile, 'utf8').trim();
      if (content) {
        this.log('Trigger detected, sending message...');
        await this.sendMessage('🔧 **Nanobot 维修师**: 独立飞书机器人已激活！测试消息发送成功。');
      }
    }
  }
}

// 启动 Nanobot
const bot = new ActiveNanobot();
bot.monitorTrigger().catch(console.error);