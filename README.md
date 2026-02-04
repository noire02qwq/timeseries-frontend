# DBPs Time Series Deep Learning Analysis Frontend

基于 Electron-Vite + React + shadcn UI 的 DBPs（消毒副产物）时间序列深度学习分析前端应用。

![UI Preview](https://img.shields.io/badge/Electron-39.2.6-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.7-38B2AC?logo=tailwindcss)

## ✨ 特性

- 🎨 **现代暗色主题** - 参考 Gemini 和 ChatGPT 的紫蓝渐变配色
- 📊 **完整工作流** - 数据上传、可视化、模型配置、训练监控、结果分析
- 📈 **交互式图表** - 基于 Recharts 的时间序列可视化
- ⚡ **实时训练监控** - 动态损失曲线和进度追踪
- 🧠 **多模型支持** - LSTM、GRU、Transformer 架构选择

## 🛠️ 技术栈

- **框架**: Electron + Vite + React 19
- **UI 组件**: shadcn/ui (Radix UI)
- **样式**: Tailwind CSS 4
- **图表**: Recharts
- **图标**: Lucide React

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Yarn 或 npm

### 安装

```bash
# 克隆仓库
git clone git@github.com:noire02qwq/timeseries-frontend.git
cd timeseries-frontend

# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

### 构建

```bash
# 构建应用
yarn build

# 构建特定平台
yarn build:win    # Windows
yarn build:mac    # macOS
yarn build:linux  # Linux
```

## 📁 项目结构

```
src/
└── renderer/src/
    ├── components/
    │   ├── ui/           # shadcn 基础组件
    │   ├── DataUpload.jsx
    │   ├── TimeSeriesChart.jsx
    │   ├── ModelConfig.jsx
    │   ├── TrainingMonitor.jsx
    │   └── ResultsDashboard.jsx
    ├── lib/
    │   └── utils.js
    ├── App.jsx
    ├── main.jsx
    └── index.css
```

## 📝 License

MIT
