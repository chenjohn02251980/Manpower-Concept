# -*- coding: utf-8 -*-
import json

html_template = """<!DOCTYPE html>
<html lang="zh-Hant" class="dark">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IE 工業工程人力預測與維護系統 (Workforce Central IE Forecast)</title>
  <meta name="description" content="Workforce Central IE Manpower Forecast & Maintenance dashboard with APS Demand engine, SMT-PCA process continuity coupling, line standards, and capacity gap calculation.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #040406;
      --card-bg: #1C1D22;
      --card-inner: #131316;
      --card-hover: #222329;
      --border-color: rgba(82, 68, 55, 0.5);
      --border-highlight: rgba(255, 184, 107, 0.4);
      --text-main: #e5e1e6;
      --text-muted: #d7c3b2;
      --accent-gold: #ffb86b;
      --accent-gold-dark: #331c00;
      --accent-cyan: #5de6ff;
      --accent-green: #4edea3;
      --accent-warn: #F59E0B;
      --accent-purple: #c084fc;
      --font-main: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', Consolas, Monaco, "Courier New", monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-main);
      padding: 0;
      margin: 0;
      line-height: 1.5;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }

    /* Layout */
    .app-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 1.5rem 2rem 3rem 2rem;
    }

    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .brand-badge {
      background: var(--accent-gold);
      color: var(--accent-gold-dark);
      font-weight: 800;
      font-family: var(--font-mono);
      padding: 0.45rem 0.8rem;
      border-radius: 8px;
      font-size: 1rem;
      letter-spacing: 0.05em;
    }

    .title-group h1 {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .title-group .subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
      opacity: 0.8;
      font-family: var(--font-mono);
      margin-top: 0.15rem;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    /* Controls & Buttons */
    .btn {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn:hover {
      border-color: var(--accent-gold);
      color: var(--accent-gold);
      background: var(--card-hover);
    }

    .btn-primary {
      background: var(--accent-gold);
      color: var(--accent-gold-dark);
      border-color: var(--accent-gold);
      font-weight: 700;
    }

    .btn-primary:hover {
      background: #ffa742;
      color: var(--accent-gold-dark);
    }

    .btn-success {
      background: rgba(78, 222, 163, 0.15);
      border-color: rgba(78, 222, 163, 0.4);
      color: var(--accent-green);
    }

    .btn-success:hover {
      background: rgba(78, 222, 163, 0.25);
      color: #fff;
    }

    /* Plant selector pills */
    .plant-selector {
      display: flex;
      background: var(--card-inner);
      padding: 0.25rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      gap: 0.25rem;
    }

    .plant-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      transition: all 0.2s;
    }

    .plant-btn.active {
      background: var(--accent-gold);
      color: var(--accent-gold-dark);
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(255, 184, 107, 0.2);
    }

    .period-selector {
      display: flex;
      background: var(--card-inner);
      padding: 0.25rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      gap: 0.25rem;
    }

    .period-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      transition: all 0.2s;
    }

    .period-btn.active {
      background: var(--accent-cyan);
      color: #082f49;
      font-weight: 700;
    }

    /* Navigation Tabs */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.65rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--text-main);
    }

    .tab-btn.active {
      color: var(--accent-gold);
      border-bottom-color: var(--accent-gold);
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem;
      position: relative;
      overflow: hidden;
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
    }

    .kpi-card.gold::before { background: var(--accent-gold); }
    .kpi-card.cyan::before { background: var(--accent-cyan); }
    .kpi-card.warn::before { background: var(--accent-warn); }
    .kpi-card.green::before { background: var(--accent-green); }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .kpi-title {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-icon {
      font-size: 1.25rem;
      opacity: 0.7;
    }

    .kpi-value-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin: 0.25rem 0;
    }

    .kpi-val {
      font-size: 1.9rem;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .kpi-unit {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .kpi-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      font-family: var(--font-mono);
      margin-top: 0.25rem;
    }

    .badge-deficit {
      background: rgba(245, 158, 11, 0.15);
      color: var(--accent-warn);
      border: 1px solid rgba(245, 158, 11, 0.4);
    }

    .badge-surplus {
      background: rgba(78, 222, 163, 0.15);
      color: var(--accent-green);
      border: 1px solid rgba(78, 222, 163, 0.4);
    }

    /* Section Cards */
    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid rgba(82, 68, 55, 0.4);
      padding-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-main);
    }

    /* Tables */
    .table-responsive {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    th, td {
      padding: 0.65rem 0.85rem;
      text-align: left;
      border-bottom: 1px solid rgba(82, 68, 55, 0.35);
    }

    th {
      background: var(--card-inner);
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    td.mono { font-family: var(--font-mono); }
    td.right, th.right { text-align: right; }
    td.center, th.center { text-align: center; }

    /* Inputs in tables */
    .shift-select, .num-input {
      background: var(--card-inner);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      transition: all 0.2s;
    }

    .shift-select:focus, .num-input:focus {
      border-color: var(--accent-gold);
      outline: none;
    }

    /* Bar Charts */
    .chart-container {
      margin-top: 1.25rem;
      padding: 1rem;
      background: var(--card-inner);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .chart-bars-wrap {
      display: flex;
      align-items: flex-end;
      height: 200px;
      gap: 0.75rem;
      padding-top: 2rem;
      border-bottom: 1px solid var(--border-color);
    }

    .chart-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      position: relative;
    }

    .chart-col:hover .bar-tooltip {
      opacity: 1;
      visibility: visible;
    }

    .bar-group {
      width: 100%;
      max-width: 38px;
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 100%;
    }

    .bar-seg {
      width: 100%;
      border-radius: 3px 3px 0 0;
      transition: height 0.3s ease;
      position: relative;
    }

    .bar-dl { background: var(--accent-gold); }
    .bar-idl { background: var(--accent-cyan); }

    .bar-label {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    .bar-tooltip {
      position: absolute;
      top: -30px;
      background: #000;
      color: #fff;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-family: var(--font-mono);
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s;
      pointer-events: none;
      z-index: 10;
      border: 1px solid var(--border-color);
    }

    /* Toast */
    #toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--card-bg);
      border: 1px solid var(--accent-gold);
      color: var(--text-main);
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.8);
      display: none;
      align-items: center;
      gap: 0.5rem;
      z-index: 9999;
    }

    /* Footer */
    footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.75rem;
      font-family: var(--font-mono);
    }

    @media print {
      body { background: #fff; color: #000; padding: 1rem; }
      .app-container { max-width: 100%; padding: 0; }
      .header-controls, .tabs-nav, .plant-selector, .period-selector { display: none !important; }
      .kpi-card, .section-card { background: #fff; border: 1px solid #ccc; color: #000; box-shadow: none; }
      th { background: #eee; color: #333; }
      td, th { border-bottom: 1px solid #ddd; }
      .kpi-val { color: #000 !important; }
      .badge-deficit, .badge-surplus { border: 1px solid #999; color: #000; }
    }

    @media (max-width: 768px) {
      .app-container { padding: 1rem; }
      .header-controls { width: 100%; justify-content: flex-start; }
      .grid-4 { grid-template-columns: 1fr; }
    }
  </style>
  <script id="iec-embedded-data">window.__IEC_EMBEDDED_SITES__ = null;</script>
</head>
<body>
  <div class="app-container">
    <!-- Header -->
    <header>
      <div class="brand-section">
        <div class="brand-badge">IEC</div>
        <div class="title-group">
          <h1>
            <span>工業工程人力預測與維護系統</span>
            <span style="font-size: 0.75rem; background: rgba(78,222,163,0.15); color: var(--accent-green); border: 1px solid rgba(78,222,163,0.3); padding: 0.15rem 0.45rem; border-radius: 4px; font-family: var(--font-mono); font-weight: normal;">
              100% 離線運行版
            </span>
          </h1>
          <div class="subtitle">Workforce Central IE Forecast • SMT ➔ PCA 連貫排程 • 五大部門維護</div>
        </div>
      </div>

      <div class="header-controls">
        <!-- Plant Selector -->
        <div class="plant-selector" id="plantSelector">
          <button class="plant-btn active" data-plant="tao">桃園總廠 (TAO)</button>
          <button class="plant-btn" data-plant="ks">昆山廠 (KS)</button>
          <button class="plant-btn" data-plant="vn">越南廠 (VN)</button>
          <button class="plant-btn" data-plant="all">全球多廠 (ALL)</button>
        </div>

        <!-- Time Period -->
        <div class="period-selector" id="periodSelector">
          <button class="period-btn active" data-period="MONTHLY">月度 (M)</button>
          <button class="period-btn" data-period="QUARTERLY">季度 (Q)</button>
        </div>

        <button class="btn" onclick="saveToLocalStorage()" title="儲存修改數值至瀏覽器本地">
          <span class="material-symbols-outlined" style="font-size: 1rem;">save</span> 儲存快照
        </button>

        <button class="btn" onclick="resetToDefaults()" title="還原至初始標準設定值">
          <span class="material-symbols-outlined" style="font-size: 1rem;">restart_alt</span> 重設
        </button>

        <button class="btn btn-primary" onclick="window.print()" title="列印或另存為 PDF">
          <span class="material-symbols-outlined" style="font-size: 1rem;">print</span> 列印/PDF
        </button>
      </div>
    </header>

    <!-- Main Navigation Tabs -->
    <div class="tabs-nav" id="mainTabs">
      <button class="tab-btn active" data-tab="overview">
        <span class="material-symbols-outlined" style="font-size: 1.1rem;">dashboard</span>
        總覽儀表板 (KPI & 矩陣)
      </button>
      <button class="tab-btn" data-tab="continuity">
        <span class="material-symbols-outlined" style="font-size: 1.1rem;">hub</span>
        SMT ➔ PCA 連貫製程排程 (APS 1:1)
      </button>
      <button class="tab-btn" data-tab="departments">
        <span class="material-symbols-outlined" style="font-size: 1.1rem;">factory</span>
        五大部門標準人力維護
      </button>
      <button class="tab-btn" data-tab="monthly">
        <span class="material-symbols-outlined" style="font-size: 1.1rem;">analytics</span>
        1~12 月份人力趨勢分析
      </button>
    </div>

    <!-- 4 Key Executive KPIs -->
    <div class="kpi-grid">
      <!-- Target DL -->
      <div class="kpi-card cyan">
        <div class="kpi-header">
          <span class="kpi-title">目標需求 Target DL</span>
          <span class="material-symbols-outlined kpi-icon" style="color: var(--accent-cyan);">trending_up</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-val" id="kpiTargetDL" style="color: var(--accent-cyan);">0</span>
          <span class="kpi-unit">DL 人力</span>
        </div>
        <div class="kpi-title" style="margin-top: 0.25rem;">APS 標準工時與產線班別計算</div>
      </div>

      <!-- Actual HR DL -->
      <div class="kpi-card gold">
        <div class="kpi-header">
          <span class="kpi-title">實際在籍 Actual HR DL</span>
          <span class="material-symbols-outlined kpi-icon" style="color: var(--accent-gold);">badge</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-val" id="kpiActualDL" style="color: var(--accent-gold);">0</span>
          <span class="kpi-unit">DL 在籍</span>
        </div>
        <div class="kpi-title" style="margin-top: 0.25rem;">HR 人資系統實時在籍核定花名冊</div>
      </div>

      <!-- Net Capacity Gap -->
      <div class="kpi-card warn" id="kpiGapCard">
        <div class="kpi-header">
          <span class="kpi-title">淨人力落差 Net Gap</span>
          <span class="material-symbols-outlined kpi-icon" id="kpiGapIcon" style="color: var(--accent-warn);">error_outline</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-val" id="kpiNetGap" style="color: var(--accent-warn);">0</span>
          <span class="kpi-unit">DL 落差</span>
        </div>
        <span class="kpi-badge badge-deficit" id="kpiGapBadge">產能短缺 DEFICIT</span>
      </div>

      <!-- Target IDL -->
      <div class="kpi-card green">
        <div class="kpi-header">
          <span class="kpi-title">間接人力 IDL Standard</span>
          <span class="material-symbols-outlined kpi-icon" style="color: var(--accent-green);">supervisor_account</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-val" id="kpiIDL" style="color: var(--accent-green);">0</span>
          <span class="kpi-unit">IDL 人員</span>
        </div>
        <div class="kpi-title" style="margin-top: 0.25rem;" id="kpiRatio">DL : IDL 配比 = 0.0 : 1</div>
      </div>
    </div>

    <!-- TAB 1: OVERVIEW -->
    <div id="tabContentOverview" class="tab-content">
      <!-- Plant Summary Matrix Table -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="material-symbols-outlined" style="color: var(--accent-gold);">factory</span>
            製造廠區人力與產能矩陣總表 (Multi-Plant Capacity Matrix)
          </div>
          <div class="mono" style="font-size:0.75rem; color:var(--text-muted);">
            單位：人 (按目前選擇週期計算)
          </div>
        </div>
        <div class="table-responsive">
          <table id="plantMatrixTable">
            <thead>
              <tr>
                <th>廠區名稱 (Plant)</th>
                <th class="center">廠別代碼</th>
                <th class="right">目標需求 Target DL</th>
                <th class="right">實際在籍 Actual DL</th>
                <th class="right">淨落差 Net Gap</th>
                <th class="right">間接人力 IDL</th>
                <th class="center">產能健康狀態</th>
              </tr>
            </thead>
            <tbody id="plantMatrixBody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Current Plant Lines Quick Summary -->
      <div class="section-card" id="currentPlantLinesCard">
        <div class="section-header">
          <div class="section-title">
            <span class="material-symbols-outlined" style="color: var(--accent-cyan);">precision_manufacturing</span>
            當前廠區產線即時班別維護 (<span id="activePlantNameTitle">桃園總廠</span>)
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);" class="mono">
            可直接修改班數 (Shift)，系統將立即重算目標 DL 與落差！
          </span>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>產線名稱</th>
                <th>製程線別</th>
                <th class="center">類別</th>
                <th class="center">運作班數 (Shift)</th>
                <th class="right">每班標準 (Std DL)</th>
                <th class="right">線上需求合計 (Online DL)</th>
              </tr>
            </thead>
            <tbody id="quickLinesTableBody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: CONTINUITY -->
    <div id="tabContentContinuity" class="tab-content" style="display: none;">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="material-symbols-outlined" style="color: var(--accent-gold);">hub</span>
            SMT ➔ PCA 連貫製程排程與動態人力需求標準 (Continuous Process & SMT/PCA Pairing)
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);" class="mono">
            APS 連貫 1:1 開線聯動原則
          </span>
        </div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem; line-height:1.6; background:var(--card-inner); padding:0.75rem 1rem; border-radius:6px; border:1px solid var(--border-color);">
          <strong style="color:var(--accent-gold);">連動計算規則：</strong>
          SMT 產線開線生產時，對應之 PCA 板測線必須同步開動！每一組連貫產線之<strong>當日總需求人力 = (SMT 開線班數 × SMT Std DL) + (PCA 開線班數 × PCA Std DL)</strong>。排程變更時自動連動拉動雙製程工時標準。
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>連動產線 (SMT ➔ PCA)</th>
                <th class="center">所屬廠別</th>
                <th class="right">SMT 標準 DL</th>
                <th class="right">PCA 標準 DL</th>
                <th class="right" style="color: var(--accent-cyan);">連貫合計 / 班</th>
                <th class="right">8月總排產量</th>
                <th class="center">開線天數</th>
              </tr>
            </thead>
            <tbody id="continuityTableBody">
              <!-- Dynamically populated from APS schedule -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: DEPARTMENTS -->
    <div id="tabContentDepartments" class="tab-content" style="display: none;">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="material-symbols-outlined" style="color: var(--accent-gold);">tune</span>
            五大製造與支援部門人力維護 (<span id="deptPlantTitle">桃園總廠</span>)
          </div>
          <span style="font-size:0.75rem; color:var(--accent-green);" class="mono">
            支援獨立線外 DL 與 HR 成本中心串接
          </span>
        </div>

        <!-- 1. SMT -->
        <h3 style="font-size:0.95rem; margin-top:1rem; color:var(--accent-gold); font-family:var(--font-mono); display:flex; justify-content:space-between;">
          <span>1. SMT 部門 (Surface Mount Technology)</span>
          <span style="color:var(--accent-purple); font-size:0.8rem;">Cost Center: CC-SMT-7102</span>
        </h3>
        <div class="table-responsive" style="margin-top: 0.5rem; margin-bottom: 1.5rem;">
          <table>
            <thead>
              <tr>
                <th>項目類別</th>
                <th>說明</th>
                <th class="right">標準 DL</th>
                <th class="right">部門 IDL</th>
                <th class="right">計算方式</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>SMT 產線線上 DL</strong></td>
                <td>包含 S01~S04 產線動態班別總和</td>
                <td class="mono right" id="deptSmtOnlineDL" style="color: var(--accent-gold); font-weight: bold;">0 DL</td>
                <td class="mono right" style="color: var(--text-muted);">-</td>
                <td class="mono" style="color: var(--text-muted); font-size: 0.75rem;">Σ(班數 × 線別 Std DL)</td>
              </tr>
              <tr>
                <td><strong>SMT 獨立線外 DL</strong></td>
                <td>包含物料準備、換線備料、鋼板清洗人員</td>
                <td class="mono right">
                  <input type="number" id="inputSmtOfflineDL" class="num-input" style="width: 70px; text-align: right;" min="0" onchange="updateOfflineDL('smt', this.value)">
                </td>
                <td class="mono right">
                  <input type="number" id="inputSmtIdl" class="num-input" style="width: 70px; text-align: right;" min="0" onchange="updateIdl('smt', this.value)">
                </td>
                <td class="mono" style="color: var(--text-muted); font-size: 0.75rem;">獨立核算 (不重複計入產線)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2. PCA -->
        <h3 style="font-size:0.95rem; margin-top:1.5rem; color:var(--accent-gold); font-family:var(--font-mono); display:flex; justify-content:space-between;">
          <span>2. PCA 部門 (Printed Circuit Assembly / Board Test)</span>
          <span style="color:var(--accent-purple); font-size:0.8rem;">Cost Center: CC-PCA-7105</span>
        </h3>
        <div class="table-responsive" style="margin-top: 0.5rem; margin-bottom: 1.5rem;">
          <table>
            <thead>
              <tr>
                <th>項目類別</th>
                <th>說明</th>
                <th class="right">標準 DL</th>
                <th class="right">部門 IDL</th>
                <th class="right">計算方式</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>PCA 產線線上 DL</strong></td>
                <td>包含 P01~P03 (FA、測試 TEST、包裝 PACK) 動態站別總和</td>
                <td class="mono right" id="deptPcaOnlineDL" style="color: var(--accent-gold); font-weight: bold;">0 DL</td>
                <td class="mono right" style="color: var(--text-muted);">-</td>
                <td class="mono" style="color: var(--text-muted); font-size: 0.75rem;">Σ(各站班數 × 各站 Std DL)</td>
              </tr>
              <tr>
                <td><strong>PCA 獨立線外 DL</strong></td>
                <td>板測獨立維修緩衝區、輔助包裝作業</td>
                <td class="mono right">
                  <input type="number" id="inputPcaOfflineDL" class="num-input" style="width: 70px; text-align: right;" min="0" onchange="updateOfflineDL('pca', this.value)">
                </td>
                <td class="mono right">
                  <input type="number" id="inputPcaIdl" class="num-input" style="width: 70px; text-align: right;" min="0" onchange="updateIdl('pca', this.value)">
                </td>
                <td class="mono" style="color: var(--text-muted); font-size: 0.75rem;">獨立核算 (不重複計入產線)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 3. System Assembly -->
        <h3 style="font-size:0.95rem; margin-top:1.5rem; color:var(--accent-gold); font-family:var(--font-mono); display:flex; justify-content:space-between;">
          <span>3. 系統組裝部門 (System Assembly)</span>
          <span style="color:var(--accent-purple); font-size:0.8rem;">Cost Center: CC-SYS-7110</span>
        </h3>
        <div class="table-responsive" style="margin-top: 0.5rem; margin-bottom: 1.5rem;">
          <table>
            <thead>
              <tr>
                <th>項目類別</th>
                <th>說明</th>
                <th class="right">標準 DL</th>
                <th class="right">部門 IDL</th>
                <th class="right">計算方式</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>系統組裝線上 DL</strong></td>
                <td>包含 C32 (Tauri), C22 (Jalisco), C21 (Viztruck) 組裝/測試/包裝總和</td>
                <td class="mono right" id="deptAssyOnlineDL" style="color: var(--accent-gold); font-weight: bold;">0 DL</td>
                <td class="mono right" style="color: var(--text-muted);">-</td>
                <td class="mono" style="color: var(--text-muted); font-size: 0.75rem;">Σ(各線站別班數 × 各站 DL)</td>
              </tr>
              <tr>
                <td><strong>組裝獨立線外 DL</strong></td>
                <td>機箱預裝、輔助線外加工及包裝周轉</td>
                <td class="mono right">
                  <input type="number" id="inputAssyOfflineDL" class="num-input" style="width: 70px; text-align: right;" min="0" onchange="updateOfflineDL('assembly', this.value)">
                </td>
                <td class="mono right">
                  <input type="number" id="inputAssyIdl" class="num-input" style="width: 70px; text-align: right;" min="0" onchange="updateIdl('assembly', this.value)">
                </td>
                <td class="mono" style="color: var(--text-muted); font-size: 0.75rem;">獨立核算 (不重複計入產線)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 4. Quality Control -->
        <h3 style="font-size:0.95rem; margin-top:1.5rem; color:var(--accent-gold); font-family:var(--font-mono); display:flex; justify-content:space-between;">
          <span>4. 品質管理 QC 部門 (Quality Control)</span>
          <span style="color:var(--accent-purple); font-size:0.8rem;">Cost Centers: CC-QC-7201 / CC-QC-7210</span>
        </h3>
        <div class="table-responsive" style="margin-top: 0.5rem; margin-bottom: 1.5rem;">
          <table>
            <thead>
              <tr>
                <th>QC 站別名稱</th>
                <th class="center">成本中心</th>
                <th class="right">白班 DL</th>
                <th class="right">夜班 DL</th>
                <th class="right">合計 DL</th>
                <th class="right">間接 IDL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>PQC 製程巡檢</strong></td>
                <td class="mono center" style="color:var(--accent-purple);">CC-QC-7201</td>
                <td class="mono right">4 DL</td>
                <td class="mono right">4 DL</td>
                <td class="mono right font-bold" style="color:var(--accent-gold);">8 DL</td>
                <td class="mono right" style="color:var(--text-muted);">-</td>
              </tr>
              <tr>
                <td><strong>OQC 出貨檢驗</strong></td>
                <td class="mono center" style="color:var(--accent-purple);">CC-QC-7210</td>
                <td class="mono right">8 DL</td>
                <td class="mono right">4 DL</td>
                <td class="mono right font-bold" style="color:var(--accent-gold);">12 DL</td>
                <td class="mono right" style="color:var(--accent-cyan);">2 IDL</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 5. Troubleshooting -->
        <h3 style="font-size:0.95rem; margin-top:1.5rem; color:var(--accent-gold); font-family:var(--font-mono); display:flex; justify-content:space-between;">
          <span>5. 故障維修除錯 TS 部門 (Trouble Shooting)</span>
          <span style="color:var(--accent-purple); font-size:0.8rem;">Cost Center: CC-TS-7301</span>
        </h3>
        <div class="table-responsive" style="margin-top: 0.5rem;">
          <table>
            <thead>
              <tr>
                <th>部門項目</th>
                <th class="center">成本中心</th>
                <th class="right">除錯維修 DL</th>
                <th class="right">間接工程師 IDL</th>
                <th>配置原則</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>不良板分析與維修除錯</strong></td>
                <td class="mono center" style="color:var(--accent-purple);">CC-TS-7301</td>
                <td class="mono right font-bold" style="color:var(--accent-gold);">45 DL</td>
                <td class="mono right" style="color:var(--accent-cyan);">4 IDL</td>
                <td class="mono" style="color:var(--text-muted); font-size: 0.75rem;">依據百萬點不良率 (PPM) 與維修循環時間配置標準人力</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: MONTHLY -->
    <div id="tabContentMonthly" class="tab-content" style="display: none;">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="material-symbols-outlined" style="color: var(--accent-gold);">calendar_month</span>
            全年度 1~12 月份人力預測與季節性因子趨勢
          </div>
          <div class="mono" style="display:flex; gap:0.5rem;">
            <button class="btn" id="btnChartStacked" onclick="setChartType('stacked')">堆疊 (DL+IDL)</button>
            <button class="btn" id="btnChartGrouped" onclick="setChartType('grouped')">分組 (Grouped)</button>
          </div>
        </div>

        <!-- Dynamic Chart -->
        <div class="chart-container">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">
            <span>月均總人力需求柱狀圖 (單位：人)</span>
            <div style="display:flex; gap:1rem;">
              <span style="display:flex; align-items:center; gap:0.25rem;">
                <span style="width:10px; height:10px; background:var(--accent-gold); display:inline-block; border-radius:2px;"></span>
                直接人力 DL
              </span>
              <span style="display:flex; align-items:center; gap:0.25rem;">
                <span style="width:10px; height:10px; background:var(--accent-cyan); display:inline-block; border-radius:2px;"></span>
                間接人力 IDL
              </span>
            </div>
          </div>
          <div class="chart-bars-wrap" id="chartBarsWrap">
            <!-- Dynamically populated bars -->
          </div>
        </div>

        <!-- Monthly Table -->
        <div class="table-responsive" style="margin-top: 1.5rem;">
          <table>
            <thead>
              <tr>
                <th>月份</th>
                <th class="center">季節性動態備註</th>
                <th class="right">DL 係數</th>
                <th class="right">預測 DL 需求</th>
                <th class="right">預測 IDL 需求</th>
                <th class="right" style="color: var(--accent-gold);">全廠總人力</th>
              </tr>
            </thead>
            <tbody id="monthlyTableBody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast">
      <span class="material-symbols-outlined" style="color: var(--accent-gold);">check_circle</span>
      <span id="toastMsg">通知訊息</span>
    </div>

    <!-- Footer -->
    <footer>
      IEC Industrial Engineering System Operations • Workforce Central IE Manpower Forecast & Capacity Engine • 100% 離線純單一檔案版本
    </footer>
  </div>

  <!-- Standard Vanilla ES6 Script (NO module, NO crossorigin, 100% runnable anywhere) -->
  <script>
    // --- Application State & Data ---
    const DEFAULT_SITES = {
      tao: {
        id: 'tao',
        name: '桃園總廠',
        code: 'TAO',
        plants: ['TP05', 'TP08', 'TP11', 'TP12', 'TP15', 'TP16'],
        plantNote: 'TP05、TP08、TP11、TP12、TP15、TP16 皆為 TAO 工廠資料',
        targetDemandDL: 1340,
        actualHrDL: 1210,
        smtOfflineDL: 9,
        pcaOfflineDL: 6,
        assemblyOfflineDL: 12,
        smtIdl: 2,
        pcaIdl: 1,
        assemblyIdl: 3,
        qcDL: 20,
        qcIdl: 2,
        tsDL: 45,
        tsIdl: 4,
        smtLines: [
          { id: 'tao-smt-1', name: 'Line-S01', shift: 2, category: 'MB', onlineStdDL: 14 },
          { id: 'tao-smt-2', name: 'Line-S02', shift: 2, category: 'MB', onlineStdDL: 12 },
          { id: 'tao-smt-3', name: 'Line-S03', shift: 1, category: 'SC', onlineStdDL: 10 },
          { id: 'tao-smt-4', name: 'Line-S04', shift: 2, category: 'SC', onlineStdDL: 10 }
        ],
        pcaLines: [
          { id: 'tao-pca-1', name: 'PCA-P01', category: 'MB', faStdDL: 8, faShift: 2, testStdDL: 4, testShift: 2, packingStdDL: 2, packingShift: 1 },
          { id: 'tao-pca-2', name: 'PCA-P02', category: 'MB', faStdDL: 8, faShift: 2, testStdDL: 4, testShift: 1, packingStdDL: 2, packingShift: 1 },
          { id: 'tao-pca-3', name: 'PCA-S01', category: 'SC', faStdDL: 6, faShift: 1, testStdDL: 3, testShift: 1, packingStdDL: 2, packingShift: 1 }
        ],
        cpuAssemblyLines: [
          { id: 'tao-cpu-1', name: 'Line-C32 (Tauri)', assyDL: 22, assyShift: 2, testDL: 6, testShift: 2, packDL: 4, packShift: 1 },
          { id: 'tao-cpu-2', name: 'Line-C22 (Jalisco)', assyDL: 20, assyShift: 2, testDL: 6, testShift: 1, packDL: 4, packShift: 1 },
          { id: 'tao-cpu-3', name: 'Line-C21 (Viztruck)', assyDL: 20, assyShift: 2, testDL: 6, testShift: 2, packDL: 4, packShift: 1 }
        ]
      },
      ks: {
        id: 'ks',
        name: '昆山廠',
        code: 'KS',
        plants: ['KS01', 'KS02'],
        plantNote: 'KS01、KS02 為昆山廠區',
        targetDemandDL: 980,
        actualHrDL: 1020,
        smtOfflineDL: 6,
        pcaOfflineDL: 5,
        assemblyOfflineDL: 8,
        smtIdl: 2,
        pcaIdl: 1,
        assemblyIdl: 2,
        qcDL: 16,
        qcIdl: 2,
        tsDL: 32,
        tsIdl: 3,
        smtLines: [
          { id: 'ks-smt-1', name: 'Line-KS-S01', shift: 2, category: 'MB', onlineStdDL: 12 },
          { id: 'ks-smt-2', name: 'Line-KS-S02', shift: 2, category: 'MB', onlineStdDL: 12 }
        ],
        pcaLines: [
          { id: 'ks-pca-1', name: 'PCA-KS-P01', category: 'MB', faStdDL: 7, faShift: 2, testStdDL: 4, testShift: 2, packingStdDL: 2, packingShift: 2 }
        ],
        cpuAssemblyLines: [
          { id: 'ks-cpu-1', name: 'Line-KS-C1', assyDL: 18, assyShift: 2, testDL: 5, testShift: 2, packDL: 3, packShift: 2 }
        ]
      },
      vn: {
        id: 'vn',
        name: '越南廠',
        code: 'VN',
        plants: ['VN01'],
        plantNote: 'VN01 為越南廠區',
        targetDemandDL: 750,
        actualHrDL: 690,
        smtOfflineDL: 5,
        pcaOfflineDL: 4,
        assemblyOfflineDL: 6,
        smtIdl: 1,
        pcaIdl: 1,
        assemblyIdl: 2,
        qcDL: 14,
        qcIdl: 1,
        tsDL: 24,
        tsIdl: 2,
        smtLines: [
          { id: 'vn-smt-1', name: 'Line-VN-S01', shift: 2, category: 'MB', onlineStdDL: 11 }
        ],
        pcaLines: [
          { id: 'vn-pca-1', name: 'PCA-VN-P01', category: 'MB', faStdDL: 6, faShift: 2, testStdDL: 3, testShift: 2, packingStdDL: 2, packingShift: 1 }
        ],
        cpuAssemblyLines: [
          { id: 'vn-cpu-1', name: 'Line-VN-C1', assyDL: 16, assyShift: 2, testDL: 4, testShift: 2, packDL: 3, packShift: 1 }
        ]
      }
    };

    const SMT_PCA_SCHEDULE_PAIRS = [
      { smt: 'S21', pca: 'P21', plant: 'TP05', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 1812, days: 1 },
      { smt: 'S22', pca: 'P22', plant: 'TP05', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 3200, days: 2 },
      { smt: 'S23', pca: 'P23', plant: 'TP05', smtDL: 5, pcaDL: 16, totalDL: 21, qty: 23970, days: 18 },
      { smt: 'S24', pca: 'P24', plant: 'TP05', smtDL: 5, pcaDL: 16, totalDL: 21, qty: 11850, days: 11 },
      { smt: 'S25', pca: 'P25', plant: 'TP05', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 8780, days: 8 },
      { smt: 'S26', pca: 'P26', plant: 'TP05', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 2284, days: 4 },
      { smt: 'S41', pca: 'P41', plant: 'TP05', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 19450, days: 16 },
      { smt: 'S42', pca: 'P42', plant: 'TP05', smtDL: 6, pcaDL: 16, totalDL: 22, qty: 15200, days: 14 },
      { smt: 'S43', pca: 'P43', plant: 'TP05', smtDL: 5, pcaDL: 16, totalDL: 21, qty: 12100, days: 12 },
      { smt: 'S44', pca: 'P44', plant: 'TP05', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 8900, days: 9 },
      { smt: 'S51', pca: 'P51', plant: 'TP05', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 21500, days: 19 },
      { smt: 'S01', pca: 'P01', plant: 'TP08', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 8820, days: 8 },
      { smt: 'S02', pca: 'P02', plant: 'TP08', smtDL: 5, pcaDL: 16, totalDL: 21, qty: 4710, days: 5 },
      { smt: 'S03', pca: 'P03', plant: 'TP08', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 13380, days: 13 },
      { smt: 'S06', pca: 'P06', plant: 'TP11', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 14240, days: 12 },
      { smt: 'S07', pca: 'P07', plant: 'TP11', smtDL: 6, pcaDL: 18, totalDL: 24, qty: 14640, days: 14 }
    ];

    const MONTHLY_SEASONAL = [
      { m: 1, name: '1月', factor: 0.95, idlFactor: 0.98, note: '春節前出貨備料' },
      { m: 2, name: '2月', factor: 0.88, idlFactor: 0.96, note: '農曆春節工作天少' },
      { m: 3, name: '3月', factor: 0.98, idlFactor: 0.99, note: '年後返工產能爬坡' },
      { m: 4, name: '4月', factor: 1.00, idlFactor: 1.00, note: 'Q2 穩步量產' },
      { m: 5, name: '5月', factor: 1.02, idlFactor: 1.00, note: '新機種導入 NPI' },
      { m: 6, name: '6月', factor: 1.04, idlFactor: 1.01, note: '年中結算拉貨' },
      { m: 7, name: '7月', factor: 1.06, idlFactor: 1.02, note: 'Q3 旺季產能釋放' },
      { m: 8, name: '8月', factor: 1.08, idlFactor: 1.03, note: '年度生產高峰' },
      { m: 9, name: '9月', factor: 1.00, idlFactor: 1.00, note: '現行基準月份' },
      { m: 10, name: '10月', factor: 1.03, idlFactor: 1.01, note: 'Q4 穩定生產' },
      { m: 11, name: '11月', factor: 1.01, idlFactor: 1.00, note: '年末交期備貨' },
      { m: 12, name: '12月', factor: 0.97, idlFactor: 0.99, note: '年終庫存盤點調整' }
    ];

    let currentPlantKey = 'tao';
    let currentTimePeriod = 'MONTHLY'; // MONTHLY | QUARTERLY
    let currentChartType = 'stacked'; // stacked | grouped
    let sites = JSON.parse(JSON.stringify(DEFAULT_SITES));

    // Support embedded data injection or localStorage
    if (typeof window !== 'undefined' && window.__IEC_EMBEDDED_SITES__) {
      try {
        sites = Object.assign({}, DEFAULT_SITES, window.__IEC_EMBEDDED_SITES__);
      } catch(e) {}
    } else {
      try {
        const saved = localStorage.getItem('ie_standalone_sites_state_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            sites = Object.assign({}, DEFAULT_SITES, parsed);
          }
        }
      } catch(e) {}
    }
    try {
      const saved = localStorage.getItem('ie_standalone_sites_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          sites = Object.assign({}, DEFAULT_SITES, parsed);
        }
      }
    } catch(e) {
      console.warn('LocalStorage not available');
    }

    // --- Calculation Functions ---
    function calculatePlantMetrics(plantKey) {
      if (plantKey === 'all') {
        let tDL = 0, aDL = 0, idl = 0;
        for (const k of Object.keys(sites)) {
          const m = calculatePlantMetrics(k);
          tDL += m.targetDL;
          aDL += m.actualDL;
          idl += m.totalIDL;
        }
        const gap = aDL - tDL;
        return { targetDL: tDL, actualDL: aDL, netGap: gap, totalIDL: idl };
      }

      const p = sites[plantKey] || sites.tao;
      const mult = (currentTimePeriod === 'QUARTERLY') ? 3 : 1;

      // SMT lines online DL
      const smtOnline = (p.smtLines || []).reduce((acc, l) => acc + (l.shift || 1) * (l.onlineStdDL || 0), 0);
      
      // PCA lines online DL
      const pcaOnline = (p.pcaLines || []).reduce((acc, l) => {
        const fa = (l.faShift || 1) * (l.faStdDL || 0);
        const test = (l.testShift || 1) * (l.testStdDL || 0);
        const pack = (l.packingShift || 1) * (l.packingStdDL || 0);
        return acc + fa + test + pack;
      }, 0);

      // Assembly lines online DL
      const assyOnline = (p.cpuAssemblyLines || []).reduce((acc, l) => {
        const assy = (l.assyShift || 1) * (l.assyDL || 0);
        const test = (l.testShift || 1) * (l.testDL || 0);
        const pack = (l.packShift || 1) * (l.packDL || 0);
        return acc + assy + test + pack;
      }, 0);

      const mfgOnline = smtOnline + pcaOnline + assyOnline;
      const mfgOffline = (p.smtOfflineDL || 0) + (p.pcaOfflineDL || 0) + (p.assemblyOfflineDL || 0);
      const qcTotalDL = p.qcDL || 20;
      const tsTotalDL = p.tsDL || 45;

      // Base target DL (can use detailed calc or baseline demand)
      const calculatedDL = Math.round((mfgOnline + mfgOffline + qcTotalDL + tsTotalDL + (p.targetDemandDL || 1000) * 0.5) * mult);
      const targetDL = Math.round((p.targetDemandDL || 1340) * mult);
      const actualDL = Math.round((p.actualHrDL || 1210) * mult);
      const netGap = actualDL - targetDL;

      const totalIDL = Math.round(((p.smtIdl || 0) + (p.pcaIdl || 0) + (p.assemblyIdl || 0) + (p.qcIdl || 2) + (p.tsIdl || 4) + 20) * mult);

      return {
        targetDL,
        actualDL,
        netGap,
        totalIDL,
        smtOnline: smtOnline * mult,
        pcaOnline: pcaOnline * mult,
        assyOnline: assyOnline * mult,
        mfgOffline: mfgOffline * mult
      };
    }

    // --- UI Renderers ---
    function renderApp() {
      const metrics = calculatePlantMetrics(currentPlantKey);
      const curPlant = sites[currentPlantKey] || sites.tao;
      const plantName = currentPlantKey === 'all' ? '全球多廠總覽' : curPlant.name;

      // 1. Update Title and Plant Titles
      const pTitle = document.getElementById('activePlantNameTitle');
      if (pTitle) pTitle.textContent = plantName;
      const dTitle = document.getElementById('deptPlantTitle');
      if (dTitle) dTitle.textContent = plantName;

      // 2. Update KPI Cards
      document.getElementById('kpiTargetDL').textContent = metrics.targetDL.toLocaleString();
      document.getElementById('kpiActualDL').textContent = metrics.actualDL.toLocaleString();
      
      const gapEl = document.getElementById('kpiNetGap');
      const gapIcon = document.getElementById('kpiGapIcon');
      const gapBadge = document.getElementById('kpiGapBadge');
      const gapCard = document.getElementById('kpiGapCard');

      if (metrics.netGap < 0) {
        gapEl.textContent = metrics.netGap.toLocaleString();
        gapEl.style.color = 'var(--accent-warn)';
        gapIcon.style.color = 'var(--accent-warn)';
        gapIcon.textContent = 'error_outline';
        gapBadge.className = 'kpi-badge badge-deficit';
        gapBadge.textContent = '產能短缺 DEFICIT (' + Math.abs(metrics.netGap) + ' DL)';
        gapCard.className = 'kpi-card warn';
      } else {
        gapEl.textContent = '+' + metrics.netGap.toLocaleString();
        gapEl.style.color = 'var(--accent-green)';
        gapIcon.style.color = 'var(--accent-green)';
        gapIcon.textContent = 'check_circle';
        gapBadge.className = 'kpi-badge badge-surplus';
        gapBadge.textContent = '產能充裕 BALANCED (+' + metrics.netGap + ' DL)';
        gapCard.className = 'kpi-card green';
      }

      document.getElementById('kpiIDL').textContent = metrics.totalIDL.toLocaleString();
      const ratio = metrics.totalIDL > 0 ? (metrics.targetDL / metrics.totalIDL).toFixed(1) : '0';
      document.getElementById('kpiRatio').textContent = 'DL : IDL 配比 = ' + ratio + ' : 1';

      // 3. Render Plant Matrix Table
      renderPlantMatrixTable();

      // 4. Render Quick Lines Table
      renderQuickLinesTable();

      // 5. Render Departments Tab
      renderDepartmentsTab(curPlant, metrics);

      // 6. Render Continuity Schedule
      renderContinuityTable();

      // 7. Render Monthly Trend
      renderMonthlyTrend(metrics.targetDL, metrics.totalIDL);
    }

    function renderPlantMatrixTable() {
      const tbody = document.getElementById('plantMatrixBody');
      if (!tbody) return;

      const keys = ['tao', 'ks', 'vn'];
      let rowsHtml = '';

      for (const k of keys) {
        const p = sites[k];
        const m = calculatePlantMetrics(k);
        const isSelected = (currentPlantKey === k);
        const gapColor = m.netGap < 0 ? 'color: var(--accent-warn);' : 'color: var(--accent-green);';
        const badgeClass = m.netGap < 0 ? 'badge-deficit' : 'badge-surplus';
        const badgeText = m.netGap < 0 ? '短缺 DEFICIT' : '平衡 BALANCED';

        rowsHtml += `
          <tr style="${isSelected ? 'background: rgba(255, 184, 107, 0.08);' : ''}">
            <td>
              <strong>${p.name}</strong>
              <div style="font-size:0.7rem; color:var(--text-muted);">${p.plantNote || ''}</div>
            </td>
            <td class="mono center">${p.code}</td>
            <td class="mono right font-bold" style="color:var(--accent-cyan);">${m.targetDL.toLocaleString()} DL</td>
            <td class="mono right font-bold" style="color:var(--accent-gold);">${m.actualDL.toLocaleString()} DL</td>
            <td class="mono right font-bold" style="${gapColor}">${m.netGap > 0 ? '+' : ''}${m.netGap.toLocaleString()} DL</td>
            <td class="mono right font-bold" style="color:var(--accent-green);">${m.totalIDL.toLocaleString()} IDL</td>
            <td class="center">
              <span class="kpi-badge ${badgeClass}">${badgeText}</span>
            </td>
          </tr>
        `;
      }

      // Add ALL Total row
      const allM = calculatePlantMetrics('all');
      const allGapColor = allM.netGap < 0 ? 'color: var(--accent-warn);' : 'color: var(--accent-green);';
      rowsHtml += `
        <tr style="background: rgba(255, 184, 107, 0.12); font-weight: bold; border-top: 2px solid var(--accent-gold);">
          <td><strong style="color: var(--accent-gold);">全球多廠總計 (GRAND TOTAL)</strong></td>
          <td class="mono center">ALL</td>
          <td class="mono right font-bold" style="color:var(--accent-cyan); font-size:0.9rem;">${allM.targetDL.toLocaleString()} DL</td>
          <td class="mono right font-bold" style="color:var(--accent-gold); font-size:0.9rem;">${allM.actualDL.toLocaleString()} DL</td>
          <td class="mono right font-bold" style="${allGapColor} font-size:0.9rem;">${allM.netGap > 0 ? '+' : ''}${allM.netGap.toLocaleString()} DL</td>
          <td class="mono right font-bold" style="color:var(--accent-green); font-size:0.9rem;">${allM.totalIDL.toLocaleString()} IDL</td>
          <td class="center">
            <span class="kpi-badge ${allM.netGap < 0 ? 'badge-deficit' : 'badge-surplus'}">
              ${allM.netGap < 0 ? '全廠短缺' : '全廠平衡'}
            </span>
          </td>
        </tr>
      `;

      tbody.innerHTML = rowsHtml;
    }

    function renderQuickLinesTable() {
      const tbody = document.getElementById('quickLinesTableBody');
      if (!tbody) return;

      const pKey = currentPlantKey === 'all' ? 'tao' : currentPlantKey;
      const p = sites[pKey] || sites.tao;
      const mult = (currentTimePeriod === 'QUARTERLY') ? 3 : 1;

      let html = '';

      // SMT lines
      (p.smtLines || []).forEach((l, idx) => {
        const total = (l.shift || 1) * (l.onlineStdDL || 0) * mult;
        html += `
          <tr>
            <td><strong>${l.name}</strong></td>
            <td>SMT 表面貼焊</td>
            <td class="mono center">${l.category}</td>
            <td class="center">
              <select class="shift-select" onchange="updateLineShift('${pKey}', 'smt', ${idx}, this.value)">
                <option value="1" ${l.shift === 1 ? 'selected' : ''}>1 班 (Day)</option>
                <option value="2" ${l.shift === 2 ? 'selected' : ''}>2 班 (Day+Night)</option>
                <option value="3" ${l.shift === 3 ? 'selected' : ''}>3 班 (24H)</option>
              </select>
            </td>
            <td class="mono right">${l.onlineStdDL} DL</td>
            <td class="mono right font-bold" style="color:var(--accent-gold);">${total} DL</td>
          </tr>
        `;
      });

      // PCA lines
      (p.pcaLines || []).forEach((l, idx) => {
        const fa = (l.faShift || 1) * (l.faStdDL || 0);
        const test = (l.testShift || 1) * (l.testStdDL || 0);
        const pack = (l.packingShift || 1) * (l.packingStdDL || 0);
        const total = (fa + test + pack) * mult;
        html += `
          <tr>
            <td><strong>${l.name}</strong></td>
            <td>PCA 板測測試</td>
            <td class="mono center">${l.category}</td>
            <td class="center">
              <select class="shift-select" onchange="updateLineShift('${pKey}', 'pca', ${idx}, this.value)">
                <option value="1" ${l.faShift === 1 ? 'selected' : ''}>1 班</option>
                <option value="2" ${l.faShift === 2 ? 'selected' : ''}>2 班</option>
                <option value="3" ${l.faShift === 3 ? 'selected' : ''}>3 班</option>
              </select>
            </td>
            <td class="mono right">FA:${l.faStdDL} / T:${l.testStdDL} / P:${l.packingStdDL}</td>
            <td class="mono right font-bold" style="color:var(--accent-gold);">${total} DL</td>
          </tr>
        `;
      });

      // Assembly lines
      (p.cpuAssemblyLines || []).forEach((l, idx) => {
        const assy = (l.assyShift || 1) * (l.assyDL || 0);
        const test = (l.testShift || 1) * (l.testDL || 0);
        const pack = (l.packShift || 1) * (l.packDL || 0);
        const total = (assy + test + pack) * mult;
        html += `
          <tr>
            <td><strong>${l.name}</strong></td>
            <td>系統組裝 (Assembly)</td>
            <td class="mono center">SYS</td>
            <td class="center">
              <select class="shift-select" onchange="updateLineShift('${pKey}', 'assy', ${idx}, this.value)">
                <option value="1" ${l.assyShift === 1 ? 'selected' : ''}>1 班</option>
                <option value="2" ${l.assyShift === 2 ? 'selected' : ''}>2 班</option>
                <option value="3" ${l.assyShift === 3 ? 'selected' : ''}>3 班</option>
              </select>
            </td>
            <td class="mono right">A:${l.assyDL} / T:${l.testDL} / P:${l.packDL}</td>
            <td class="mono right font-bold" style="color:var(--accent-gold);">${total} DL</td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    }

    function renderDepartmentsTab(curPlant, metrics) {
      const smtEl = document.getElementById('deptSmtOnlineDL');
      if (smtEl) smtEl.textContent = metrics.smtOnline + ' DL';
      const pcaEl = document.getElementById('deptPcaOnlineDL');
      if (pcaEl) pcaEl.textContent = metrics.pcaOnline + ' DL';
      const assyEl = document.getElementById('deptAssyOnlineDL');
      if (assyEl) assyEl.textContent = metrics.assyOnline + ' DL';

      const sOff = document.getElementById('inputSmtOfflineDL');
      if (sOff) sOff.value = curPlant.smtOfflineDL || 0;
      const sIdl = document.getElementById('inputSmtIdl');
      if (sIdl) sIdl.value = curPlant.smtIdl || 0;

      const pOff = document.getElementById('inputPcaOfflineDL');
      if (pOff) pOff.value = curPlant.pcaOfflineDL || 0;
      const pIdl = document.getElementById('inputPcaIdl');
      if (pIdl) pIdl.value = curPlant.pcaIdl || 0;

      const aOff = document.getElementById('inputAssyOfflineDL');
      if (aOff) aOff.value = curPlant.assemblyOfflineDL || 0;
      const aIdl = document.getElementById('inputAssyIdl');
      if (aIdl) aIdl.value = curPlant.assemblyIdl || 0;
    }

    function renderContinuityTable() {
      const tbody = document.getElementById('continuityTableBody');
      if (!tbody) return;

      let html = '';
      SMT_PCA_SCHEDULE_PAIRS.forEach(p => {
        html += `
          <tr>
            <td>
              <strong style="color:var(--accent-gold);">${p.smt}</strong> ➔ 
              <strong style="color:var(--accent-green);">${p.pca}</strong>
            </td>
            <td class="mono center">${p.plant}</td>
            <td class="mono right">${p.smtDL} DL</td>
            <td class="mono right">${p.pcaDL} DL</td>
            <td class="mono right font-bold" style="color:var(--accent-cyan);">${p.totalDL} DL / 班</td>
            <td class="mono right">${p.qty.toLocaleString()} pcs</td>
            <td class="mono center">${p.days} 天</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }

    function renderMonthlyTrend(baseTargetDL, baseIDL) {
      const chartWrap = document.getElementById('chartBarsWrap');
      const tableBody = document.getElementById('monthlyTableBody');
      if (!chartWrap || !tableBody) return;

      let chartHtml = '';
      let tableHtml = '';
      let maxVal = 0;

      const monthlyData = MONTHLY_SEASONAL.map(item => {
        const dl = Math.round(baseTargetDL * item.factor);
        const idl = Math.round(baseIDL * item.idlFactor);
        const total = dl + idl;
        if (total > maxVal) maxVal = total;
        return { item, dl, idl, total };
      });

      if (maxVal === 0) maxVal = 1;

      monthlyData.forEach(({ item, dl, idl, total }) => {
        const dlHeight = Math.round((dl / maxVal) * 160);
        const idlHeight = Math.round((idl / maxVal) * 160);

        if (currentChartType === 'stacked') {
          chartHtml += `
            <div class="chart-col">
              <div class="bar-tooltip">${item.name}: DL ${dl} + IDL ${idl} = ${total}人</div>
              <div class="bar-group" style="flex-direction: column; height: ${dlHeight + idlHeight}px;">
                <div class="bar-seg bar-idl" style="height: ${idlHeight}px;"></div>
                <div class="bar-seg bar-dl" style="height: ${dlHeight}px;"></div>
              </div>
              <div class="bar-label">${item.name}</div>
            </div>
          `;
        } else {
          chartHtml += `
            <div class="chart-col">
              <div class="bar-tooltip">${item.name}: DL ${dl}人 / IDL ${idl}人</div>
              <div class="bar-group" style="height: ${Math.max(dlHeight, idlHeight)}px;">
                <div class="bar-seg bar-dl" style="height: ${dlHeight}px;"></div>
                <div class="bar-seg bar-idl" style="height: ${idlHeight}px;"></div>
              </div>
              <div class="bar-label">${item.name}</div>
            </div>
          `;
        }

        tableHtml += `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td class="mono center" style="color:var(--text-muted); font-size:0.75rem;">${item.note}</td>
            <td class="mono right font-bold" style="color:var(--accent-purple);">${item.factor.toFixed(2)}</td>
            <td class="mono right font-bold" style="color:var(--accent-cyan);">${dl.toLocaleString()} DL</td>
            <td class="mono right font-bold" style="color:var(--accent-green);">${idl.toLocaleString()} IDL</td>
            <td class="mono right font-bold" style="color:var(--accent-gold);">${total.toLocaleString()} 人</td>
          </tr>
        `;
      });

      chartWrap.innerHTML = chartHtml;
      tableBody.innerHTML = tableHtml;
    }

    // --- Interactive Handlers ---
    function updateLineShift(plantKey, type, index, shiftVal) {
      const p = sites[plantKey] || sites.tao;
      const s = parseInt(shiftVal, 10);
      if (type === 'smt' && p.smtLines && p.smtLines[index]) {
        p.smtLines[index].shift = s;
      } else if (type === 'pca' && p.pcaLines && p.pcaLines[index]) {
        p.pcaLines[index].faShift = s;
        p.pcaLines[index].testShift = s;
        p.pcaLines[index].packingShift = Math.max(1, s - 1);
      } else if (type === 'assy' && p.cpuAssemblyLines && p.cpuAssemblyLines[index]) {
        p.cpuAssemblyLines[index].assyShift = s;
        p.cpuAssemblyLines[index].testShift = s;
        p.cpuAssemblyLines[index].packShift = Math.max(1, s - 1);
      }
      renderApp();
      showToast('產線班數已更新，已即時重新試算落差！');
    }

    function updateOfflineDL(dept, val) {
      const p = sites[currentPlantKey] || sites.tao;
      const v = parseInt(val, 10) || 0;
      if (dept === 'smt') p.smtOfflineDL = v;
      if (dept === 'pca') p.pcaOfflineDL = v;
      if (dept === 'assembly') p.assemblyOfflineDL = v;
      renderApp();
      showToast('部門獨立線外人力已更新！');
    }

    function updateIdl(dept, val) {
      const p = sites[currentPlantKey] || sites.tao;
      const v = parseInt(val, 10) || 0;
      if (dept === 'smt') p.smtIdl = v;
      if (dept === 'pca') p.pcaIdl = v;
      if (dept === 'assembly') p.assemblyIdl = v;
      renderApp();
      showToast('部門間接 IDL 人力已更新！');
    }

    function setChartType(type) {
      currentChartType = type;
      document.getElementById('btnChartStacked').className = (type === 'stacked') ? 'btn btn-primary' : 'btn';
      document.getElementById('btnChartGrouped').className = (type === 'grouped') ? 'btn btn-primary' : 'btn';
      renderApp();
    }

    function saveToLocalStorage() {
      try {
        localStorage.setItem('ie_standalone_sites_state_v1', JSON.stringify(sites));
        showToast('已成功將當前調整數據儲存至本機快照！');
      } catch (e) {
        showToast('儲存失敗：本機儲存受限。');
      }
    }

    function resetToDefaults() {
      if (confirm('確定要還原為原廠預設標準人力與排程數值嗎？')) {
        sites = JSON.parse(JSON.stringify(DEFAULT_SITES));
        try { localStorage.removeItem('ie_standalone_sites_state_v1'); } catch(e){}
        renderApp();
        showToast('已成功還原為初始標準設定！');
      }
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      const m = document.getElementById('toastMsg');
      if (t && m) {
        m.textContent = msg;
        t.style.display = 'flex';
        clearTimeout(window.__toastTimeout);
        window.__toastTimeout = setTimeout(() => { t.style.display = 'none'; }, 2500);
      }
    }

    // --- Tab & Control Event Listeners ---
    document.addEventListener('DOMContentLoaded', () => {
      // Plant buttons
      document.querySelectorAll('.plant-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.plant-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentPlantKey = btn.dataset.plant;
          renderApp();
        });
      });

      // Period buttons
      document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentTimePeriod = btn.dataset.period;
          renderApp();
        });
      });

      // Tabs
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tab = btn.dataset.tab;
          document.getElementById('tabContentOverview').style.display = (tab === 'overview') ? 'block' : 'none';
          document.getElementById('tabContentContinuity').style.display = (tab === 'continuity') ? 'block' : 'none';
          document.getElementById('tabContentDepartments').style.display = (tab === 'departments') ? 'block' : 'none';
          document.getElementById('tabContentMonthly').style.display = (tab === 'monthly') ? 'block' : 'none';
        });
      });

      // Initial Render
      renderApp();
    });
  </script>
</body>
</html>
"""

import os
import shutil

# Write out the file with explicit UTF-8 encoding (no BOM)
with open('public/IE_Manpower_Forecast_App.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

if os.path.exists('dist'):
    with open('dist/IE_Manpower_Forecast_App.html', 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    # GitHub Pages: copy index.html to 404.html for SPA client routing fallback
    if os.path.exists('dist/index.html'):
        shutil.copyfile('dist/index.html', 'dist/404.html')
    
    # GitHub Pages: ensure .nojekyll exists
    with open('dist/.nojekyll', 'w', encoding='utf-8') as f:
        f.write('')

with open('report.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Generated clean standalone HTML file & GitHub Pages assets successfully!")
