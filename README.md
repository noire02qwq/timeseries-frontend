# DBPs Time Series Deep Learning Analysis Frontend

A modern Electron desktop application for deep learning analysis of Disinfection Byproducts (DBPs) time series data, built with Electron-Vite, React, and shadcn/ui.

![Electron](https://img.shields.io/badge/Electron-39.2.6-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.7-38B2AC?logo=tailwindcss)

---

## ✨ Features

### 🔄 Training Modes

- **Manual Mode** — Train with fixed hyperparameters
- **Autotune Mode** — Bayesian hyperparameter optimization with trial management

### 📂 Data Modes

- **Sequential Data** — Preserves time order during dataset splitting (for time-series models)
- **Tabular Data** — Randomly shuffles rows before splitting (for non-sequential models). Sequential models (RNN, LSTM, GRU) are automatically hidden in Tabular mode.

### 📊 Data Module

- Drag-and-drop **CSV** and **XLSX** file upload
- **Confirm button** — Data parsing and preview are deferred until user clicks Confirm
- Automatic parsing and column detection
- **Column role configuration** (Input / Output / Reference / Unused)
- **Dataset splitting** (6:2:2, 7:1:2, 7:2:1 presets for Train/Val/Test)
- Tabular mode indicator with shuffle warning
- LocalStorage state persistence across tab switches

### 📈 Visualization Module

- Single-column time series visualization
- X-axis range selection (start/end row)
- **Confirm button** — Chart rendering deferred until settings are configured
- Statistics card (Min / Max / Avg / Current)
- Custom axis styling (light blue, optimized for dark theme)
- Five-point X-axis ticks (quartile display)

### 🧠 Model Configuration

- **Deep Learning**: MLP, RNN, LSTM, GRU
- **Machine Learning**: XGBoost, LightGBM, CatBoost
- Manual Mode: Direct parameter input fields
- Autotune Mode: Parameter range (min/max/step) + Distribution type (Log/Uniform) + Data type (Int/Float)
- Tabular mode automatically filters out sequential models (RNN, LSTM, GRU)
- Output directory configuration
- Training settings (max epochs, random seed)

### 📉 Training Monitor

- Epoch progress bar with percentage
- Current epoch losses (Train Loss / Validation Loss)
- Best epoch losses (lowest validation loss)
- **Show button** — Loss curves are snapshots, not real-time (click Show to capture current state)
- **Convergence indicator** (detects when training has stabilized)
- Autotune Mode: Trial progress bar + **Dropdown trial selector** with validation loss display

### 📋 Results & Assessment

- **Run Test on Test Set** button — Results only shown after explicit test run
- Output variable selector (matches model output columns)
- Evaluation metrics: R², MSE, MAE, RMSE (displayed beside the scatter plot)
- Prediction vs Actual line chart comparison
- **Square scatter plot** (aspect-ratio 1:1) with y=x reference line
- Autotune Mode: Best trial auto-selected + **Advanced toggle** with trial dropdown
- **Save button** — Export config.toml, model files (.onnx, .pt), and loss_history.csv

### 🎯 Prediction (External Testing)

- Independent of training mode settings
- Upload external **CSV** or **XLSX** datasets for model testing
- Specify model directory (default: latest saved model)
- Same visualizations as Results & Assessment (metrics, line chart, square scatter)
- Dataset requirement warning (must contain model input/output columns)

## 🛠️ Tech Stack

| Category      | Technology                 |
| ------------- | -------------------------- |
| Framework     | Electron + Vite + React 19 |
| UI Components | shadcn/ui (Radix UI)       |
| Styling       | Tailwind CSS 4             |
| Charts        | Recharts                   |
| Icons         | Lucide React               |
| CSV Parsing   | PapaParse                  |
| Excel Parsing | SheetJS (xlsx)             |
| Build         | electron-builder           |

---

## 🚀 Build from Scratch (All Platforms)

This section describes how to clone the project, set up the environment, and build distributable packages on **Windows**, **macOS**, and **Linux** — starting from a fresh machine.

### Prerequisites (All Platforms)

| Tool        | Version | Purpose                     |
| ----------- | ------- | --------------------------- |
| **Git**     | 2.30+   | Clone the repository        |
| **Node.js** | 18.0+   | JavaScript runtime          |
| **Yarn**    | 1.22+   | Package manager (or npm 9+) |

---

### 🪟 Windows

#### 1. Install Prerequisites

**Option A: Using winget (recommended, Windows 10/11)**

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
npm install -g yarn
```

**Option B: Manual Download**

- Git: https://git-scm.com/download/win
- Node.js LTS: https://nodejs.org/ (download the `.msi` installer, which includes npm)
- After installing Node.js, open **PowerShell** or **Command Prompt** and install Yarn:

```powershell
npm install -g yarn
```

#### 2. Verify Installation

```powershell
git --version
node --version
yarn --version
```

#### 3. Clone and Install

```powershell
git clone https://github.com/noire02qwq/timeseries-frontend.git
cd timeseries-frontend
yarn install
```

#### 4. Development (Optional)

```powershell
yarn dev
```

#### 5. Build Distributable Package

```powershell
yarn build:win
```

**Output** (`dist/` directory):

| File                                  | Description                  |
| ------------------------------------- | ---------------------------- |
| `timeseries-frontend-1.0.0-setup.exe` | NSIS installer (recommended) |
| `timeseries-frontend-1.0.0.exe`       | Portable executable          |

> **Note**: Windows may show a SmartScreen warning for unsigned executables. Click "More info" → "Run anyway" to proceed.

---

### 🍎 macOS

#### 1. Install Prerequisites

**Option A: Using Homebrew (recommended)**

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git, Node.js, and Yarn
brew install git node yarn
```

**Option B: Manual Download**

- Git: Comes pre-installed with Xcode Command Line Tools. Install with: `xcode-select --install`
- Node.js LTS: https://nodejs.org/ (download the `.pkg` installer)
- Yarn: `npm install -g yarn`

#### 2. Verify Installation

```bash
git --version
node --version
yarn --version
```

#### 3. Clone and Install

```bash
git clone https://github.com/noire02qwq/timeseries-frontend.git
cd timeseries-frontend
yarn install
```

#### 4. Development (Optional)

```bash
yarn dev
```

#### 5. Build Distributable Package

```bash
yarn build:mac
```

**Output** (`dist/` directory):

| File                            | Description          |
| ------------------------------- | -------------------- |
| `timeseries-frontend-1.0.0.dmg` | Disk image installer |
| `timeseries-frontend.app`       | Application bundle   |

> **Note**: For distribution outside the App Store, you need an Apple Developer account for code signing and notarization. For local testing, unsigned builds work fine on your own machine.

---

### 🐧 Linux

#### 1. Install Prerequisites

**Debian / Ubuntu:**

```bash
sudo apt update
sudo apt install -y git curl

# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
npm install -g yarn
```

**Fedora / CentOS / RHEL:**

```bash
sudo dnf install -y git curl

# Install Node.js via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install -y nodejs

# Install Yarn
npm install -g yarn
```

**Arch Linux:**

```bash
sudo pacman -S git nodejs yarn npm
```

#### 2. Verify Installation

```bash
git --version
node --version
yarn --version
```

#### 3. Clone and Install

```bash
git clone https://github.com/noire02qwq/timeseries-frontend.git
cd timeseries-frontend
yarn install
```

#### 4. Development (Optional)

```bash
yarn dev
```

#### 5. Build Distributable Package

```bash
yarn build:linux
```

**Output** (`dist/` directory):

| File                                  | Description                                              |
| ------------------------------------- | -------------------------------------------------------- |
| `timeseries-frontend-1.0.0.AppImage`  | Universal Linux format (run directly, no install needed) |
| `timeseries-frontend-1.0.0.snap`      | Snap package                                             |
| `timeseries-frontend-1.0.0_amd64.deb` | Debian/Ubuntu installer                                  |

**Running the AppImage:**

```bash
chmod +x dist/timeseries-frontend-1.0.0.AppImage
./dist/timeseries-frontend-1.0.0.AppImage
```

**Installing the .deb package:**

```bash
sudo dpkg -i dist/timeseries-frontend-1.0.0_amd64.deb
```

---

## ⚠️ Cross-Platform Build Notes

| Target Platform | Can Build On                                          |
| --------------- | ----------------------------------------------------- |
| Windows         | Windows, macOS (requires Wine), Linux (requires Wine) |
| macOS           | **macOS only**                                        |
| Linux           | Linux, macOS                                          |

> **Recommendation**: Build on the same OS as the target for best results. Use CI/CD (e.g., GitHub Actions) for multi-platform builds.

---

## 📁 Project Structure

```
src/
├── main/                    # Electron main process
├── preload/                 # Preload scripts (IPC bridge)
└── renderer/src/            # React frontend
    ├── components/
    │   ├── ui/              # shadcn base components (Button, Card, Tabs, etc.)
    │   ├── DataUpload.jsx       # CSV/XLSX upload + column config + split + confirm
    │   ├── TimeSeriesChart.jsx  # Single-column visualization + confirm
    │   ├── ModelConfig.jsx      # ML/DL model selection + params + tabular filter
    │   ├── TrainingMonitor.jsx  # Progress bars + show button + trial dropdown
    │   ├── ResultsDashboard.jsx # Run test + metrics + scatter + save
    │   └── PredictionPage.jsx   # External data prediction + model directory
    ├── lib/
    │   └── utils.js         # Utility functions (cn helper)
    ├── App.jsx              # Main app with Manual/Autotune + Sequential/Tabular toggles
    ├── main.jsx             # React entry point
    └── index.css            # Global styles + design tokens
```

## 🔧 Development Commands

```bash
# Run development server with hot reload
yarn dev

# Build production bundle (no packaging)
yarn build

# Lint code
yarn lint

# Format code
yarn format
```

## 🔨 Build Configuration

Packaging is configured in `electron-builder.yml`. You can customize:

- `appId` — Application identifier
- `productName` — Display name
- `nsis` — Windows installer options
- `dmg` — macOS disk image options
- `linux.target` — Linux package formats (AppImage, snap, deb)
- `asarUnpack` — Files to exclude from ASAR archive
- `publish` — Auto-update server configuration
- Code signing certificates (required for public distribution)

## 📝 License

MIT
