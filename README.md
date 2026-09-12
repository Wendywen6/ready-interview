# Ready — 保研面试深度体检

> **不是帮你多刷题，而是帮你做一次面试前的深度体检——扫描简历风险、验证项目归属、模拟压力追问。**

## 🎯 产品定位

Ready 是一个专为 **CS/AI 方向保研复试** 设计的 AI 面试深度体检工具。

核心问题：保研面试前最焦虑的不是"没准备"，而是"不知道自己哪里没准备好"。Ready 帮你回答：

> **"我的简历哪里最容易被追问？我的项目经历经得起追问吗？面对质疑我能站得住吗？"**

## ✨ 三大核心模块

### 1. 🔬 简历风险扫描 (Resume Risk Scan)
上传简历后，AI 像安全审计一样拆解简历，识别最容易被追问的风险点。每个风险点拆分为 3-5 个原子能力（如一篇论文 → 贡献边界、方法选择、实验设计、Limitation 认知），精确到可诊断的最小单元。

### 2. 🔍 项目归属验证 (Ownership Audit)
AI 面试官不只问知识，还会专门追问项目归属——"这个项目几个人？你负责哪个模块？为什么选这个方法？遇到什么 bug？"验证候选人是否真正参与。

### 3. ⚡ 压力测试 (Stress Test)
修复薄弱点后，不是简单换题再问，而是用 4 种压力策略测试：
- **质疑式**："但很多人认为这个方法只是增加了复杂度，你怎么看？"
- **反事实式**："如果导师要求换一种方法，你会怎么设计？"
- **连续追问式**：在一个点上持续深入 3-4 层
- **交叉验证式**：用候选人之前的回答来质疑当前回答

## 🔑 能力点四种状态

| 状态 | 含义 |
|------|------|
| ⚪ Unknown | 未检查 |
| 🔴 Weak | 已暴露明确问题（标注错误归因：知识缺口/表达缺口/证据不足） |
| 🟡 Pending | 初测通过，待压力测试 |
| 🟢 Ready | 无提示冷测 + 压力测试通过（两个条件缺一不可） |

## 🛠 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **状态管理**: Zustand + localStorage 持久化
- **AI 引擎**: DeepSeek API (OpenAI 兼容接口，支持流式输出)
- **PDF 解析**: 客户端 pdfjs-dist
- **部署**: Vercel

## 🚀 本地运行

### 前置要求
- Node.js 18+
- DeepSeek API Key ([获取地址](https://platform.deepseek.com))

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/Wendywen6/ready-interview.git
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

## 📝 AI 工具使用

| 工具 | 用途 |
|------|------|
| **Cursor (Claude)** | 整体项目开发：代码编写、调试、迭代、产品设计讨论 |
| **DeepSeek API** | 产品核心 AI 引擎：简历分析、诊断提问、归属验证、评估归因、修复训练、压力测试 |

## 🔗 链接

- **线上地址**: https://ready-interview-delta.vercel.app/
- **Product Memo**: [PRODUCT_MEMO.md](./PRODUCT_MEMO.md)

## 📄 License

MIT
