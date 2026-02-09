# DBPs Time Series Deep Learning Analysis Frontend

A modern Electron desktop application for deep learning analysis of Disinfection Byproducts (DBPs) time series data, built with Electron-Vite, React, and shadcn/ui.

![Electron](https://img.shields.io/badge/Electron-39.2.6-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.7-38B2AC?logo=tailwindcss)

## ✨ Features

### 🔄 Training Modes

- **Single Mode** - 固定超参数训练
- **Autotune Mode** - 贝叶斯自动调参优化

### 📊 Data Module

- CSV 文件拖放上传
- 自动解析与预览
- **列角色配置**（Input/Output/Reference/Unused）
- **数据集划分**（6:2:2, 7:1:2, 7:2:1 等预设）
- LocalStorage 状态持久化

### 📈 Visualization Module

- 单变量时间序列可视化
- X 轴范围选择
- 统计卡片（Min/Max/Avg）
- 浅蓝色坐标轴（深色主题优化）

### 🧠 Model Configuration

- **深度学习**：MLP, RNN, LSTM, GRU
- **机器学习**：XGBoost, LightGBM, CatBoost
- Single 模式：直接参数输入
- Autotune 模式：参数范围 + 分布类型（Log/Uniform）+ 数据类型（Int/Float）

### 📉 Training Monitor

- Epoch 进度条
- 当前 Epoch Loss（Train/Val）
- 最佳 Epoch Loss（验证 Loss 最低）
- Loss 曲线图表
- **收敛指示器**
- Autotune：Trial 进度条 + Trial 选择器

### 📋 Results Dashboard

- 输出变量选择器
- 评估指标：R², MSE, MAE, RMSE
- 预测值 vs 真实值对比图
- 散点图（理想预测沿对角线）
- Autotune：最佳 Trial 显示 + 超参数展示

## 🛠️ Tech Stack

- **Framework**: Electron + Vite + React 19
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **CSV Parsing**: PapaParse

## 🚀 Quick Start

### Requirements

- Node.js 18+
- Yarn or npm

### Installation

```bash
# Clone the repository
git clone git@github.com:noire02qwq/timeseries-frontend.git
cd timeseries-frontend

# Install dependencies
yarn install

# Start development server
yarn dev
```

## 📦 Packaging / 打包

### Build for All Platforms

```bash
# Build production bundle
yarn build
```

### Linux 打包

```bash
# Build for Linux (AppImage, deb, rpm)
yarn build:linux

# 输出目录: dist/
# 生成文件:
#   - *.AppImage (通用 Linux 格式)
#   - *.deb (Debian/Ubuntu)
#   - *.rpm (Fedora/CentOS)
```

### Windows 打包

```bash
# Build for Windows (NSIS installer, portable)
yarn build:win

# 输出目录: dist/
# 生成文件:
#   - *-Setup.exe (安装程序)
#   - *.exe (便携版)
```

### macOS 打包

```bash
# Build for macOS (DMG, app)
yarn build:mac

# 输出目录: dist/
# 生成文件:
#   - *.dmg (磁盘映像)
#   - *.app (应用程序)
```

### 打包配置

打包配置位于 `electron-builder.yml`，可自定义：

- 应用名称、图标
- 安装程序选项
- 代码签名（发布时需要）

### 跨平台打包注意事项

| 目标平台 | 在此平台打包             |
| -------- | ------------------------ |
| Linux    | Linux, macOS             |
| Windows  | Windows, macOS (需 Wine) |
| macOS    | macOS only               |

## 📁 Project Structure

```
src/
└── renderer/src/
    ├── components/
    │   ├── ui/              # shadcn base components
    │   ├── DataUpload.jsx   # CSV upload + column config
    │   ├── TimeSeriesChart.jsx  # Visualization
    │   ├── ModelConfig.jsx  # ML/DL model selection
    │   ├── TrainingMonitor.jsx  # Training progress
    │   └── ResultsDashboard.jsx # Metrics & predictions
    ├── lib/
    │   └── utils.js
    ├── App.jsx              # Main app with mode switch
    ├── main.jsx
    └── index.css            # Global styles
```

## 📝 License

MIT
