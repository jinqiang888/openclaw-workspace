---
name: http-retry-mechanism
description: 通用 HTTP 重试机制。指数退避 + 超时控制 + 连接池。处理瞬时网络故障、频率限制、连接重置。提升 API 成功率~30%。
---

# HTTP 重试机制

**EvoMap 成熟方案** | GDI: 66.0 | 复用：945k+ | 成功连击：22

---

## 🎯 解决的问题

- ✅ API 调用超时
- ✅ 网络连接重置 (ECONNRESET)
- ✅ 连接拒绝 (ECONNREFUSED)
- ✅ 频率限制 (429 Too Many Requests)
- ✅ 瞬时网络故障

---

## 🔄 核心机制

### 1. 指数退避重试
```
第 1 次失败 → 等待 1s → 重试
第 2 次失败 → 等待 2s → 重试
第 3 次失败 → 等待 4s → 重试
第 4 次失败 → 等待 8s → 重试
第 5 次失败 → 放弃
```

### 2. AbortController 超时控制
每个请求独立超时，避免全局阻塞。

### 3. 全局连接池
复用 TCP 连接，减少握手开销。

---

## 🛠️ 用法

### 基本用法
```javascript
const { fetchWithRetry } = require('./skills/http-retry');

const response = await fetchWithRetry('https://api.example.com/data', {
  timeout: 5000,
  maxRetries: 5,
  backoff: 'exponential'
});
```

### 自定义配置
```javascript
await fetchWithRetry(url, {
  timeout: 10000,        // 超时 10 秒
  maxRetries: 3,         // 最多重试 3 次
  backoffMs: 1000,       // 初始退避 1 秒
  maxBackoffMs: 30000,   // 最大退避 30 秒
  retryOn: [429, 500, 502, 503]  // 重试的状态码
});
```

---

## ⚙️ 配置

### 默认配置
```javascript
{
  timeout: 5000,
  maxRetries: 5,
  backoffMs: 1000,
  maxBackoffMs: 30000,
  retryOn: [429, 500, 502, 503, 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT']
}
```

### 重试策略
| 策略 | 说明 |
|------|------|
| `exponential` | 指数退避 (1s, 2s, 4s, 8s...) |
| `linear` | 线性退避 (1s, 2s, 3s, 4s...) |
| `fixed` | 固定退避 (每次 1s) |

---

## 📊 错误处理

### 自动重试的错误
| 错误类型 | 重试 | 说明 |
|----------|------|------|
| TimeoutError | ✅ | 请求超时 |
| ECONNRESET | ✅ | 连接重置 |
| ECONNREFUSED | ✅ | 连接拒绝 |
| ETIMEDOUT | ✅ | 连接超时 |
| 429 Too Many Requests | ✅ | 频率限制 |
| 500 Internal Server Error | ✅ | 服务器错误 |
| 502 Bad Gateway | ✅ | 网关错误 |
| 503 Service Unavailable | ✅ | 服务不可用 |

### 不重试的错误
| 错误类型 | 重试 | 说明 |
|----------|------|------|
| 400 Bad Request | ❌ | 请求错误 |
| 401 Unauthorized | ❌ | 认证失败 |
| 403 Forbidden | ❌ | 权限不足 |
| 404 Not Found | ❌ | 资源不存在 |

---

## 📁 日志

```javascript
// 启用日志
await fetchWithRetry(url, {
  log: true,  // 输出重试日志
  logLevel: 'debug'
});
```

---

## 🔗 相关资源

- [EvoMap 资产](https://evomap.ai/a2a/assets/sha256:6c8b2bef4652d5113cc802b6995a8e9f5da8b5b1ffe3d6bc639e2ca8ce27edec)
- GDI: 66.0
- 复用：945k+

---

**核心原则**: 瞬时错误自动恢复，永久错误快速失败。
