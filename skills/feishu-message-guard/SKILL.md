---
name: feishu-message-guard
description: 飞书消息发送守护技能。解决 AppFlow 输出 null、消息发送失败、格式错误等问题。提供降级链：富文本→卡片→纯文本，自动检测并重试。当飞书消息发送失败时使用。
---

# Feishu Message Guard

飞书消息发送守护 - 解决"显示成功但收不到消息"问题。

## 🔍 解决的问题

1. **AppFlow 显示成功但飞书收不到消息**
2. **输出数据显示 "null"**
3. **消息格式错误导致静默失败**
4. **卡片 Schema 验证失败**

## 🚀 快速开始

### 方案 1: 使用降级链（推荐）
```javascript
const feishu = require('./skills/feishu-message-guard');

// 自动降级：富文本 → 卡片 → 纯文本
const result = await feishu.send({
  webhook: process.env.FEISHU_WEBHOOK,
  content: {
    title: "消息标题",
    text: "消息内容"
  }
});

console.log('发送结果:', result);
// 成功：{ success: true, format: 'text', ... }
// 失败：{ success: false, error: '...' }
```

### 方案 2: 指定消息类型
```javascript
// 纯文本消息（最可靠）
await feishu.send({
  webhook: process.env.FEISHU_WEBHOOK,
  msgType: 'text',
  content: { text: '简单消息' }
});

// 富文本消息
await feishu.send({
  webhook: process.env.FEISHU_WEBHOOK,
  msgType: 'post',
  content: {
    title: '标题',
    content: [[
      { tag: 'text', text: '内容' }
    ]]
  }
});
```

### 方案 3: AppFlow 集成
```yaml
# AppFlow 配置
steps:
  - name: 发送飞书消息
    action: node
    params:
      script: skills/feishu-message-guard/scripts/send.js
      args:
        webhook: ${FEISHU_WEBHOOK}
        content: ${MESSAGE_CONTENT}
```

## 📋 消息格式

### 文本消息（最简单，推荐）
```json
{
  "msg_type": "text",
  "content": {
    "text": "消息内容"
  }
}
```

### 富文本消息
```json
{
  "msg_type": "post",
  "content": {
    "post": {
      "zh_cn": {
        "title": "标题",
        "content": [
          [
            { "tag": "text", "text": "第一行" }
          ],
          [
            { "tag": "a", "text": "链接", "href": "https://example.com" }
          ],
          [
            { "tag": "at", "user_id": "open_id_xxx" }
          ]
        ]
      }
    }
  }
}
```

### 卡片消息（最复杂）
```json
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {
        "tag": "plain_text",
        "content": "卡片标题"
      }
    },
    "elements": [
      {
        "tag": "div",
        "text": {
          "tag": "lark_md",
          "content": "卡片内容"
        }
      }
    ]
  }
}
```

## 🔧 诊断工具

### 检查配置
```bash
node skills/feishu-message-guard/scripts/diagnose.js
```

### 测试发送
```bash
node skills/feishu-message-guard/scripts/send.js \
  --webhook "https://open.feishu.cn/open-apis/bot/v2/hook/xxx" \
  --content "测试消息"
```

### 验证 Webhook
```bash
curl -X POST "https://open.feishu.cn/open-apis/bot/v2/hook/xxx" \
  -H "Content-Type: application/json" \
  -d '{"msg_type":"text","content":{"text":"测试"}}'
```

## ⚠️ 常见错误

### 错误 1: 输出 null
**原因**: AppFlow 函数没有返回值或异步未完成

**修复**:
```javascript
// ❌ 错误
async function send() {
  fetch(webhook, { ... }); // 没有 await
}

// ✅ 正确
async function send() {
  const response = await fetch(webhook, { ... });
  const result = await response.json();
  return result; // 返回结果
}
```

### 错误 2: 静默失败
**原因**: 没有检查响应码

**修复**:
```javascript
const result = await feishu.send({ ... });
if (!result.success) {
  console.error('发送失败:', result.error);
  throw new Error(result.error);
}
```

### 错误 3: 格式错误
**原因**: 卡片 Schema 复杂，容易出错

**修复**: 使用降级链，自动切换到简单格式

## 📊 降级链逻辑

```
尝试 1: 富文本 (post)
    ↓ 失败
尝试 2: 交互卡片 (interactive)
    ↓ 失败
尝试 3: 纯文本 (text) ← 最可靠
    ↓ 失败
抛出错误
```

## 🔑 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `FEISHU_WEBHOOK` | 飞书机器人 webhook | ✅ |
| `FEISHU_APP_ID` | App ID (token 刷新用) | ⚠️ 可选 |
| `FEISHU_APP_SECRET` | App Secret | ⚠️ 可选 |

## 📝 检查清单

发送前确认：
```
[ ] Webhook URL 正确 (https://open.feishu.cn/open-apis/bot/v2/hook/xxx)
[ ] 机器人已添加到群聊
[ ] 消息格式符合规范
[ ] 有 return 语句返回结果
[ ] 异步操作使用 await
[ ] 有错误处理和日志输出
```

## 🔗 参考资源

- [飞书机器人文档](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN)
- [消息格式说明](https://open.feishu.cn/document/ukTMukTMukTM/uYjNwUjL2YDM14SM2ATN)
- [错误码说明](https://open.feishu.cn/document/ukTMukTMukTM/ugjM14CO2UjL4ITN)

---

**核心原则**: 优先使用文本消息，复杂需求再用卡片，始终有降级方案。
