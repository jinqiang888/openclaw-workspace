---
name: chrome-devtools-mcp-guide
description: Chrome DevTools MCP (Model Context Protocol) 浏览器自动化指南。用于控制浏览器、截图、操作 DOM、网络监控等。当需要浏览器自动化、网页测试、数据抓取时使用此技能。
---

# Chrome DevTools MCP 指南

浏览器自动化通过 MCP 协议实现。

## 📌 重要说明

**Chrome DevTools MCP 不是 Skill，而是一个 MCP 服务器**。需要通过 OpenClaw 的 MCP 系统集成。

## 🚀 快速开始

### 1. 安装 MCP 服务器
```bash
# 克隆 MCP 仓库
git clone https://github.com/openclaw/chrome-devtools-mcp.git
cd chrome-devtools-mcp
npm install
```

### 2. 配置 OpenClaw
在 OpenClaw 配置中添加 MCP 服务器：
```json
{
  "mcp": {
    "servers": {
      "chrome-devtools": {
        "command": "node",
        "args": ["/path/to/chrome-devtools-mcp/index.js"],
        "env": {
          "CHROME_PATH": "/usr/bin/google-chrome"
        }
      }
    }
  }
}
```

### 3. 重启 OpenClaw
```bash
openclaw gateway restart
```

## 🛠️ 可用功能

### 浏览器控制
- `browser.open(url)` - 打开网页
- `browser.close()` - 关闭浏览器
- `browser.screenshot()` - 截图
- `browser.navigate(url)` - 导航到新页面

### DOM 操作
- `browser.click(selector)` - 点击元素
- `browser.type(selector, text)` - 输入文本
- `browser.evaluate(js)` - 执行 JavaScript
- `browser.snapshot()` - 获取页面快照

### 网络监控
- `browser.network.requests()` - 获取网络请求
- `browser.network.block(urls)` - 屏蔽特定资源

## 📋 使用示例

### 示例 1: 打开网页并截图
```javascript
// 通过 OpenClaw browser 工具
browser.open("https://example.com")
browser.screenshot({ fullPage: true })
```

### 示例 2: 自动化表单填写
```javascript
browser.open("https://example.com/login")
browser.type("#username", "user")
browser.type("#password", "pass")
browser.click("#submit")
```

### 示例 3: 获取页面内容
```javascript
const content = await browser.evaluate(`
  document.querySelector('article').innerText
`)
```

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CHROME_PATH` | 自动检测 | Chrome 浏览器路径 |
| `CHROME_USER_DATA` | 临时目录 | 用户数据目录 |
| `HEADLESS` | true | 无头模式 |

## 🔧 故障排除

### 问题 1: Chrome 未找到
```bash
# 安装 Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

### 问题 2: MCP 连接失败
```bash
# 检查 MCP 服务器状态
openclaw mcp status

# 查看日志
openclaw mcp logs chrome-devtools
```

### 问题 3: 权限问题
```bash
# 以无头模式运行
export HEADLESS=true
```

## 📚 封装为 Skill

由于 MCP 是底层协议，建议封装为 Skill 方便使用：

```markdown
skills/browser-automation/
├── SKILL.md          # 高层使用说明
├── index.js          # 封装 MCP 调用
└── scripts/
    └── automate.js   # 常用自动化脚本
```

## 🔗 相关资源

- [OpenClaw Browser 工具文档](https://docs.openclaw.ai/tools/browser)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

---

**注意**: 此技能是配置指南，实际功能通过 OpenClaw 的 `browser` 工具提供。
