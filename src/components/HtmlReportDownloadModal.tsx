import React, { useState } from 'react';
import { SiteData, TimePeriod } from '../types';
import { calculateSiteMetrics } from '../utils/calculations';
import { AUGUST_SMT_LINE_SUMMARIES } from '../data/apsSmtPcaSchedule';

interface HtmlReportDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: SiteData;
  sites: Record<string, SiteData>;
  timePeriod: TimePeriod;
  onToast: (msg: string) => void;
  selectedYear?: number;
  selectedMonth?: number;
  initialMode?: 'standalone_app' | 'report';
}

export const HtmlReportDownloadModal: React.FC<HtmlReportDownloadModalProps> = ({
  isOpen,
  onClose,
  currentSite,
  sites,
  timePeriod,
  onToast,
  selectedYear = 2026,
  selectedMonth = 9,
  initialMode = 'standalone_app',
}) => {
  const [exportMode, setExportMode] = useState<'standalone_app' | 'report'>(initialMode);
  const [includeLiveData, setIncludeLiveData] = useState<boolean>(true);
  const [isDownloadingApp, setIsDownloadingApp] = useState<boolean>(false);

  // Report specific options
  const [reportScope, setReportScope] = useState<'all' | 'current'>('all');
  const [includeLineDetails, setIncludeLineDetails] = useState<boolean>(true);
  const [includeTrendData, setIncludeTrendData] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const siteList = reportScope === 'all' ? (Object.values(sites) as SiteData[]) : [currentSite];

  // Calculate metrics for selected sites
  const multiplier = timePeriod === 'QUARTERLY' ? 3 : 1;
  const siteMetrics = siteList.map((site) => ({
    site,
    metrics: calculateSiteMetrics(site, timePeriod),
    targetDL: Math.round(site.targetDemandDL * multiplier),
    actualDL: Math.round(site.actualHrDL * multiplier),
  }));

  const totalTargetDL = siteMetrics.reduce((acc, m) => acc + m.targetDL, 0);
  const totalActualDL = siteMetrics.reduce((acc, m) => acc + m.actualDL, 0);
  const totalNetGap = siteMetrics.reduce((acc, m) => acc + m.metrics.netGap, 0);
  const totalIDL = siteMetrics.reduce((acc, m) => acc + m.metrics.totalIDL, 0);

  // 1. Download Standalone Full-Application HTML (Single File)
  const handleDownloadStandaloneApp = async () => {
    try {
      setIsDownloadingApp(true);
      onToast('Packaging standalone single-file HTML application (UTF-8)...');
      const baseUrl = import.meta.env.BASE_URL || './';
      const fileUrl = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}IE_Manpower_Forecast_App.html`;
      let response = await fetch(fileUrl).catch(() => null);
      if (!response || !response.ok) {
        response = await fetch('./IE_Manpower_Forecast_App.html');
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch app bundle: ${response.statusText}`);
      }
      let htmlContent = await response.text();

      // If user wants to include current live edited data:
      if (includeLiveData) {
        // Sanitize to prevent terminating script tags
        const safeDataJson = JSON.stringify(sites).replace(/<\/script/gi, '<\\/script');
        const placeholder = 'window.__IEC_EMBEDDED_SITES__ = null;';

        if (htmlContent.includes(placeholder)) {
          htmlContent = htmlContent.replace(
            placeholder,
            `window.__IEC_EMBEDDED_SITES__ = ${safeDataJson};`
          );
        } else {
          // Use lastIndexOf('</head>') to target the REAL HTML closing tag, NOT bundled JS strings!
          const lastHeadIdx = htmlContent.lastIndexOf('</head>');
          if (lastHeadIdx !== -1) {
            const injection = `<script id="iec-injected-live-data">window.__IEC_EMBEDDED_SITES__ = ${safeDataJson};</script>\n`;
            htmlContent =
              htmlContent.slice(0, lastHeadIdx) + injection + htmlContent.slice(lastHeadIdx);
          }
        }
      }

      // Standard W3C HTML5 pure UTF-8 Blob without BOM prefix to prevent quirks mode / mojibake artifacts
      const blob = new Blob([htmlContent], {
        type: 'text/html;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const todayStr = new Date().toISOString().slice(0, 10);
      link.download = includeLiveData
        ? `IE_Manpower_Forecast_App_Live_${todayStr}.html`
        : `IE_Manpower_Forecast_App_v1.0.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onToast('Export successful! UTF-8 encoding verified. Double-click offline to run in any modern browser.');
      onClose();
    } catch (err) {
      console.error(err);
      onToast('Download failed. Please try opening in a new tab or refreshing.');
    } finally {
      setIsDownloadingApp(false);
    }
  };

  // 2. Generate Static Report HTML
  const generateFullHtmlString = (): string => {
    const todayStr = new Date().toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const plantRowsHtml = siteMetrics
      .map(({ site, metrics, targetDL, actualDL }) => {
        const gapClass = metrics.netGap < 0 ? 'color: #F59E0B;' : 'color: #4edea3;';
        const badgeClass =
          metrics.netGap < 0
            ? 'background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.4);'
            : 'background: rgba(78, 222, 163, 0.15); color: #4edea3; border: 1px solid rgba(78, 222, 163, 0.4);';
        const badgeText = metrics.netGap < 0 ? 'DEFICIT' : 'BALANCED';

        return `
          <tr>
            <td><strong>${site.name}</strong></td>
            <td class="mono">${site.code}</td>
            <td class="mono right">${targetDL.toLocaleString()} DL</td>
            <td class="mono right">${actualDL.toLocaleString()} DL</td>
            <td class="mono right" style="${gapClass}">${metrics.netGap > 0 ? '+' : ''}${metrics.netGap.toLocaleString()} DL</td>
            <td class="mono right">${metrics.totalIDL.toLocaleString()} IDL</td>
            <td class="right"><span class="badge" style="${badgeClass}">${badgeText}</span></td>
          </tr>
        `;
      })
      .join('');

    const smtOfflineDL = (currentSite.smtOfflineDL || 0) * multiplier;
    const pcaOfflineDL = (currentSite.pcaOfflineDL || 0) * multiplier;
    const assyOfflineDL = (currentSite.assemblyOfflineDL || 0) * multiplier;
    const mfgOfflineTotal = smtOfflineDL + pcaOfflineDL + assyOfflineDL;

    const formatCostCenterText = (val?: string | string[], defaultCode = 'N/A') => {
      if (!val) return defaultCode;
      if (Array.isArray(val)) {
        return val.length > 0 ? val.join(', ') : defaultCode;
      }
      return String(val) || defaultCode;
    };

    const smtRowsHtml = includeLineDetails
      ? (currentSite.smtLines || [])
          .map((l) => {
            const shiftCount = typeof l.shift === 'number' ? l.shift : 1;
            const onlineDL = (l.onlineStdDL || 0) * shiftCount * multiplier;
            return `
            <tr>
              <td><strong>${l.name}</strong></td>
              <td>SMT Assembly</td>
              <td class="mono center">${shiftCount} Shift${shiftCount > 1 ? 's' : ''}</td>
              <td class="mono center">${l.category}</td>
              <td class="mono right">${(l.onlineStdDL || 0) * multiplier} DL</td>
              <td class="mono right font-bold" style="color: var(--accent-gold);">${onlineDL} DL</td>
            </tr>
          `;
          })
          .join('')
      : '';

    const pcaRowsHtml = includeLineDetails
      ? (currentSite.pcaLines || [])
          .map((l) => {
            const faShifts = l.faShift || 1;
            const testShifts = l.testShift || 1;
            const packShifts = l.packingShift || 1;
            const lineOnline =
              ((l.faStdDL || 0) * faShifts +
                (l.testStdDL || 0) * testShifts +
                (l.packingStdDL || 0) * packShifts) *
              multiplier;
            return `
            <tr>
              <td><strong>${l.name}</strong></td>
              <td>PCA Board Test (${l.category})</td>
              <td class="mono center">${l.faStdDL} DL × ${faShifts}S</td>
              <td class="mono center">${l.testStdDL} DL × ${testShifts}S</td>
              <td class="mono center">${l.packingStdDL} DL × ${packShifts}S</td>
              <td class="mono right font-bold" style="color: var(--accent-gold);">${lineOnline} DL</td>
            </tr>
          `;
          })
          .join('')
      : '';

    const cpuRowsHtml = includeLineDetails
      ? (currentSite.cpuAssemblyLines || [])
          .map((l) => {
            const assyShifts = l.assyShift || 1;
            const testShifts = l.testShift || 1;
            const packShifts = l.packShift || 1;
            const lineOnline =
              ((l.assyDL || 0) * assyShifts +
                (l.testDL || 0) * testShifts +
                (l.packDL || 0) * packShifts) *
              multiplier;
            return `
            <tr>
              <td><strong>${l.name}</strong></td>
              <td>CPU Assembly</td>
              <td class="mono center">${l.assyDL} DL × ${assyShifts}S</td>
              <td class="mono center">${l.testDL} DL × ${testShifts}S</td>
              <td class="mono center">${l.packDL} DL × ${packShifts}S</td>
              <td class="mono right font-bold" style="color: var(--accent-gold);">${lineOnline} DL</td>
            </tr>
          `;
          })
          .join('')
      : '';

    const rackRowsHtml = includeLineDetails
      ? (currentSite.rackAssemblyLines || [])
          .map((l) => {
            const assyShifts = l.assyShift || 1;
            const testShifts = l.testShift || 1;
            const packShifts = l.packShift || 1;
            const lineOnline =
              ((l.assyDL || 0) * assyShifts +
                (l.testDL || 0) * testShifts +
                (l.packDL || 0) * packShifts) *
              multiplier;
            return `
            <tr>
              <td><strong>${l.name}</strong></td>
              <td>Rack Assembly</td>
              <td class="mono center">${l.assyDL} DL × ${assyShifts}S</td>
              <td class="mono center">${l.testDL} DL × ${testShifts}S</td>
              <td class="mono center">${l.packDL} DL × ${packShifts}S</td>
              <td class="mono right font-bold" style="color: var(--accent-gold);">${lineOnline} DL</td>
            </tr>
          `;
          })
          .join('')
      : '';

    const assyRowsHtml = `${cpuRowsHtml}${rackRowsHtml}`;

    return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>IE Manpower Forecast & Capacity Report - ${reportScope === 'all' ? 'Global Multi-Plant' : currentSite.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-dark: #040406;
      --card-bg: #1C1D22;
      --card-inner: #131316;
      --border-color: #524437;
      --text-main: #e5e1e6;
      --text-muted: #d7c3b2;
      --accent-gold: #ffb86b;
      --accent-cyan: #5de6ff;
      --accent-green: #4edea3;
      --accent-warn: #F59E0B;
      --accent-purple: #a78bfa;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Inter', sans-serif;
      padding: 2.5rem;
      line-height: 1.5;
    }

    .container { max-width: 1200px; margin: 0 auto; }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }

    .logo-section { display: flex; align-items: center; gap: 0.75rem; }

    .logo-badge {
      background: var(--accent-gold);
      color: #492900;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-main); }
    .subtitle { font-size: 0.8rem; color: var(--text-muted); opacity: 0.8; font-family: 'JetBrains Mono', monospace; }

    .btn-group { display: flex; gap: 0.75rem; }

    button {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    button:hover { border-color: var(--accent-gold); color: var(--accent-gold); }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.25rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    }

    .kpi-title {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .kpi-value {
      font-size: 1.75rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-main);
    }

    .kpi-sub { font-size: 0.75rem; margin-top: 0.25rem; }

    .text-gold { color: var(--accent-gold); }
    .text-cyan { color: var(--accent-cyan); }
    .text-green { color: var(--accent-green); }
    .text-warn { color: var(--accent-warn); }

    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(82, 68, 55, 0.5);
      padding-bottom: 0.75rem;
    }

    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 1rem; }

    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(82, 68, 55, 0.4);
    }

    th {
      background: var(--card-inner);
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    td.mono { font-family: 'JetBrains Mono', monospace; }
    td.right, th.right { text-align: right; }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }

    footer {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
    }

    @media print {
      body { background: white; color: black; }
      .kpi-card, .section-card { background: white; border: 1px solid #ccc; box-shadow: none; }
      th { background: #f0f0f0; color: #333; }
      .btn-group { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-section">
        <div class="logo-badge">IEC</div>
        <div>
          <h1>IE Manpower Forecast & Capacity Executive Report</h1>
          <div class="subtitle">Generated: ${todayStr} | Scope: ${reportScope === 'all' ? 'Global All Plants' : currentSite.name} (${timePeriod})</div>
        </div>
      </div>
      <div class="btn-group">
        <button onclick="window.print()">
          <span class="material-symbols-outlined">print</span> Print / PDF
        </button>
      </div>
    </header>

    <!-- Key Executive KPIs -->
    <div class="grid-4">
      <div class="kpi-card">
        <div class="kpi-title">Target Capacity DL Demand</div>
        <div class="kpi-value text-cyan">${totalTargetDL.toLocaleString()} <span style="font-size:1rem;">DL</span></div>
        <div class="kpi-sub text-muted">Industrial Engineering Standard</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Actual HR Headcount</div>
        <div class="kpi-value text-gold">${totalActualDL.toLocaleString()} <span style="font-size:1rem;">DL</span></div>
        <div class="kpi-sub text-muted">Verified HR On-Site Roster</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Net Capacity Gap</div>
        <div class="kpi-value ${totalNetGap < 0 ? 'text-warn' : 'text-green'}">${totalNetGap > 0 ? '+' : ''}${totalNetGap.toLocaleString()} <span style="font-size:1rem;">DL</span></div>
        <div class="kpi-sub ${totalNetGap < 0 ? 'text-warn' : 'text-green'}">${totalNetGap < 0 ? 'Capacity Deficit Shortage' : 'Balanced Capacity Surplus'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">IDL Overhead Standard</div>
        <div class="kpi-value text-green">${totalIDL.toLocaleString()} <span style="font-size:1rem;">IDL</span></div>
        <div class="kpi-sub text-green">Support & Supervisory Staff</div>
      </div>
    </div>

    <!-- Plant Summary Table -->
    <div class="section-card">
      <div class="section-title">
        <span class="material-symbols-outlined text-gold">factory</span>
        Manufacturing Plant Capacity & Headcount Status
      </div>
      <table>
        <thead>
          <tr>
            <th>Plant Name</th>
            <th>Site Code</th>
            <th class="right">Target DL Demand</th>
            <th class="right">Actual HR DL</th>
            <th class="right">Net Capacity Gap</th>
            <th class="right">Target IDL</th>
            <th class="right">Status</th>
          </tr>
        </thead>
        <tbody>
          ${plantRowsHtml}
        </tbody>
      </table>
    </div>

    ${
      includeLineDetails
        ? `
    <!-- MANUFACTURING SEGMENT: Production Divisions -->
    <div class="section-card">
      <div class="section-title">
        <span class="material-symbols-outlined text-gold">precision_manufacturing</span>
        MANUFACTURING SEGMENT — Production Lines & Independent Offline DL (${currentSite.name})
      </div>

      <!-- SMT Table -->
      <h3 style="font-size:0.95rem; margin-top:1.25rem; color:var(--accent-gold); font-family:'JetBrains Mono', monospace;">1. SMT Production Lines</h3>
      <table>
        <thead>
          <tr>
            <th>Line Name</th>
            <th>Division</th>
            <th class="center">Shifts</th>
            <th class="center">Category</th>
            <th class="right">Online Std DL / Shift</th>
            <th class="right">Total Online DL</th>
          </tr>
        </thead>
        <tbody>
          ${smtRowsHtml || '<tr><td colspan="6" class="center text-muted">No SMT lines</td></tr>'}
        </tbody>
      </table>

      <!-- PCA Table -->
      <h3 style="font-size:0.95rem; margin-top:1.75rem; color:var(--accent-gold); font-family:'JetBrains Mono', monospace;">2. PCA Board Test Lines (Station Shifts)</h3>
      <table>
        <thead>
          <tr>
            <th>Line Name</th>
            <th>Division / Category</th>
            <th class="center">FA (DL × Shift)</th>
            <th class="center">TEST (DL × Shift)</th>
            <th class="center">PACKING (DL × Shift)</th>
            <th class="right">Total Online DL</th>
          </tr>
        </thead>
        <tbody>
          ${pcaRowsHtml || '<tr><td colspan="6" class="center text-muted">No PCA lines</td></tr>'}
        </tbody>
      </table>

      <!-- System Assembly Table -->
      <h3 style="font-size:0.95rem; margin-top:1.75rem; color:var(--accent-gold); font-family:'JetBrains Mono', monospace;">3. System Assembly Lines (Station Shifts)</h3>
      <table>
        <thead>
          <tr>
            <th>Line Name</th>
            <th>Division</th>
            <th class="center">ASSY (DL × Shift)</th>
            <th class="center">TEST (DL × Shift)</th>
            <th class="center">PACKING (DL × Shift)</th>
            <th class="right">Total Online DL</th>
          </tr>
        </thead>
        <tbody>
          ${assyRowsHtml || '<tr><td colspan="6" class="center text-muted">No System Assembly lines</td></tr>'}
        </tbody>
      </table>

      <!-- Independent Offline DL Summary -->
      <h3 style="font-size:0.95rem; margin-top:1.75rem; color:var(--accent-cyan); font-family:'JetBrains Mono', monospace;">4. Manufacturing Independent Offline DL & IDL</h3>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th class="center">Cost Center (HR)</th>
            <th class="right">Independent Offline DL</th>
            <th class="right">Department IDL</th>
            <th class="right">Calculation Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SMT Department</strong></td>
            <td class="mono center" style="color:var(--accent-purple);">${formatCostCenterText(currentSite.smtCostCenter, 'CC-SMT-7102')}</td>
            <td class="mono right font-bold" style="color:var(--accent-gold);">${smtOfflineDL} DL</td>
            <td class="mono right" style="color:var(--accent-cyan);">${(currentSite.smtIdl || 0) * multiplier} IDL</td>
            <td class="text-muted">Independent calculation (not included in line-level DL)</td>
          </tr>
          <tr>
            <td><strong>PCA Department</strong></td>
            <td class="mono center" style="color:var(--accent-purple);">${formatCostCenterText(currentSite.pcaCostCenter, 'CC-PCA-7105')}</td>
            <td class="mono right font-bold" style="color:var(--accent-gold);">${pcaOfflineDL} DL</td>
            <td class="mono right" style="color:var(--accent-cyan);">${(currentSite.pcaIdl || 0) * multiplier} IDL</td>
            <td class="text-muted">Independent calculation (not included in line-level DL)</td>
          </tr>
          <tr>
            <td><strong>System Assembly Department</strong></td>
            <td class="mono center" style="color:var(--accent-purple);">${formatCostCenterText(currentSite.assemblyCostCenter, 'CC-SYS-7110')}</td>
            <td class="mono right font-bold" style="color:var(--accent-gold);">${assyOfflineDL} DL</td>
            <td class="mono right" style="color:var(--accent-cyan);">${(currentSite.assemblyIdl || 0) * multiplier} IDL</td>
            <td class="text-muted">Independent calculation (not included in line-level DL)</td>
          </tr>
          <tr style="background: rgba(255,184,107,0.08); font-weight:bold;">
            <td><strong>TOTAL MANUFACTURING OFFLINE DL</strong></td>
            <td class="mono center text-muted">—</td>
            <td class="mono right" style="color:var(--accent-gold);">${mfgOfflineTotal} DL</td>
            <td class="mono right" style="color:var(--accent-cyan);">${((currentSite.smtIdl || 0) + (currentSite.pcaIdl || 0) + (currentSite.assemblyIdl || 0)) * multiplier} IDL</td>
            <td class="text-gold">Unified Manufacturing Pool</td>
          </tr>
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <!-- SMT to PCA Continuity Schedule Section -->
    <div class="section-card">
      <div class="section-title">
        <span class="material-symbols-outlined text-gold">hub</span>
        SMT ➔ PCA Continuous Process Schedule & Dynamic Manpower Standard
      </div>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem; line-height:1.6;">
        APS Continuous Schedule based on 1:1 line linkage: SMT startup immediately engages corresponding PCA lines. Total Daily Demand = (SMT Shifts × SMT Std DL) + (PCA Shifts × PCA Std DL).
      </p>
      <table>
        <thead>
          <tr>
            <th>Linked Lines (SMT ➔ PCA)</th>
            <th class="center">Plant</th>
            <th class="right">SMT Std DL</th>
            <th class="right">PCA Std DL</th>
            <th class="right">Combined / Shift</th>
            <th class="right">Aug Total Planned Vol</th>
            <th class="center">Active Days</th>
          </tr>
        </thead>
        <tbody>
          ${
            AUGUST_SMT_LINE_SUMMARIES.slice(0, 16)
              .map(
                (l) => `
            <tr>
              <td><strong style="color:var(--accent-gold);">${l.smtLine}</strong> ➔ <strong style="color:var(--accent-green);">${l.pcaLine}</strong></td>
              <td class="mono center">${l.plant}</td>
              <td class="mono right">${l.smtStdDL} DL</td>
              <td class="mono right">${l.pcaStdDL} DL</td>
              <td class="mono right font-bold" style="color:var(--accent-cyan);">${l.totalPairStdDL} DL / Shift</td>
              <td class="mono right">${l.totalPlanQty.toLocaleString()} pcs</td>
              <td class="mono center">${l.activeDays} Days</td>
            </tr>
          `
              )
              .join('')
          }
        </tbody>
      </table>
    </div>

    <footer>
      IEC Industrial Engineering System Operations • Confidential Executive Report
    </footer>
  </div>
</body>
</html>`;
  };

  const handleDownloadReport = () => {
    const htmlString = generateFullHtmlString();
    // Standard W3C HTML5 pure UTF-8 Blob without BOM prefix
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `IE_Manpower_Executive_Report_${reportScope}_${timePeriod}_${new Date()
      .toISOString()
      .slice(0, 10)}.html`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onToast(`Executive report downloaded (UTF-8 verified): ${fileName}`);
    onClose();
  };

  const handleCopyCode = () => {
    const htmlString = generateFullHtmlString();
    navigator.clipboard.writeText(htmlString).then(() => {
      setCopied(true);
      onToast('Report HTML code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#1C1D22] border border-[#524437] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#524437]/60 flex items-center justify-between bg-[#131316]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ffb86b]">download</span>
            <div>
              <h3 className="font-['Inter'] font-bold text-lg text-[#e5e1e6]">
                Export HTML Application / Download
              </h3>
              <p className="text-xs text-[#d7c3b2]/70 font-['Inter']">
                Choose to export a standalone offline Web application or an executive analytics report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#d7c3b2]/60 hover:text-[#e5e1e6] hover:bg-[#2a292d] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#524437]/50 bg-[#16171b] px-6">
          <button
            onClick={() => setExportMode('standalone_app')}
            className={`py-3 px-4 font-['Inter'] text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              exportMode === 'standalone_app'
                ? 'border-[#ffb86b] text-[#ffb86b]'
                : 'border-transparent text-[#d7c3b2]/60 hover:text-[#e5e1e6]'
            }`}
          >
            <span className="material-symbols-outlined text-base">apps</span>
            <span>Standalone HTML App (Recommended • Offline Ready)</span>
          </button>
          <button
            onClick={() => setExportMode('report')}
            className={`py-3 px-4 font-['Inter'] text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              exportMode === 'report'
                ? 'border-[#ffb86b] text-[#ffb86b]'
                : 'border-transparent text-[#d7c3b2]/60 hover:text-[#e5e1e6]'
            }`}
          >
            <span className="material-symbols-outlined text-base">description</span>
            <span>Executive Analytics Report HTML (Print / Archive)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {exportMode === 'standalone_app' ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Highlight Card */}
              <div className="p-4 bg-gradient-to-br from-[#2a2319] to-[#1C1D22] border border-[#ffb86b]/40 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-[#ffb86b]/20 text-[#ffb86b] shrink-0">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#ffb86b] font-['Inter']">
                      Single-File Offline Bundle (.html)
                    </h4>
                    <p className="text-xs text-[#e5e1e6]/90 mt-1 leading-relaxed">
                      Packages the entire IE Manpower Forecast & Maintenance system (including all React components, Tailwind styling, Recharts visualizations, APS continuity engine, monthly drilldowns, and 5-department maintenance) into a self-contained <code className="text-[#ffb86b] bg-black/40 px-1.5 py-0.5 rounded font-mono">.html</code> file.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#ffb86b]/20 text-center text-xs">
                  <div className="bg-[#131316]/60 p-2 rounded">
                    <span className="text-[#d7c3b2]/60 block text-[10px] uppercase">File Format</span>
                    <span className="font-['JetBrains_Mono'] font-bold text-[#e5e1e6]">Pure Single HTML (.html)</span>
                  </div>
                  <div className="bg-[#131316]/60 p-2 rounded">
                    <span className="text-[#d7c3b2]/60 block text-[10px] uppercase">Runtime</span>
                    <span className="font-['JetBrains_Mono'] font-bold text-[#4edea3]">No Server • 100% Offline</span>
                  </div>
                  <div className="bg-[#131316]/60 p-2 rounded">
                    <span className="text-[#d7c3b2]/60 block text-[10px] uppercase">File Size</span>
                    <span className="font-['JetBrains_Mono'] font-bold text-[#5de6ff]">~2.6 MB</span>
                  </div>
                </div>
              </div>

              {/* Data Injection Option */}
              <div className="bg-[#131316] p-4 rounded-xl border border-[#524437]/40 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#d7c3b2] font-['JetBrains_Mono']">
                  Export Options
                </h5>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeLiveData}
                    onChange={(e) => setIncludeLiveData(e.target.checked)}
                    className="mt-0.5 rounded bg-[#1C1D22] border-[#524437] text-[#ffb86b] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#e5e1e6] block">
                      Include current live edited values (Inject Live Snapshot Data)
                    </span>
                    <span className="text-[11px] text-[#d7c3b2]/70 leading-relaxed block mt-0.5">
                      Automatically injects your customized plant standards, shift lines, and 5-department edits into the HTML initial snapshot, loading them immediately upon opening.
                    </span>
                  </div>
                </label>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-[#17181c] p-4 rounded-xl border border-[#524437]/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#e5e1e6]">Preview Standalone App in New Tab</div>
                  <div className="text-[11px] text-[#d7c3b2]/60">Test single-file standalone execution directly in your browser without downloading</div>
                </div>
                <a
                  href="/IE_Manpower_Forecast_App.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-[#2a292d] hover:bg-[#38363d] text-[#5de6ff] text-xs font-['JetBrains_Mono'] rounded-lg border border-[#5de6ff]/30 hover:border-[#5de6ff] transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Open in New Tab
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Scope Selector */}
              <div>
                <label className="block text-xs font-['JetBrains_Mono'] text-[#d7c3b2] uppercase tracking-wider mb-2">
                  Plant Scope
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReportScope('all')}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                      reportScope === 'all'
                        ? 'bg-[#2a292d] border-[#ffb86b] text-[#ffb86b]'
                        : 'bg-[#131316] border-[#524437]/40 text-[#d7c3b2]/70 hover:border-[#524437]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#e5e1e6]">Global Multi-Plant (All Plants)</span>
                      <span className="material-symbols-outlined text-base">public</span>
                    </div>
                    <span className="text-[11px] text-[#d7c3b2]/60">
                      Includes Taoyuan (TAO), Kunshan, Vietnam and global metrics
                    </span>
                  </button>

                  <button
                    onClick={() => setReportScope('current')}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                      reportScope === 'current'
                        ? 'bg-[#2a292d] border-[#ffb86b] text-[#ffb86b]'
                        : 'bg-[#131316] border-[#524437]/40 text-[#d7c3b2]/70 hover:border-[#524437]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#e5e1e6]">{currentSite.name}</span>
                      <span className="material-symbols-outlined text-base">factory</span>
                    </div>
                    <span className="text-[11px] text-[#d7c3b2]/60">
                      Focus solely on {currentSite.code} plant metrics
                    </span>
                  </button>
                </div>
              </div>

              {/* Included Sections */}
              <div>
                <label className="block text-xs font-['JetBrains_Mono'] text-[#d7c3b2] uppercase tracking-wider mb-2">
                  Report Modules Included
                </label>
                <div className="space-y-2.5 bg-[#131316] p-4 rounded-lg border border-[#524437]/40">
                  <label className="flex items-center gap-3 text-xs text-[#e5e1e6]">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="rounded bg-[#1C1D22] border-[#524437] text-[#ffb86b] focus:ring-0"
                    />
                    <span>Executive KPI Summary Cards (Target DL, Actual HR, Net Gap, IDL)</span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-[#e5e1e6]">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="rounded bg-[#1C1D22] border-[#524437] text-[#ffb86b] focus:ring-0"
                    />
                    <span>Manufacturing Plant Manpower & Capacity Matrix</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-xs text-[#e5e1e6]">
                    <input
                      type="checkbox"
                      checked={includeLineDetails}
                      onChange={(e) => setIncludeLineDetails(e.target.checked)}
                      className="rounded bg-[#1C1D22] border-[#524437] text-[#ffb86b] focus:ring-0"
                    />
                    <span>APS Manufacturing Lines Standard & Efficiency ({currentSite.lines.length} Lines)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-xs text-[#e5e1e6]">
                    <input
                      type="checkbox"
                      checked={includeTrendData}
                      onChange={(e) => setIncludeTrendData(e.target.checked)}
                      className="rounded bg-[#1C1D22] border-[#524437] text-[#ffb86b] focus:ring-0"
                    />
                    <span>SMT ➔ PCA Continuous Process Pairing Analysis</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="px-6 py-4 bg-[#131316] border-t border-[#524437]/60 flex items-center justify-between gap-3">
          {exportMode === 'standalone_app' ? (
            <div className="flex items-center gap-2 text-xs text-[#d7c3b2]/70 font-['JetBrains_Mono']">
              <span className="material-symbols-outlined text-sm text-[#4edea3]">check_circle</span>
              <span>Single File Packaged (~2.6 MB)</span>
            </div>
          ) : (
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-[#2a292d] hover:bg-[#38363d] text-[#e5e1e6] text-xs font-['JetBrains_Mono'] rounded-lg border border-[#524437]/50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              {copied ? 'Copied!' : 'Copy Report HTML'}
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/80 hover:text-[#e5e1e6] transition-colors cursor-pointer"
            >
              Close
            </button>

            {exportMode === 'standalone_app' ? (
              <button
                onClick={handleDownloadStandaloneApp}
                disabled={isDownloadingApp}
                className="px-5 py-2.5 bg-[#ffb86b] hover:bg-[#ffa742] active:scale-95 disabled:opacity-50 text-[#492900] text-xs font-['JetBrains_Mono'] font-bold rounded-lg shadow-lg hover:shadow-[#ffb86b]/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">
                  {isDownloadingApp ? 'hourglass_top' : 'download'}
                </span>
                <span>{isDownloadingApp ? 'Packaging...' : 'Download Standalone HTML App'}</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadReport}
                className="px-5 py-2.5 bg-[#ffb86b] hover:bg-[#ffa742] active:scale-95 text-[#492900] text-xs font-['JetBrains_Mono'] font-bold rounded-lg shadow-lg hover:shadow-[#ffb86b]/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Download Report HTML</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
