/**
 * 飞书消息降级链
 * 
 * 富文本 → 失败 → 交互卡片 → 失败 → 纯文本
 * 
 * EvoMap 成熟方案 | GDI: 63.55 | 复用：944k+
 */

const fs = require('fs').promises;
const path = require('path');

const LOGS_DIR = '/home/admin/.openclaw/workspace/logs';
const FALLBACK_LOG = path.join(LOGS_DIR, 'feishu-fallback.log');
const ERRORS_DIR = path.join(LOGS_DIR, 'feishu-errors');

// 确保日志目录存在
async function ensureLogs() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
  await fs.mkdir(ERRORS_DIR, { recursive: true });
}

// 日志
async function log(message, level = 'info') {
  await ensureLogs();
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  await fs.appendFile(FALLBACK_LOG, line);
  console.log(line.trim());
}

// 错误报告
async function reportError(error, context) {
  await ensureLogs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(ERRORS_DIR, `error-${timestamp}.json`);
  
  const report = {
    timestamp,
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    context
  };
  
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  return reportFile;
}

// 延迟
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 发送消息（带降级链）
 * 
 * @param {Object} options - 发送选项
 * @param {string} options.content - 消息内容
 * @param {string} [options.title] - 消息标题
 * @param {string} [options.receiver] - 接收者 (open_id/user_id/chat_id)
 * @param {number} [options.timeout=5000] - 单次发送超时 (毫秒)
 * @param {number} [options.maxRetries=3] - 最大重试次数
 * @param {number} [options.backoff=1000] - 重试间隔 (毫秒)
 * @param {string[]} [options.formats=['rich','card','text']] - 降级顺序
 * @returns {Object} 发送结果
 */
async function sendMessageWithFallback(options) {
  await ensureLogs();
  
  const {
    content,
    title = '消息',
    receiver,
    timeout = 5000,
    maxRetries = 3,
    backoff = 1000,
    formats = ['rich', 'card', 'text']
  } = options;
  
  const result = {
    success: false,
    format: null,
    attempts: [],
    error: null
  };
  
  await log(`开始发送消息，降级链：${formats.join(' → ')}`, 'info');
  
  // 遍历降级链
  for (const format of formats) {
    let lastError = null;
    
    // 重试循环
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await log(`尝试发送 [${format}] (第 ${attempt}/${maxRetries} 次)`, 'info');
        
        const sendResult = await sendWithFormat(format, {
          content,
          title,
          receiver,
          timeout
        });
        
        await log(`发送成功 [${format}]`, 'success');
        
        result.success = true;
        result.format = format;
        result.attempts.push({
          format,
          attempt,
          success: true,
          duration: sendResult.duration
        });
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        await log(`发送失败 [${format}] 第 ${attempt} 次：${error.message}`, 'error');
        
        result.attempts.push({
          format,
          attempt,
          success: false,
          error: error.message
        });
        
        // 判断是否应该降级
        const shouldFallback = shouldDowngrade(error);
        
        if (!shouldFallback && attempt < maxRetries) {
          // 可重试的错误，等待后重试
          await log(`等待 ${backoff}ms 后重试...`, 'info');
          await sleep(backoff);
        } else if (shouldFallback) {
          // 需要降级，跳出重试循环
          await log(`格式不支持，准备降级...`, 'warn');
          break;
        }
      }
    }
    
    // 所有重试都失败了，继续下一个格式
    if (lastError) {
      result.error = lastError;
    }
  }
  
  // 所有格式都失败了
  await log(`所有格式都发送失败`, 'error');
  
  // 生成错误报告
  const reportFile = await reportError(result.error, {
    content: content.substring(0, 200),
    attempts: result.attempts
  });
  
  await log(`错误报告已保存：${reportFile}`, 'warn');
  
  return result;
}

/**
 * 判断是否应该降级（而不是重试）
 */
function shouldDowngrade(error) {
  // 格式错误 - 降级
  if (error.code === 'FeishuFormatError' || 
      error.code === 'markdown_render_failed' ||
      error.code === 'card_send_rejected') {
    return true;
  }
  
  // 超时 - 降级（可能是内容太复杂）
  if (error.code === 'TimeoutError' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // 参数错误 - 降级
  if (error.code === 'BadRequest' || 
      (error.message && error.message.includes('400'))) {
    return true;
  }
  
  // 其他错误（网络错误等）- 重试而不是降级
  return false;
}

/**
 * 用指定格式发送消息
 */
async function sendWithFormat(format, options) {
  const startTime = Date.now();
  
  try {
    switch (format) {
      case 'rich':
        return await sendRichText(options);
      case 'card':
        return await sendInteractiveCard(options);
      case 'text':
        return await sendPlainText(options);
      default:
        throw new Error(`未知格式：${format}`);
    }
  } finally {
    const duration = Date.now() - startTime;
    log(`发送耗时：${duration}ms`, 'debug');
  }
}

/**
 * 发送富文本消息
 */
async function sendRichText(options) {
  const { content, title, timeout } = options;
  
  // 构造富文本消息
  const message = {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: {
          title: title,
          content: [
            [{ tag: 'text', text: content }]
          ]
        }
      }
    }
  };
  
  return await sendToFeishu(message, timeout);
}

/**
 * 发送交互卡片消息
 */
async function sendInteractiveCard(options) {
  const { content, title, timeout } = options;
  
  // 构造交互卡片
  const card = {
    config: {
      wide_screen_mode: true
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${title}**\n${content}`
        }
      }
    ],
    header: {
      template: 'blue',
      title: {
        tag: 'plain_text',
        content: title
      }
    }
  };
  
  const message = {
    msg_type: 'interactive',
    card: card
  };
  
  return await sendToFeishu(message, timeout);
}

/**
 * 发送纯文本消息
 */
async function sendPlainText(options) {
  const { content, timeout } = options;
  
  const message = {
    msg_type: 'text',
    content: {
      text: content
    }
  };
  
  return await sendToFeishu(message, timeout);
}

/**
 * 实际发送到飞书
 */
async function sendToFeishu(message, timeout) {
  // 注意：这里需要根据实际飞书集成方式调整
  // 可能是直接调用飞书 API，也可能是通过 OpenClaw 的 message 工具
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('发送超时'));
    }, timeout);
    
    // TODO: 实际发送逻辑
    // 这里需要根据飞书集成方式实现
    
    // 模拟发送（用于测试）
    setTimeout(() => {
      clearTimeout(timeoutId);
      
      // 模拟成功率：富文本 70%, 卡片 85%, 纯文本 99%
      const successRate = message.msg_type === 'text' ? 0.99 : 
                         message.msg_type === 'interactive' ? 0.85 : 0.70;
      
      if (Math.random() < successRate) {
        resolve({ success: true, duration: 100 });
      } else {
        reject(new Error('模拟发送失败'));
      }
    }, 100);
  });
}

module.exports = {
  sendMessageWithFallback,
  sendRichText,
  sendInteractiveCard,
  sendPlainText,
  sendToFeishu,
  log,
  shouldDowngrade
};
