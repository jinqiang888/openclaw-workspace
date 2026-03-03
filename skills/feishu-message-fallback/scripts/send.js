/**
 * 飞书消息发送包装器
 * 
 * 自动使用降级链发送飞书消息
 * 用法：node send-feishu.js "消息内容" "接收者 ID"
 */

const fb = require('./skills/feishu-message-fallback');

async function main() {
  const content = process.argv[2] || '测试消息';
  const receiver = process.argv[3];  // 可选：open_id/user_id/chat_id
  
  console.log('=== 发送飞书消息 ===');
  console.log('内容:', content);
  console.log('接收者:', receiver || '默认');
  console.log();
  
  const result = await fb.sendMessageWithFallback({
    content,
    title: 'OpenClaw 消息',
    receiver,
    timeout: 5000,
    maxRetries: 3,
    formats: ['rich', 'card', 'text']
  });
  
  console.log();
  console.log('=== 发送结果 ===');
  console.log('成功:', result.success ? '✅' : '❌');
  console.log('格式:', result.format || '无');
  console.log('尝试次数:', result.attempts.length);
  
  if (!result.success && result.error) {
    console.log('错误:', result.error.message);
  }
  
  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error('发送失败:', err);
  process.exit(1);
});
