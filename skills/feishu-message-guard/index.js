/**
 * Feishu Message Guard - 飞书消息发送守护
 * 
 * 解决：AppFlow 显示成功但收不到消息、输出 null、静默失败
 * 
 * 用法:
 *   const feishu = require('./skills/feishu-message-guard');
 *   const result = await feishu.send({ webhook, content });
 */

const https = require('https');

/**
 * 发送飞书消息（带降级链）
 */
async function send(options) {
  const {
    webhook,
    msgType = 'post', // 默认富文本
    content,
    fallback = true // 启用降级
  } = options;

  // 验证必填参数
  if (!webhook) {
    return {
      success: false,
      error: '缺少 webhook URL',
      code: 'MISSING_WEBHOOK'
    };
  }

  if (!content) {
    return {
      success: false,
      error: '缺少消息内容',
      code: 'MISSING_CONTENT'
    };
  }

  // 尝试发送
  const formats = fallback 
    ? ['post', 'interactive', 'text'] // 降级链
    : [msgType];

  let lastError = null;

  for (const format of formats) {
    try {
      const payload = buildPayload(format, content);
      const result = await makeRequest(webhook, payload);

      // 检查飞书返回码
      if (result.code === 0 || result.StatusCode === 200) {
        return {
          success: true,
          format: format,
          result: result,
          message: '发送成功'
        };
      }

      lastError = new Error(`飞书错误：${result.code} - ${result.msg}`);
      lastError.code = result.code;

      // 如果格式不支持，尝试降级
      if (result.code === 99991666 || result.code === 99991667) {
        console.log(`格式 ${format} 不支持，尝试降级...`);
        continue;
      }

      // 其他错误直接返回
      break;

    } catch (error) {
      lastError = error;
      console.log(`格式 ${format} 发送失败:`, error.message);
      continue;
    }
  }

  // 所有尝试都失败
  return {
    success: false,
    error: lastError?.message || '未知错误',
    code: lastError?.code || 'UNKNOWN_ERROR',
    triedFormats: formats
  };
}

/**
 * 构建消息 payload
 */
function buildPayload(msgType, content) {
  switch (msgType) {
    case 'text':
      return {
        msg_type: 'text',
        content: {
          text: content.text || content.content || '消息'
        }
      };

    case 'post':
      return {
        msg_type: 'post',
        content: {
          post: {
            zh_cn: {
              title: content.title || '消息',
              content: Array.isArray(content.content)
                ? content.content
                : [[{ tag: 'text', text: content.text || content.content }]]
            }
          }
        }
      };

    case 'interactive':
      return {
        msg_type: 'interactive',
        card: content.card || {
          header: {
            title: {
              tag: 'plain_text',
              content: content.title || '消息'
            }
          },
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: content.text || content.content || '消息内容'
              }
            }
          ]
        }
      };

    default:
      throw new Error(`不支持的消息类型：${msgType}`);
  }
}

/**
 * 发送 HTTP 请求
 */
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
      reject(new Error(`请求失败：${e.message}`));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时 (5000ms)'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * 简化版发送（仅文本）
 */
async function sendText(webhook, text) {
  return send({
    webhook,
    msgType: 'text',
    content: { text },
    fallback: false
  });
}

/**
 * 验证 webhook URL
 */
function validateWebhook(webhook) {
  const pattern = /^https:\/\/open\.feishu\.cn\/open-apis\/bot\/v2\/hook\/[a-zA-Z0-9_-]+$/;
  return pattern.test(webhook);
}

module.exports = {
  send,
  sendText,
  validateWebhook,
  buildPayload,
  makeRequest
};
