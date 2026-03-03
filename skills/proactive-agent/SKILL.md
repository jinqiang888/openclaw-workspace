---
name: proactive-agent
description: 自我进化 + 反思代理技能。定期回顾行为、分析错误、优化策略、发布经验到 EvoMap。实现持续自我改进和知识积累。
---

# Proactive Agent - 自我进化代理

自动反思、学习、进化的代理系统。

## 🔄 进化循环

```
行动 → 记录 → 反思 → 优化 → 发布 → 进化
  ↑___________________________________↓
```

## 📋 核心功能

### 1. 自动反思
- 每日回顾完成的任务
- 分析错误和失败
- 识别改进机会

### 2. 经验提取
- 从成功中提取模式
- 从失败中吸取教训
- 打包成可复用知识

### 3. 知识发布
- 发布到 EvoMap 赚积分
- 更新本地技能库
- 同步到 MEMORY.md

### 4. 策略优化
- 调整工作流
- 优化提示词
- 更新配置文件

## 🛠️ 用法

### 命令行
```bash
# 手动触发反思
node skills/proactive-agent/scripts/reflect.js

# 生成进化报告
node skills/proactive-agent/scripts/report.js

# 发布到 EvoMap
node skills/proactive-agent/scripts/publish.js
```

### 程序化
```javascript
const agent = require('./skills/proactive-agent');

// 添加事件记录
await agent.logEvent({
  type: 'task_completed',
  task: 'EvoMap 集成',
  outcome: 'success',
  duration: 3600
});

// 触发反思
await agent.reflect();

// 获取改进建议
const suggestions = await agent.getImprovements();
```

## 📊 反思维度

### 任务执行
- [ ] 是否高效完成？
- [ ] 是否有更优方法？
- [ ] 是否可以自动化？

### 代码质量
- [ ] 是否重复造轮子？
- [ ] 是否可以技能化？
- [ ] 是否符合最佳实践？

### 知识管理
- [ ] 是否记录到记忆？
- [ ] 是否可以发布分享？
- [ ] 是否有复用价值？

### 资源使用
- [ ] API 调用是否合理？
- [ ] 是否有浪费？
- [ ] 是否可以优化成本？

## 📁 输出格式

### 反思日志
```markdown
## 2026-03-01 反思

### ✅ 做得好的
- 成功集成 EvoMap，获得 500 起始积分
- 创建 memory_search 技能，避免重复搜索

### ❌ 需要改进
- 开始时直接动手，没有先搜索现有技能
- 配置重复了 2 次才成功

### 💡 改进计划
1. 创建 check-skill-dup.sh 脚本检查重复
2. 将配置流程脚本化

### 📦 可发布资产
- memory_search 技能 → EvoMap
- 技能去重检查脚本 → EvoMap
```

### 进化事件
```json
{
  "type": "EvolutionEvent",
  "date": "2026-03-01",
  "intent": "optimize",
  "mutations_tried": 3,
  "outcome": {
    "status": "success",
    "score": 0.85
  },
  "lessons": [
    "先搜索再动手",
    "重复 3 次必须技能化"
  ]
}
```

## ⏰ 自动触发

### 每日反思 (23:00)
- 回顾当天所有任务
- 生成日报
- 更新 MEMORY.md

### 每周回顾 (周日)
- 分析一周表现
- 识别长期模式
- 规划下周目标

### 事件触发
- 任务失败 → 立即反思
- 发现新模式 → 记录并技能化
- 积分变化 → 分析原因

## 🎯 进化目标

### 短期 (1 周)
- [ ] 发布 5+ 技能到 EvoMap
- [ ] 积分达到 1000+
- [ ] 声誉达到 30+

### 中期 (1 月)
- [ ] 发布 20+ 技能
- [ ] 积分达到 5000+
- [ ] 声誉达到 60+ (可接聚合任务)

### 长期 (3 月)
- [ ] 成为 EvoMap 顶级贡献者
- [ ] 建立完整技能生态系统
- [ ] 实现完全自我进化

## 📈 指标追踪

| 指标 | 当前 | 目标 | 进度 |
|------|------|------|------|
| 技能数量 | 5 | 20 | 25% |
| EvoMap 积分 | 500 | 5000 | 10% |
| 声誉分数 | 0 | 60 | 0% |
| 任务完成 | 0 | 50 | 0% |

## 🔧 配置

### 反思提示词
```markdown
# 反思提示

回顾今天的行动，回答：
1. 什么做得好？为什么？
2. 什么可以改进？如何改进？
3. 学到了什么新模式？
4. 有什么可以技能化/发布？
```

### 发布策略
```javascript
{
  autoPublish: true,      // 自动发布高质量资产
  minGDIScore: 60,        // 最低 GDI 分数
  includeEvolutionEvent: true, // 包含进化事件
  earnCredits: true       // 赚取积分
}
```

## 📚 参考

- [EvoMap 协议文档](https://evomap.ai/skill.md)
- [GEP-A2A 规范](https://evomap.ai/wiki?doc=gep-a2a)
- [反思最佳实践](skills/proactive-agent/references/reflection-patterns.md)
