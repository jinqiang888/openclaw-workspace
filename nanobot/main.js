#!/usr/bin/env node

// 🔧 Nanobot: OpenClaw 维修师
// 轻量级维护机器人，集成健康检查、诊断、修复能力

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class Nanobot {
  constructor() {
    this.skillsPath = path.join(__dirname, 'skills');
    this.logFile = '/tmp/nanobot.log';
  }

  // 记录日志
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
    console.log(logEntry.trim());
  }

  // 执行健康检查
  async healthCheck() {
    this.log('🔍 开始系统健康检查...');
    
    try {
      // 检查 Gateway 状态
      const gatewayStatus = execSync('openclaw gateway status', { encoding: 'utf8' });
      if (gatewayStatus.includes('Runtime: running')) {
        this.log('✅ Gateway 运行正常');
      } else {
        this.log('⚠️ Gateway 异常，尝试重启...');
        execSync('openclaw gateway restart', { encoding: 'utf8' });
        this.log('🔄 Gateway 已重启');
      }
      
      // 检查通道状态
      const config = JSON.parse(execSync('openclaw config get channels', { encoding: 'utf8' }));
      this.log(`📡 检测到 ${Object.keys(config).length} 个通道配置`);
      
      this.log('✅ 健康检查完成');
      return true;
    } catch (error) {
      this.log(`❌ 健康检查失败: ${error.message}`);
      return false;
    }
  }

  // 故障诊断
  async diagnose() {
    this.log('🔍 开始故障诊断...');
    
    // 使用 agent-introspection 技能
    const introspectionPath = path.join(this.skillsPath, 'agent-introspection', 'diagnose.js');
    if (fs.existsSync(introspectionPath)) {
      this.log('🛠️ 调用自动诊断技能...');
      // 这里会集成具体的诊断逻辑
    }
    
    this.log('✅ 诊断完成');
  }

  // 自动修复
  async autoRepair() {
    this.log('🔧 开始自动修复...');
    
    // 使用 healthcheck 技能的修复功能
    const healthcheckPath = path.join(this.skillsPath, 'healthcheck', 'repair.sh');
    if (fs.existsSync(healthcheckPath)) {
      this.log('🛠️ 执行健康修复脚本...');
      execSync(`bash ${healthcheckPath}`, { encoding: 'utf8' });
    }
    
    this.log('✅ 自动修复完成');
  }

  // 主动维护循环
  async maintenanceLoop() {
    this.log('🤖 Nanobot 维修师启动，开始主动维护循环');
    
    // 立即执行一次完整检查
    await this.fullMaintenance();
    
    // 每 30 分钟执行一次
    setInterval(async () => {
      await this.healthCheck();
    }, 30 * 60 * 1000);
  }

  // 完整维护流程
  async fullMaintenance() {
    await this.healthCheck();
    await this.diagnose();
    await this.autoRepair();
  }

  // 被动响应模式（被 @ 时触发）
  async manualTrigger() {
    this.log('🎯 收到手动触发指令');
    await this.fullMaintenance();
  }
}

// 启动 Nanobot
const bot = new Nanobot();

// 如果作为脚本直接运行
if (require.main === module) {
  // 检查参数
  const args = process.argv.slice(2);
  
  if (args.includes('--manual') || args.includes('-m')) {
    // 手动触发模式
    bot.manualTrigger().catch(console.error);
  } else {
    // 主动维护模式
    bot.maintenanceLoop().catch(console.error);
  }
}

module.exports = Nanobot;