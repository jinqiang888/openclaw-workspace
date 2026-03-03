---
name: feishu-message-fallback
description: 飞书消息降级链。当消息发送失败时自动降级：富文本 → 交互卡片 → 纯文本。解决飞书回传超时、格式不支持等问题。
---

# 飞书消息降级链

**EvoMap 成熟方案** | GDI: 63.55 | 复用：944k+

---

## 🎯 解决的问题

- ✅ 飞书回传超时
- ✅ 富文本格式不支持
- ✅ 卡片 schema 不匹配
- ✅ 消息静默失败

---

## 🔄 降级流程

```
┌─────────────┐
│  富文本消息  │
│  (最漂亮)   │
└──────┬──────┘
       │ ❌ 失败/超时
       ▼
┌─────────────┐
│  交互卡片    │
│  (中等)     │
└──────┬──────┘
       │ ❌ 失败/超时
       ▼
┌─────────────┐
│  纯文本消息  │
│  (保证送达) │
└─────────────┘
```

---

## 🛠️ 核心功能

### 1. 自动降级
发送失败时自动尝试更简单的格式。

### 2. 超时重试
每次发送带超时控制，失败自动重试。

### 3. 错误检测
自动识别格式错误、超时错误、网络错误。

### 4. 日志记录
记录每次降级过程，方便诊断。

---

## 📦 用法

### 基本用法
```javascript
const { sendMessageWithFallback } = require('./skills/feishu-message-fallback');

await sendMessageWithFallback({
  content: '这是一条消息',
  title: '消息标题',
  timeout: 5000,  // 5 秒超时
  maxRetries: 3   // 最多重试 3 次
});
```

### 命令行
```bash
# 测试发送
node skills/feishu-message-fallback/scripts/test.js "测试消息"

# 查看日志
tail -f /workspace/logs/feishu-fallback.log
```

---

## ⚙️ 配置

### 默认配置
```javascript
{
  timeout: 5000,      // 单次发送超时 (毫秒)
  maxRetries: 3,      // 最大重试次数
  backoff: 1000,      // 重试间隔 (毫秒)
  formats: ['rich', 'card', 'text']  // 降级顺序
}
```

### 自定义配置
```javascript
await sendMessageWithFallback(content, {
  timeout: 10000,
  formats: ['text']  // 只发纯文本
});
```

---

## 📊 错误处理

### 触发降级的错误
| 错误类型 | 降级 | 重试 |
|----------|------|------|
| 超时 | ✅ | ✅ |
| 格式不支持 | ✅ | ❌ |
| 网络错误 | ❌ | ✅ |
| 认证失败 | ❌ | ❌ |

### 错误代码
```javascript
// 富文本失败
FeishuFormatError: 格式不支持 → 降级到卡片

// 卡片失败
FeishuCardError: schema 不匹配 → 降级到纯文本

// 超时
TimeoutError: 等待超时 → 重试或降级

// 网络错误
NetworkError: 连接失败 → 重试
```

---

## 📁 日志位置

- 发送日志：`/workspace/logs/feishu-fallback.log`
- 错误报告：`/workspace/logs/feishu-errors/`

---

## 🔗 相关资源

- [EvoMap 资产](https://evomap.ai/a2a/assets/sha256:8ee18eac8610ef9ecb60d1392bc0b8eb2dd7057f119cb3ea8a2336bbc78f22b3)
- GDI: 63.55
- 复用：944k+

---

**核心原则**: 保证消息送达，格式次要。
