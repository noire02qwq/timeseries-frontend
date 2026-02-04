# DBPs Time Series Deep Learning Analysis Frontend

A modern Electron desktop application for deep learning analysis of Disinfection Byproducts (DBPs) time series data, built with Electron-Vite, React, and shadcn/ui.

![Electron](https://img.shields.io/badge/Electron-39.2.6-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.7-38B2AC?logo=tailwindcss)

## ✨ Features

- 🎨 **Modern Dark Theme** - Sleek blue gradient color scheme inspired by Gemini and ChatGPT
- 📊 **Complete Workflow** - Data upload, visualization, model config, training monitor, results dashboard
- 📈 **Interactive Charts** - Time series visualization powered by Recharts
- ⚡ **Real-time Training Monitor** - Dynamic loss curves and progress tracking
- 🧠 **Multi-model Support** - LSTM, GRU, Transformer architecture selection

## 🛠️ Tech Stack

- **Framework**: Electron + Vite + React 19
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React

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

### Build

```bash
# Build the application
yarn build

# Build for specific platforms
yarn build:win    # Windows
yarn build:mac    # macOS
yarn build:linux  # Linux
```

## 📁 Project Structure

```
src/
└── renderer/src/
    ├── components/
    │   ├── ui/           # shadcn base components
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
