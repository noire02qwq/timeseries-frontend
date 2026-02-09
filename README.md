# DBPs Time Series Deep Learning Analysis Frontend

A modern Electron desktop application for deep learning analysis of Disinfection Byproducts (DBPs) time series data, built with Electron-Vite, React, and shadcn/ui.

![Electron](https://img.shields.io/badge/Electron-39.2.6-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.7-38B2AC?logo=tailwindcss)

## ✨ Features

### 🔄 Training Modes

- **Single Mode** - Train with fixed hyperparameters
- **Autotune Mode** - Bayesian hyperparameter optimization

### 📊 Data Module

- Drag-and-drop CSV file upload
- Automatic parsing and preview
- **Column role configuration** (Input/Output/Reference/Unused)
- **Dataset splitting** (6:2:2, 7:1:2, 7:2:1 presets for Train/Val/Test)
- LocalStorage state persistence across tab switches

### 📈 Visualization Module

- Single-column time series visualization
- X-axis range selection (start/end row)
- Statistics card (Min/Max/Avg/Current)
- Light blue axis text (optimized for dark theme)
- Five-point X-axis ticks (quartile display)

### 🧠 Model Configuration

- **Deep Learning**: MLP, RNN, LSTM, GRU
- **Machine Learning**: XGBoost, LightGBM, CatBoost
- Single Mode: Direct parameter input fields
- Autotune Mode: Parameter range (min/max/step) + Distribution type (Log/Uniform) + Data type (Int/Float)
- Output directory configuration
- Training settings (max epochs, random seed)

### 📉 Training Monitor

- Epoch progress bar with percentage
- Current epoch losses (Train Loss / Validation Loss)
- Best epoch losses (lowest validation loss)
- Real-time loss curves chart
- **Convergence indicator** (detects when training has stabilized)
- Autotune Mode: Trial progress bar + Trial selector for viewing past trials

### 📋 Results Dashboard

- Output variable selector (matches model output columns)
- Evaluation metrics: R², MSE, MAE, RMSE
- Prediction vs Actual line chart comparison
- Scatter plot (ideal predictions follow diagonal line)
- Autotune Mode: Best trial highlight + Hyperparameter display for selected trial

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

## 📦 Packaging

### Build for Development

```bash
# Build production bundle only (no packaging)
yarn build
```

### Linux Packaging

```bash
# Build for Linux (AppImage, deb, rpm)
yarn build:linux

# Output directory: dist/
# Generated files:
#   - *.AppImage (Universal Linux format, run directly)
#   - *.deb (Debian/Ubuntu installer)
#   - *.rpm (Fedora/CentOS installer)
```

### Windows Packaging

```bash
# Build for Windows (NSIS installer, portable)
yarn build:win

# Output directory: dist/
# Generated files:
#   - *-Setup.exe (NSIS installer)
#   - *.exe (Portable executable)
```

### macOS Packaging

```bash
# Build for macOS (DMG, app bundle)
yarn build:mac

# Output directory: dist/
# Generated files:
#   - *.dmg (Disk image)
#   - *.app (Application bundle)
```

### Build Configuration

Packaging configuration is located in `electron-builder.yml`. You can customize:

- Application name and icon
- Installer options
- Code signing (required for distribution)
- Target formats

### Cross-Platform Build Notes

| Target Platform | Build On                       |
| --------------- | ------------------------------ |
| Linux           | Linux, macOS                   |
| Windows         | Windows, macOS (requires Wine) |
| macOS           | macOS only                     |

## 📁 Project Structure

```
src/
├── main/               # Electron main process
├── preload/            # Preload scripts
└── renderer/src/       # React frontend
    ├── components/
    │   ├── ui/              # shadcn base components
    │   ├── DataUpload.jsx   # CSV upload + column config + split
    │   ├── TimeSeriesChart.jsx  # Single-column visualization
    │   ├── ModelConfig.jsx  # ML/DL model selection + params
    │   ├── TrainingMonitor.jsx  # Progress + loss curves + convergence
    │   └── ResultsDashboard.jsx # Metrics + prediction charts
    ├── lib/
    │   └── utils.js         # Utility functions
    ├── App.jsx              # Main app with Single/Autotune mode switch
    ├── main.jsx             # React entry point
    └── index.css            # Global styles + design tokens
```

## 🔧 Development

```bash
# Run development server with hot reload
yarn dev

# Lint code
yarn lint

# Format code
yarn format
```

## 📝 License

MIT
