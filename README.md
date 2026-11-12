# 🏭 Workforce Central — IE 工業工程人力預測與排程規劃系統
### Enterprise Industrial Engineering Manpower Forecasting & Capacity Planning System

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Workforce Central** 是一套專為大型高科技製造業（SMT、PCA、系統組裝）打造的企業級工業工程（IE）人力預測、排程容量規劃與預算差異分析系統。
> 串聯 **年度授權預算（Yearly Budget）**、**APS 生產排程需求（APS Demand）** 與 **HR 計薪實體人力（HR Paid）**，提供從跨廠總部彙總（9 大廠區）到個別製程站點的即時分析與維護中心。

---

## 🌟 核心功能特色 (Key Features)

### 1. 📊 Executive Overview (高階決策總覽儀表板)
- **Top Summary KPI Cards**：以兩層式結構展示「年度授權預算」、「月度 APS 排程需求」、「HR 計薪人力」以及「預算達成率（Budget Hit Rate）」與「人力缺口（Net Manpower Gap）」。
- **Annual Manpower Trend (年度人力趨勢)**：12 個月複合圖表，即時比對預算基線、APS DL/IDL 需求與 HR 實發人力走勢。
- **Functional Analysis Trend & Detail (功能別差異分析矩陣)**：自動診斷預算超標（Budget Overrun）或工廠出勤落差，以顏色標記主要驅動因素（Primary Driver）。
- **Plant Summary Matrix (全球 9 大廠區總表)**：全球 SMT/CPU 排程產能、預算、APS 需求與計薪人力跨廠綜合比對。

### 2. ⚙️ APS Demand Engine (APS 排程容量聯動運算)
- **SMT 製程動態推算**：依據每月 SMT 產量與每日開線標準，自動計算所需直接人力（DL）。
- **PCA 製程連貫性耦合**：PCA 產量與 SMT 連動，精確對齊 FA、Test、Packing 各站點與班別配置。
- **CPU & Rack 系統組裝線**：支援多產線獨立維護組裝、測試、包裝人力標準與班次（1S ~ 4S）。

### 3. 👥 HR Cost Center & Payroll Sync (HR 計薪與部門比對)
- 即時串接 HR 系統各部門／成本中心（Cost Center）出勤計薪人數。
- 自動化差異分析（Variance Analysis），標記人力盈餘（Surplus）或招募補足需求（Deficit）。

### 4. 🛠️ IE Standard Baseline Maintenance (IE 工時標準維護)
- 五大功能模組完整維護：
  1. **MANUFACTURING (製造處)**：SMT、PCA、CPU Assy、Rack Assy
  2. **QUALITY CONTROL (品質處)**：PQC/SQC 製程檢驗、OQC 出貨檢驗
  3. **TROUBLE SHOOTING (技術處)**：維修技術員（Repair DL）、Debug 工程師（IDL）
  4. **WAREHOUSE LOGISTIC (倉儲物流處)**：倉管物流（DL）、物控管理（IDL）
  5. **OTHER SUPPORT (廠務處)**：廠務運維（DL）、行政支援（IDL）
- **歷年人力統計與月度展開 (Historical Trend)**：支援 2021 ~ 2026 歷年 DL/IDL 佔比與單一年份 1~12 月季節性特徵展開。

### 5. 📄 Offline Standalone HTML Export (獨立單一 HTML 離線匯出)
- 內建一鍵報表匯出功能，產出完全零外部相依、單一檔案（Single-file HTML），便於跨部門分享或離線簡報。

---

## 💻 科技技術棧 (Tech Stack)

| 領域 | 技術 / 工具 |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8 |
| **Build Tool** | Vite 6.2 |
| **Styling & Theme** | Tailwind CSS v4, Google Fonts (Inter, JetBrains Mono, Material Symbols) |
| **Data Visualization** | Recharts (ComposedChart, BarChart, ResponsiveContainer) |
| **State Management** | React Hooks, LocalStorage 持久化快取 |
| **Export Engine** | Python / Inlined HTML Single-File Generator |

---

