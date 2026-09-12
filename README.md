# Ready — 保研面试准备度分诊

> **你不需要准备所有可能的问题。Ready 帮你找出真正还没准备好的部分。**

## 🎯 产品定位

Ready 是一个专为 **CS/AI 方向保研复试** 设计的 AI 面试准备度诊断工具。

与其他 AI 面试产品不同，Ready 不是让你练更多题。它帮你回答一个最关键的问题：

> **"我还有两天，到底还有什么真正值得准备？"**

## ✨ 核心功能

### 1. 面试准备地图 (Interview Map)
上传简历后，AI 分析你的背景，生成个性化的能力点清单，按优先级排序。

### 2. 10分钟快速体检 (Quick Diagnostic)
AI 面试官以**冷测模式**提问——不给提示，不给框架，只问问题并追问。
目标是快速找出你的薄弱点。

### 3. 精准缺口修复 (Gap Repair)
针对诊断出的薄弱点，AI 教练通过**引导式提问**帮你挖掘真实经历，
而不是直接给你"标准答案"。

### 4. 延迟复测 (Delayed Re-test)
修复后不会立刻标记为 Ready。必须通过一个**不同角度的复测题**，
才能证明真正掌握。

### 5. 准备度总结 (Readiness Summary)
明确告诉你：什么已经准备好了，什么还需要练，什么**不用再练了**。

## 🔑 能力点四种状态

| 状态 | 含义 |
|------|------|
| ⚪ Unknown | 未验证，还不知道你会不会 |
| 🔴 Weak | 已暴露明确问题 |
| 🟡 Pending | 训练过但未通过复测 |
| 🟢 Ready | 无提示冷测 + 追问/变式测试通过 |

## 🛠 技术栈

- **前端**: Next.js 14 (App Router) + Tailwind CSS
- **状态管理**: Zustand + localStorage 持久化
- **AI**: DeepSeek API (OpenAI 兼容接口)
- **部署**: Vercel
- **PDF 解析**: pdf-parse

## 🚀 本地运行

### 前置要求
- Node.js 18+
- DeepSeek API Key ([获取地址](https://platform.deepseek.com))

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/ready-interview.git
cd ready-interview

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 DeepSeek API Key

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可使用。

### 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | (必填) |
| `DEEPSEEK_BASE_URL` | API 基础地址 | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 使用的模型 | `deepseek-chat` |

## 📝 AI 工具使用说明

- **Cursor**: 用于整体项目开发，包括代码编写、调试和迭代
- **DeepSeek API**: 产品核心 AI 引擎，负责简历解析、诊断提问、证据提取、修复训练和复测
- **Claude**: 产品设计和 PRD 讨论

## 📄 License

MIT