## 🚀 快速上手 (Quick Start)

### 系統需求 (Prerequisites)
- [Node.js](https://nodejs.org/) (建議 LTS 18.x 或 20.x 以上)
- npm 或 pnpm 或 yarn

### 安裝步驟 (Installation)

```bash
# 1. 複製專案庫 (Clone the repository)
git clone https://github.com/your-username/workforce-central-ie-manpower.git

# 2. 進入專案資料夾 (Navigate into directory)
cd workforce-central-ie-manpower

# 3. 安裝依賴套件 (Install dependencies)
npm install

# 4. 啟動本機開發伺服器 (Start local dev server)
npm run dev
```

開啟瀏覽器前往 `http://localhost:3000` 即可檢視並試用！

### 建立生產環境部署包 (Build for Production)

```bash
# 編譯打包網頁應用
npm run build

# 預覽打包成品
npm run preview
```

產生的 `dist/` 資料夾支援部署於任何靜態網頁代管服務（GitHub Pages、Vercel、Netlify、Cloudflare Pages、AWS S3）。

---

## 🌐 部署至 GitHub Pages (Deploy to GitHub Pages)

本專案 `vite.config.ts` 已預設配置相對路徑 `base: './'`，並在 `public/` 內包含 `.nojekyll`，可無縫支援 GitHub Pages 子路徑部署：

1. 在 GitHub 儲存庫的 **Settings** > **Pages**。
2. **Build and deployment** 來源選擇 **GitHub Actions**。
3. 可建立標準 Vite 部署 workflow，或直接將 `dist/` 推送至 `gh-pages` 分支。

---

## 📂 專案目錄結構 (Project Structure)

```text
├── index.html                   # HTML 入口點（含 SEO、OpenGraph、JSON-LD）
├── vite.config.ts               # Vite 構建配置（含 Tailwind v4 與相對路徑）
├── metadata.json                # 應用程式元資料
├── package.json                 # 專案依賴與腳本
├── src/
│   ├── main.tsx                 # 應用程式掛載入口
│   ├── App.tsx                  # 核心頁面容器與全域狀態管理
│   ├── types.ts                 # 廠區、產線、人力與成本中心 TypeScript 型別定義
│   ├── components/              # 模組化介面元件
│   │   ├── Header.tsx           # 頂部導航列（廠區切換、年月選擇、通知）
│   │   ├── Sidebar.tsx          # 側邊選單列
│   │   ├── SummaryCards.tsx     # 核心 KPI 總覽卡片
│   │   ├── ExecutiveOverviewView.tsx # 高階主管總覽（年度趨勢、功能矩陣、廠區總表）
│   │   ├── ApsDemandView.tsx    # APS 生產排程需求計算引擎
│   │   ├── HrActualView.tsx     # HR 計薪實績與差異追蹤
│   │   ├── IEForecastView.tsx   # 工業工程標準與線體設定維護
│   │   ├── IEHistoricalManpowerOverview.tsx # 歷年 (2021~2026) 人力圖表與月度展開
│   │   ├── FiveDepartmentMonthlyMaintenance.tsx # 5 大部門月度基線維護中心
│   │   └── CostCenterMultiPicker.tsx # 成本中心多選器
│   └── utils/                   # 運算邏輯與常數
│       ├── apsSchedule.ts       # SMT / PCA / CPU 產量排程計算與 12 個月趨勢生成
│       ├── calculations.ts      # DL / IDL 標準工時與人力比率運算
│       └── monthlyDepartmentHelper.ts # 月度部門資料存取與初始化輔助
└── public/
    └── .nojekyll                # 支援 GitHub Pages 部署
```

---

## 🔒 隱私與資料安全 (Privacy & Local Storage)

- 本專案純前端運行，所有排程設定與維護資料預設儲存於瀏覽器的 **LocalStorage**（金鑰：`iec_manpower_sites_v5`）。
- 任何時候點擊介面中的 **Reset to Baseline Defaults**，即可一鍵重置回系統官方基準示範數據。

---

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 授權發布，歡迎自由使用、修改與交流。
