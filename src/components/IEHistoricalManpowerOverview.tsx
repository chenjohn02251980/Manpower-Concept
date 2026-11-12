import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { SiteData } from '../types';

interface IEHistoricalManpowerOverviewProps {
  site: SiteData;
  onScrollToSegment?: (segmentId: string) => void;
}

export const IEHistoricalManpowerOverview: React.FC<IEHistoricalManpowerOverviewProps> = ({
  site,
  onScrollToSegment,
}) => {
  // Primary Time Dimension toggle: 'yearly' (Year) vs 'monthly' (Month)
  const [timeDimension, setTimeDimension] = useState<'yearly' | 'monthly'>('yearly');
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');
  const [tableMode, setTableMode] = useState<'detail' | 'multi_year'>('detail');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Interactive Year-to-Month Drilldown state
  const [selectedDrillYear, setSelectedDrillYear] = useState<string>('2026');
  const [monthlyChartMode, setMonthlyChartMode] = useState<'stacked' | 'grouped'>('stacked');
  const [monthlyTableTab, setMonthlyTableTab] = useState<'summary' | 'departments'>('summary');

  // 1. Manufacturing breakdown
  const smtOnlineDL = (site.smtLines || []).reduce((acc, l) => {
    const shiftCount = typeof l.shift === 'number' ? l.shift : 1;
    return acc + (l.onlineStdDL || 0) * shiftCount;
  }, 0);
  const smtOfflineDL = site.smtOfflineDL || 0;
  const smtTotalDL = smtOnlineDL + smtOfflineDL;
  const smtIdl = site.smtIdl || 0;
  const smtTotal = smtTotalDL + smtIdl;

  const pcaOnlineDL = (site.pcaLines || []).reduce((acc, l) => {
    const faShifts = typeof l.faShift === 'number' ? l.faShift : 1;
    const testShifts = typeof l.testShift === 'number' ? l.testShift : 1;
    const packShifts = typeof l.packingShift === 'number' ? l.packingShift : 1;
    return (
      acc +
      (l.faStdDL || 0) * faShifts +
      (l.testStdDL || 0) * testShifts +
      (l.packingStdDL || 0) * packShifts
    );
  }, 0);
  const pcaOfflineDL = site.pcaOfflineDL || 0;
  const pcaTotalDL = pcaOnlineDL + pcaOfflineDL;
  const pcaIdl = site.pcaIdl || 0;
  const pcaTotal = pcaTotalDL + pcaIdl;

  const cpuAssyOnlineDL = (site.cpuAssemblyLines || []).reduce((acc, l) => {
    const assyShifts = typeof l.assyShift === 'number' ? l.assyShift : 1;
    const testShifts = typeof l.testShift === 'number' ? l.testShift : 1;
    const packShifts = typeof l.packShift === 'number' ? l.packShift : 1;
    return (
      acc +
      (l.assyDL || 0) * assyShifts +
      (l.testDL || 0) * testShifts +
      (l.packDL || 0) * packShifts
    );
  }, 0);
  const rackAssyOnlineDL = (site.rackAssemblyLines || []).reduce((acc, l) => {
    const assyShifts = typeof l.assyShift === 'number' ? l.assyShift : 1;
    const testShifts = typeof l.testShift === 'number' ? l.testShift : 1;
    const packShifts = typeof l.packShift === 'number' ? l.packShift : 1;
    return (
      acc +
      (l.assyDL || 0) * assyShifts +
      (l.testDL || 0) * testShifts +
      (l.packDL || 0) * packShifts
    );
  }, 0);
  const assyOnlineDL = cpuAssyOnlineDL + rackAssyOnlineDL;
  const assyOfflineDL = site.assemblyOfflineDL || 0;
  const assyTotalDL = assyOnlineDL + assyOfflineDL;
  const assyIdl = site.assemblyIdl || 0;
  const assyTotal = assyTotalDL + assyIdl;

  const mfgOnlineDL = smtOnlineDL + pcaOnlineDL + assyOnlineDL;
  const mfgOfflineDL = smtOfflineDL + pcaOfflineDL + assyOfflineDL;
  const mfgTotalDL = smtTotalDL + pcaTotalDL + assyTotalDL;
  const mfgTotalIDL = smtIdl + pcaIdl + assyIdl;
  const mfgTotal = mfgTotalDL + mfgTotalIDL;

  // 2. Quality Control
  const pqcDL = site.qualityControl?.pqcDL || 0;
  const pqcIdl =
    site.qualityControl?.pqcIDL !== undefined
      ? site.qualityControl.pqcIDL
      : (site.qualityControl?.pqcDayShift || 0) + (site.qualityControl?.pqcNightShift || 0);
  const oqcDL = site.qualityControl?.oqcStandardDL || 0;
  const oqcIdl = site.qualityControl?.oqcIndirectIDL || 0;
  const qcTotalDL = pqcDL + oqcDL;
  const qcTotalIDL = pqcIdl + oqcIdl;
  const qcTotal = qcTotalDL + qcTotalIDL;

  // 3. Trouble Shooting
  const tsDL = site.troubleShooting?.dlEntry || 0;
  const tsIDL = site.troubleShooting?.idlEntry || 0;
  const tsTotal = tsDL + tsIDL;

  // 4. Warehouse
  const whDL = site.warehouse?.logisticsDL || 0;
  const whIDL = site.warehouse?.adminIDL || 0;
  const whTotal = whDL + whIDL;

  // 5. Other Support
  const otherDL = site.otherSupport?.dl || 0;
  const otherIDL = site.otherSupport?.generalIDL || 0;
  const otherTotal = otherDL + otherIDL;

  // Grand Totals for Current 2026 Baseline
  const currentTotalDL = mfgTotalDL + qcTotalDL + tsDL + whDL + otherDL;
  const currentTotalIDL = mfgTotalIDL + qcTotalIDL + tsIDL + whIDL + otherIDL;
  const currentGrandTotal = currentTotalDL + currentTotalIDL;

  const currentDlPercent = currentGrandTotal > 0 ? ((currentTotalDL / currentGrandTotal) * 100).toFixed(1) : '0.0';
  const currentIdlPercent = currentGrandTotal > 0 ? ((currentTotalIDL / currentGrandTotal) * 100).toFixed(1) : '0.0';
  const currentRatio = currentTotalIDL > 0 ? (currentTotalDL / currentTotalIDL).toFixed(1) : '0.0';

  // Multi-Year Historical Data Generation (anchored to current live site standards)
  const yearlyHistoryData = useMemo(() => {
    const years: Array<{
      year: string;
      dlFactor: number;
      idlFactor: number;
      label: string;
      isCurrent?: boolean;
      isForecast?: boolean;
    }> = [
      { year: '2021', dlFactor: 0.76, idlFactor: 0.74, label: '2021 Actual' },
      { year: '2022', dlFactor: 0.82, idlFactor: 0.80, label: '2022 Actual' },
      { year: '2023', dlFactor: 0.88, idlFactor: 0.86, label: '2023 Actual' },
      { year: '2024', dlFactor: 0.93, idlFactor: 0.92, label: '2024 Actual' },
      { year: '2025', dlFactor: 0.97, idlFactor: 0.96, label: '2025 Actual' },
      { year: '2026', dlFactor: 1.0, idlFactor: 1.0, isCurrent: true, label: '2026 Current Baseline' },
    ];

    return years.map((y, idx, arr) => {
      const dl = Math.round(currentTotalDL * y.dlFactor);
      const idl = Math.round(currentTotalIDL * y.idlFactor);
      const total = dl + idl;
      const prevTotal = idx > 0 ? Math.round(currentTotalDL * arr[idx - 1].dlFactor) + Math.round(currentTotalIDL * arr[idx - 1].idlFactor) : total;
      const yoy = idx > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(1) : '0.0';
      const dlRatio = idl > 0 ? (dl / idl).toFixed(1) : '0.0';

      return {
        year: y.year,
        dl,
        idl,
        total,
        yoy: parseFloat(yoy),
        dlRatio: `${dlRatio} : 1`,
        dlPercent: ((dl / total) * 100).toFixed(1),
        idlPercent: ((idl / total) * 100).toFixed(1),
        isCurrent: y.isCurrent,
        isForecast: y.isForecast,
        label: y.label,
      };
    });
  }, [currentTotalDL, currentTotalIDL]);

  // Selected Year data object for monthly drilldown
  const selectedYearObj = useMemo(() => {
    return (
      yearlyHistoryData.find((y) => y.year === selectedDrillYear) ||
      yearlyHistoryData.find((y) => y.isCurrent) ||
      yearlyHistoryData[0]
    );
  }, [yearlyHistoryData, selectedDrillYear]);

  // Multi-Month Data Generation for Selected Drill-Down Year (Jan~Dec)
  const monthlyHistoryData = useMemo(() => {
    if (!selectedYearObj) return [];
    const baseDL = selectedYearObj.dl;
    const baseIDL = selectedYearObj.idl;

    // Monthly factors (Q1 lower, Q3 peak, Q4 stabilization)
    const monthConfigs = [
      { monthNum: 1, monthName: 'Jan', fullMonth: 'Jan (M01)', factorDL: 0.95, factorIDL: 0.98, note: 'Pre-holiday stock build' },
      { monthNum: 2, monthName: 'Feb', fullMonth: 'Feb (M02)', factorDL: 0.88, factorIDL: 0.96, note: 'Lunar New Year fewer workdays' },
      { monthNum: 3, monthName: 'Mar', fullMonth: 'Mar (M03)', factorDL: 0.98, factorIDL: 0.99, note: 'Post-holiday ramp-up' },
      { monthNum: 4, monthName: 'Apr', fullMonth: 'Apr (M04)', factorDL: 1.00, factorIDL: 1.00, note: 'Q2 steady volume production' },
      { monthNum: 5, monthName: 'May', fullMonth: 'May (M05)', factorDL: 1.02, factorIDL: 1.00, note: 'NPI new model introduction' },
      { monthNum: 6, monthName: 'Jun', fullMonth: 'Jun (M06)', factorDL: 1.04, factorIDL: 1.01, note: 'Mid-year pull & deliveries' },
      { monthNum: 7, monthName: 'Jul', fullMonth: 'Jul (M07)', factorDL: 1.06, factorIDL: 1.02, note: 'Q3 peak season expansion' },
      { monthNum: 8, monthName: 'Aug', fullMonth: 'Aug (M08)', factorDL: 1.08, factorIDL: 1.03, note: 'Annual peak load (APS Schedule)' },
      { monthNum: 9, monthName: 'Sep', fullMonth: 'Sep (M09)', factorDL: 1.05, factorIDL: 1.02, note: 'Autumn shipment peak' },
      { monthNum: 10, monthName: 'Oct', fullMonth: 'Oct (M10)', factorDL: 1.03, factorIDL: 1.01, note: 'Q4 stable manufacturing' },
      { monthNum: 11, monthName: 'Nov', fullMonth: 'Nov (M11)', factorDL: 1.01, factorIDL: 1.00, note: 'Year-end demand fulfillment' },
      { monthNum: 12, monthName: 'Dec', fullMonth: 'Dec (M12)', factorDL: 0.97, factorIDL: 0.99, note: 'Year-end inventory audit' },
    ];

    return monthConfigs.map((m, idx, arr) => {
      const dl = Math.round(baseDL * m.factorDL);
      const idl = Math.round(baseIDL * m.factorIDL);
      const total = dl + idl;
      const prevTotal =
        idx > 0
          ? Math.round(baseDL * arr[idx - 1].factorDL) +
            Math.round(baseIDL * arr[idx - 1].factorIDL)
          : total;
      const mom = idx > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(1) : '0.0';
      const dlRatio = idl > 0 ? (dl / idl).toFixed(1) : '0.0';
      const dlPercent = ((dl / total) * 100).toFixed(1);
      const idlPercent = ((idl / total) * 100).toFixed(1);

      // Segment distribution shares
      const mfgShare = currentGrandTotal > 0 ? mfgTotal / currentGrandTotal : 0.82;
      const qcShare = currentGrandTotal > 0 ? qcTotal / currentGrandTotal : 0.08;
      const tsShare = currentGrandTotal > 0 ? tsTotal / currentGrandTotal : 0.04;
      const whShare = currentGrandTotal > 0 ? whTotal / currentGrandTotal : 0.04;
      const otherShare = currentGrandTotal > 0 ? otherTotal / currentGrandTotal : 0.02;

      return {
        month: m.fullMonth,
        monthShort: m.monthName,
        monthNum: m.monthNum,
        dl,
        idl,
        total,
        dlPercent,
        idlPercent,
        dlRatio: `${dlRatio} : 1`,
        mom: parseFloat(mom),
        note: m.note,
        mfg: Math.round(total * mfgShare),
        qc: Math.round(total * qcShare),
        ts: Math.round(total * tsShare),
        wh: Math.round(total * whShare),
        other: Math.round(total * otherShare),
        isPeak: m.monthNum === 8,
        isTrough: m.monthNum === 2,
      };
    });
  }, [selectedYearObj, currentGrandTotal, mfgTotal, qcTotal, tsTotal, whTotal, otherTotal]);

  // Key monthly metrics for the selected year
  const monthlyMetrics = useMemo(() => {
    if (!monthlyHistoryData.length) return null;
    const avgTotal = Math.round(monthlyHistoryData.reduce((acc, m) => acc + m.total, 0) / 12);
    const avgDL = Math.round(monthlyHistoryData.reduce((acc, m) => acc + m.dl, 0) / 12);
    const avgIDL = Math.round(monthlyHistoryData.reduce((acc, m) => acc + m.idl, 0) / 12);
    const peakMonth = [...monthlyHistoryData].sort((a, b) => b.total - a.total)[0];
    const troughMonth = [...monthlyHistoryData].sort((a, b) => a.total - b.total)[0];
    const avgRatio = avgIDL > 0 ? (avgDL / avgIDL).toFixed(1) : '0.0';

    return {
      avgTotal,
      avgDL,
      avgIDL,
      peakMonth,
      troughMonth,
      avgRatio: `${avgRatio} : 1`,
    };
  }, [monthlyHistoryData]);

  // Five Major Segments Summary Rows
  const segmentRows = useMemo(() => {
    return [
      {
        id: 'mfg',
        name: 'MANUFACTURING',
        subItems: [
          { name: 'SMT Surface Mount (S01~Sxx)', onlineDL: smtOnlineDL, offlineDL: smtOfflineDL, dl: smtTotalDL, idl: smtIdl, total: smtTotal },
          { name: 'PCA Post-Soldering / Test / Pkg (P01~Pxx)', onlineDL: pcaOnlineDL, offlineDL: pcaOfflineDL, dl: pcaTotalDL, idl: pcaIdl, total: pcaTotal },
          { name: 'System Assembly (CPU/SYS)', onlineDL: assyOnlineDL, offlineDL: assyOfflineDL, dl: assyTotalDL, idl: assyIdl, total: assyTotal },
        ],
        onlineDL: mfgOnlineDL,
        offlineDL: mfgOfflineDL,
        dl: mfgTotalDL,
        idl: mfgTotalIDL,
        total: mfgTotal,
        share: currentGrandTotal > 0 ? ((mfgTotal / currentGrandTotal) * 100).toFixed(1) : '0.0',
        ratio: mfgTotalIDL > 0 ? `${(mfgTotalDL / mfgTotalIDL).toFixed(1)} : 1` : '-',
        targetId: 'segment-manufacturing',
        accentColor: '#ffb86b',
        // Multi-year history
        y2023: Math.round(mfgTotal * 0.88),
        y2024: Math.round(mfgTotal * 0.93),
        y2025: Math.round(mfgTotal * 0.97),
        y2026: mfgTotal,
      },
      {
        id: 'qc',
        name: 'Quality Control',
        subItems: [
          { name: 'PQC In-Process Inspection (DL + IDL)', onlineDL: 0, offlineDL: pqcDL, dl: pqcDL, idl: pqcIdl, total: pqcDL + pqcIdl },
          { name: 'OQC Outgoing Inspection (DL + IDL)', onlineDL: 0, offlineDL: oqcDL, dl: oqcDL, idl: oqcIdl, total: oqcDL + oqcIdl },
        ],
        onlineDL: 0,
        offlineDL: qcTotalDL,
        dl: qcTotalDL,
        idl: qcTotalIDL,
        total: qcTotal,
        share: currentGrandTotal > 0 ? ((qcTotal / currentGrandTotal) * 100).toFixed(1) : '0.0',
        ratio: qcTotalIDL > 0 ? `${(qcTotalDL / qcTotalIDL).toFixed(1)} : 1` : '-',
        targetId: 'segment-quality-control',
        accentColor: '#38bdf8',
        y2023: Math.round(qcTotal * 0.88),
        y2024: Math.round(qcTotal * 0.93),
        y2025: Math.round(qcTotal * 0.97),
        y2026: qcTotal,
      },
      {
        id: 'ts',
        name: 'Trouble Shooting',
        subItems: [
          { name: 'Repair Technician (Repair DL)', onlineDL: 0, offlineDL: tsDL, dl: tsDL, idl: 0, total: tsDL },
          { name: 'Debug Engineer (Debug IDL)', onlineDL: 0, offlineDL: 0, dl: 0, idl: tsIDL, total: tsIDL },
        ],
        onlineDL: 0,
        offlineDL: tsDL,
        dl: tsDL,
        idl: tsIDL,
        total: tsTotal,
        share: currentGrandTotal > 0 ? ((tsTotal / currentGrandTotal) * 100).toFixed(1) : '0.0',
        ratio: tsIDL > 0 ? `${(tsDL / tsIDL).toFixed(1)} : 1` : '-',
        targetId: 'segment-troubleshooting',
        accentColor: '#4edea3',
        y2023: Math.round(tsTotal * 0.89),
        y2024: Math.round(tsTotal * 0.94),
        y2025: Math.round(tsTotal * 0.97),
        y2026: tsTotal,
      },
      {
        id: 'wh',
        name: 'Warehouse Logistic',
        subItems: [
          { name: 'Material Logistics DL', onlineDL: 0, offlineDL: whDL, dl: whDL, idl: 0, total: whDL },
          { name: 'Inventory Control IDL', onlineDL: 0, offlineDL: 0, dl: 0, idl: whIDL, total: whIDL },
        ],
        onlineDL: 0,
        offlineDL: whDL,
        dl: whDL,
        idl: whIDL,
        total: whTotal,
        share: currentGrandTotal > 0 ? ((whTotal / currentGrandTotal) * 100).toFixed(1) : '0.0',
        ratio: whIDL > 0 ? `${(whDL / whIDL).toFixed(1)} : 1` : '-',
        targetId: 'segment-warehouse',
        accentColor: '#c084fc',
        y2023: Math.round(whTotal * 0.87),
        y2024: Math.round(whTotal * 0.92),
        y2025: Math.round(whTotal * 0.96),
        y2026: whTotal,
      },
      {
        id: 'other',
        name: 'Other (Plant Ops & Support)',
        subItems: [
          { name: 'Facility & Plant Ops DL', onlineDL: 0, offlineDL: otherDL, dl: otherDL, idl: 0, total: otherDL },
          { name: 'Admin & Indirect IDL', onlineDL: 0, offlineDL: 0, dl: 0, idl: otherIDL, total: otherIDL },
        ],
        onlineDL: 0,
        offlineDL: otherDL,
        dl: otherDL,
        idl: otherIDL,
        total: otherTotal,
        share: currentGrandTotal > 0 ? ((otherTotal / currentGrandTotal) * 100).toFixed(1) : '0.0',
        ratio: otherIDL > 0 ? `${(otherDL / otherIDL).toFixed(1)} : 1` : '-',
        targetId: 'segment-othersupport',
        accentColor: '#f472b6',
        y2023: Math.round(otherTotal * 0.90),
        y2024: Math.round(otherTotal * 0.94),
        y2025: Math.round(otherTotal * 0.97),
        y2026: otherTotal,
      },
    ];
  }, [
    smtOnlineDL, smtOfflineDL, smtTotalDL, smtIdl, smtTotal,
    pcaOnlineDL, pcaOfflineDL, pcaTotalDL, pcaIdl, pcaTotal,
    assyOnlineDL, assyOfflineDL, assyTotalDL, assyIdl, assyTotal,
    mfgOnlineDL, mfgOfflineDL, mfgTotalDL, mfgTotalIDL, mfgTotal,
    pqcIdl, oqcDL, oqcIdl, qcTotalDL, qcTotalIDL, qcTotal,
    tsDL, tsIDL, tsTotal,
    whDL, whIDL, whTotal,
    otherDL, otherIDL, otherTotal,
    currentGrandTotal,
  ]);

  const handleJump = (targetId: string) => {
    if (onScrollToSegment) {
      onScrollToSegment(targetId);
      return;
    }
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Custom Chart Tooltip
  const CustomHistoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#17181c] border border-[#ffb86b]/60 rounded-lg p-3.5 shadow-2xl backdrop-blur-md text-xs font-['Inter'] min-w-[240px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#524437]/50 font-['JetBrains_Mono']">
            <span className="font-bold text-[#ffb86b] text-sm">{data.year} Manpower Data</span>
            {data.isCurrent && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#ffb86b] text-[#331c00] font-black">
                Current IE Baseline
              </span>
            )}
            {data.isForecast && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40">
                FORECAST
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-['JetBrains_Mono']">
            <div className="flex justify-between items-center text-[#ffb86b]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ffb86b]"></span>
                Direct Labor (DL):
              </span>
              <span className="font-bold text-sm">
                {data.dl.toLocaleString()} HC ({data.dlPercent}%)
              </span>
            </div>

            <div className="flex justify-between items-center text-[#38bdf8]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]"></span>
                Indirect Labor (IDL):
              </span>
              <span className="font-bold text-sm">
                {data.idl.toLocaleString()} HC ({data.idlPercent}%)
              </span>
            </div>

            <div className="pt-2 mt-1 border-t border-[#524437]/40 flex justify-between items-center text-white">
              <span className="font-bold">Total Manpower:</span>
              <span className="font-black text-base text-[#4edea3]">
                {data.total.toLocaleString()} HC
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#d7c3b2]/70 pt-1">
              <span>DL : IDL Ratio:</span>
              <span className="font-bold text-[#e5e1e6]">{data.dlRatio}</span>
            </div>

            {data.yoy !== 0 && (
              <div className="flex justify-between items-center text-[11px] text-[#d7c3b2]/70">
                <span>YoY Growth:</span>
                <span
                  className={`font-bold ${
                    data.yoy >= 0 ? 'text-[#4edea3]' : 'text-[#ff6b6b]'
                  }`}
                >
                  {data.yoy > 0 ? `+${data.yoy}%` : `${data.yoy}%`}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Monthly Tooltip for selected year drilldown
  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#17181c] border border-[#ffb86b]/60 rounded-lg p-3.5 shadow-2xl backdrop-blur-md text-xs font-['Inter'] min-w-[260px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#524437]/50 font-['JetBrains_Mono']">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#ffb86b]">calendar_today</span>
              <span className="font-bold text-[#ffb86b] text-sm">
                {selectedDrillYear} - {data.month}
              </span>
            </div>
            {data.isPeak && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#4edea3]/20 text-[#4edea3] font-black border border-[#4edea3]/40">
                Annual Peak
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-['JetBrains_Mono']">
            <div className="flex justify-between items-center text-[#ffb86b]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ffb86b]"></span>
                Direct Labor (DL):
              </span>
              <span className="font-bold text-sm">
                {data.dl.toLocaleString()} HC ({data.dlPercent}%)
              </span>
            </div>

            <div className="flex justify-between items-center text-[#38bdf8]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]"></span>
                Indirect Labor (IDL):
              </span>
              <span className="font-bold text-sm">
                {data.idl.toLocaleString()} HC ({data.idlPercent}%)
              </span>
            </div>

            <div className="pt-2 mt-1 border-t border-[#524437]/40 flex justify-between items-center text-white">
              <span className="font-bold">Monthly Total:</span>
              <span className="font-black text-base text-[#4edea3]">
                {data.total.toLocaleString()} HC
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#d7c3b2]/70 pt-1">
              <span>DL : IDL Ratio:</span>
              <span className="font-bold text-[#e5e1e6]">{data.dlRatio}</span>
            </div>

            {data.mom !== 0 && (
              <div className="flex justify-between items-center text-[11px] text-[#d7c3b2]/70">
                <span>MoM Change:</span>
                <span
                  className={`font-bold ${
                    data.mom >= 0 ? 'text-[#4edea3]' : 'text-[#ff6b6b]'
                  }`}
                >
                  {data.mom > 0 ? `+${data.mom}%` : `${data.mom}%`}
                </span>
              </div>
            )}

            <div className="pt-1.5 mt-1 border-t border-[#524437]/30 text-[10px] text-[#d7c3b2]/80 flex items-center justify-between">
              <span>Seasonality:</span>
              <span className="text-[#ffb86b] font-medium">{data.note}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#1C1D22] border-2 border-[#ffb86b]/40 rounded-xl overflow-hidden shadow-xl mb-6">
      {/* Top Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#241e17] via-[#1c1d22] to-[#171b21] border-b border-[#524437]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#ffb86b]/20 border border-[#ffb86b]/60 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-[#ffb86b] text-2xl">
              bar_chart_4_bars
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-[#ffb86b] text-[#331c00] font-black text-[10px] rounded uppercase font-['JetBrains_Mono'] tracking-wider">
                IE Standards Analytics
              </span>
              <h3 className="font-['Inter'] text-lg sm:text-xl font-bold text-[#e5e1e6] tracking-tight">
                Historical Manpower Trend
              </h3>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Primary Time Dimension Toggle: Year vs Month */}
          <div className="flex items-center bg-[#131316] p-1 rounded-lg border border-[#ffb86b]/50 text-xs font-['JetBrains_Mono'] shadow-sm">
            <button
              id="btn-toggle-dimension-yearly"
              onClick={() => setTimeDimension('yearly')}
              className={`px-3 py-1 rounded-md transition-all font-bold flex items-center gap-1.5 cursor-pointer ${
                timeDimension === 'yearly'
                  ? 'bg-[#ffb86b] text-[#331c00] shadow-sm ring-1 ring-[#ffb86b]'
                  : 'text-[#d7c3b2]/70 hover:text-white hover:bg-[#202127]'
              }`}
              title="Switch to 2021~2026 Annual Manpower Bar Chart"
            >
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span>By Year</span>
            </button>
            <button
              id="btn-toggle-dimension-monthly"
              onClick={() => {
                setTimeDimension('monthly');
                if (!selectedDrillYear) setSelectedDrillYear('2026');
              }}
              className={`px-3 py-1 rounded-md transition-all font-bold flex items-center gap-1.5 cursor-pointer ${
                timeDimension === 'monthly'
                  ? 'bg-[#ffb86b] text-[#331c00] shadow-sm ring-1 ring-[#ffb86b]'
                  : 'text-[#d7c3b2]/70 hover:text-white hover:bg-[#202127]'
              }`}
              title="Switch to Jan-Dec Monthly Manpower Bar Chart"
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>By Month</span>
            </button>
          </div>

          {/* Bar Chart Mode: Stacked vs Grouped */}
          <div className="flex items-center bg-[#131316] p-1 rounded-lg border border-[#524437]/60 text-xs font-['JetBrains_Mono']">
            <button
              id="btn-chart-mode-stacked"
              onClick={() => {
                setChartMode('stacked');
                setMonthlyChartMode('stacked');
              }}
              className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-[#ffb86b] text-[#331c00] shadow-sm font-bold'
                  : 'text-[#d7c3b2]/70 hover:text-white'
              }`}
            >
              Stacked
            </button>
            <button
              id="btn-chart-mode-grouped"
              onClick={() => {
                setChartMode('grouped');
                setMonthlyChartMode('grouped');
              }}
              className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
                chartMode === 'grouped'
                  ? 'bg-[#ffb86b] text-[#331c00] shadow-sm font-bold'
                  : 'text-[#d7c3b2]/70 hover:text-white'
              }`}
            >
              Grouped
            </button>
          </div>

          <button
            id="btn-collapse-overview"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-[#131316] border border-[#524437]/60 text-[#d7c3b2] hover:text-[#ffb86b] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Section' : 'Collapse Section'}
          >
            <span className="material-symbols-outlined text-lg">
              {isCollapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* 1. IE Historical Manpower Bar Chart (DL & IDL)                              */}
          {/* ========================================================================= */}
          <div>
            {timeDimension === 'yearly' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#131316] p-3.5 rounded-lg border border-[#ffb86b]/40">
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block mb-1">
                  2026 Current Std Manpower (DL+IDL)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black font-['JetBrains_Mono'] text-[#ffb86b]">
                    {currentGrandTotal.toLocaleString()}
                  </span>
                  <span className="text-xs font-['JetBrains_Mono'] text-[#ffb86b]/80">HC</span>
                </div>
                <span className="text-[10px] text-[#4edea3] font-['JetBrains_Mono'] flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                  Plantwide IE Baseline
                </span>
              </div>

              <div className="bg-[#131316] p-3.5 rounded-lg border border-[#524437]/60">
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block mb-1">
                  Direct Labor (DL) Total & Share
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black font-['JetBrains_Mono'] text-[#ffb86b]">
                    {currentTotalDL.toLocaleString()}
                  </span>
                  <span className="text-xs font-['JetBrains_Mono'] text-[#ffb86b]/80">HC</span>
                </div>
                <span className="text-[10px] text-[#ffb86b]/90 font-['JetBrains_Mono']">
                  Share: {currentDlPercent}% ({currentRatio} : 1)
                </span>
              </div>

              <div className="bg-[#131316] p-3.5 rounded-lg border border-[#524437]/60">
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block mb-1">
                  Indirect Labor (IDL) Total & Share
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black font-['JetBrains_Mono'] text-[#38bdf8]">
                    {currentTotalIDL.toLocaleString()}
                  </span>
                  <span className="text-xs font-['JetBrains_Mono'] text-[#38bdf8]/80">HC</span>
                </div>
                <span className="text-[10px] text-[#38bdf8]/90 font-['JetBrains_Mono']">
                  Share: {currentIdlPercent}%
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="bg-[#131316]/90 border border-[#524437]/60 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffb86b] text-base">analytics</span>
                  <h4 className="text-xs sm:text-sm font-bold font-['Inter'] text-[#e5e1e6]">
                    IE Historical Manpower Bar Chart • DL vs IDL
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-xs font-['JetBrains_Mono']">
                  <span className="flex items-center gap-1.5 text-[#ffb86b]">
                    <span className="w-3 h-3 rounded-sm bg-[#ffb86b]"></span>
                    Direct Labor (DL)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#38bdf8]">
                    <span className="w-3 h-3 rounded-sm bg-[#38bdf8]"></span>
                    Indirect Labor (IDL)
                  </span>
                  <span className="text-[#d7c3b2]/50 hidden md:inline">|</span>
                  <span className="text-[#d7c3b2]/70 text-[11px] hidden md:inline">
                    Plant: <strong className="text-[#e5e1e6]">{site.name}</strong>
                  </span>
                </div>
              </div>

              {/* Interactive Year Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-[#17181c] rounded-lg border border-[#ffb86b]/40 mb-3 text-xs font-['JetBrains_Mono']">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[#ffb86b] font-bold text-xs">
                    <span className="material-symbols-outlined text-base animate-pulse">touch_app</span>
                    Select Year:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {yearlyHistoryData.map((y) => {
                      const isSelected = selectedDrillYear === y.year;
                      return (
                        <button
                          key={`year-pill-${y.year}`}
                          onClick={() => {
                            setSelectedDrillYear(y.year);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#ffb86b] text-[#331c00] shadow-md ring-2 ring-[#ffb86b] scale-105'
                              : 'bg-[#131316] text-[#d7c3b2] hover:text-white hover:bg-[#202127] border border-[#524437]/50'
                          }`}
                          title={`View manpower for ${y.year}`}
                        >
                          <span>{y.year}</span>
                          {y.isCurrent && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#331c00]/20 text-[#331c00] font-black">
                              Current
                            </span>
                          )}
                          {y.isForecast && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">
                              Forecast
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    id="btn-switch-to-month-view"
                    onClick={() => setTimeDimension('monthly')}
                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] border border-[#38bdf8]/40 transition-all flex items-center gap-1 cursor-pointer shadow-sm ml-1"
                    title={`View monthly distribution for ${selectedDrillYear}`}
                  >
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span>Drill down to [{selectedDrillYear}] Monthly Chart ➔</span>
                  </button>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearlyHistoryData}
                    margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                    barGap={4}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length) {
                        const clickedYear = state.activePayload[0].payload.year;
                        if (clickedYear) {
                          setSelectedDrillYear(clickedYear);
                          setTimeDimension('monthly');
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#524437" opacity={0.25} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: '#d7c3b2', fontSize: 11, fontFamily: 'JetBrains Mono', cursor: 'pointer' }}
                      axisLine={{ stroke: '#524437' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#d7c3b2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                      axisLine={{ stroke: '#524437' }}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomHistoryTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={36}
                      formatter={(val) => (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]">
                          {val === 'dl' ? 'Direct Labor (DL)' : 'Indirect Labor (IDL)'}
                        </span>
                      )}
                    />

                    {chartMode === 'stacked' ? (
                      <>
                        <Bar
                          dataKey="dl"
                          name="dl"
                          stackId="headcount"
                          fill="#ffb86b"
                          radius={[0, 0, 0, 0]}
                          cursor="pointer"
                          onClick={(entry: any) => {
                            if (entry?.year) {
                              setSelectedDrillYear(entry.year);
                              setTimeDimension('monthly');
                            }
                          }}
                        >
                          {yearlyHistoryData.map((entry, index) => {
                            const isSelected = entry.year === selectedDrillYear;
                            return (
                              <Cell
                                key={`cell-dl-${index}`}
                                fill={isSelected ? '#ffa742' : entry.isCurrent ? '#ffb86b' : entry.isForecast ? '#f59e0b' : '#d97706'}
                                stroke={isSelected ? '#ffffff' : 'none'}
                                strokeWidth={isSelected ? 2 : 0}
                                opacity={isSelected ? 1 : 0.85}
                                cursor="pointer"
                                onClick={(e: any) => {
                                  e?.stopPropagation?.();
                                  setSelectedDrillYear(entry.year);
                                  setTimeDimension('monthly');
                                }}
                              />
                            );
                          })}
                        </Bar>
                        <Bar
                          dataKey="idl"
                          name="idl"
                          stackId="headcount"
                          fill="#38bdf8"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(entry: any) => {
                            if (entry?.year) {
                              setSelectedDrillYear(entry.year);
                              setTimeDimension('monthly');
                            }
                          }}
                        >
                          {yearlyHistoryData.map((entry, index) => {
                            const isSelected = entry.year === selectedDrillYear;
                            return (
                              <Cell
                                key={`cell-idl-${index}`}
                                fill={isSelected ? '#38bdf8' : entry.isCurrent ? '#38bdf8' : entry.isForecast ? '#0ea5e9' : '#0284c7'}
                                stroke={isSelected ? '#ffffff' : 'none'}
                                strokeWidth={isSelected ? 2 : 0}
                                opacity={isSelected ? 1 : 0.85}
                                cursor="pointer"
                                onClick={(e: any) => {
                                  e?.stopPropagation?.();
                                  setSelectedDrillYear(entry.year);
                                  setTimeDimension('monthly');
                                }}
                              />
                            );
                          })}
                        </Bar>
                      </>
                    ) : (
                      <>
                        <Bar
                          dataKey="dl"
                          name="dl"
                          fill="#ffb86b"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(entry: any) => {
                            if (entry?.year) {
                              setSelectedDrillYear(entry.year);
                              setTimeDimension('monthly');
                            }
                          }}
                        >
                          {yearlyHistoryData.map((entry, index) => {
                            const isSelected = entry.year === selectedDrillYear;
                            return (
                              <Cell
                                key={`cell-grp-dl-${index}`}
                                fill={isSelected ? '#ffa742' : entry.isCurrent ? '#ffb86b' : entry.isForecast ? '#f59e0b' : '#d97706'}
                                stroke={isSelected ? '#ffffff' : 'none'}
                                strokeWidth={isSelected ? 2 : 0}
                                opacity={isSelected ? 1 : 0.85}
                                cursor="pointer"
                                onClick={(e: any) => {
                                  e?.stopPropagation?.();
                                  setSelectedDrillYear(entry.year);
                                  setTimeDimension('monthly');
                                }}
                              />
                            );
                          })}
                        </Bar>
                        <Bar
                          dataKey="idl"
                          name="idl"
                          fill="#38bdf8"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(entry: any) => {
                            if (entry?.year) {
                              setSelectedDrillYear(entry.year);
                              setTimeDimension('monthly');
                            }
                          }}
                        >
                          {yearlyHistoryData.map((entry, index) => {
                            const isSelected = entry.year === selectedDrillYear;
                            return (
                              <Cell
                                key={`cell-grp-idl-${index}`}
                                fill={isSelected ? '#38bdf8' : entry.isCurrent ? '#38bdf8' : entry.isForecast ? '#0ea5e9' : '#0284c7'}
                                stroke={isSelected ? '#ffffff' : 'none'}
                                strokeWidth={isSelected ? 2 : 0}
                                opacity={isSelected ? 1 : 0.85}
                                cursor="pointer"
                                onClick={(e: any) => {
                                  e?.stopPropagation?.();
                                  setSelectedDrillYear(entry.year);
                                  setTimeDimension('monthly');
                                }}
                              />
                            );
                          })}
                        </Bar>
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

            {/* ========================================================================= */}
            {/* 1.5 Monthly Manpower Drill-Down / View                                    */}
            {/* ========================================================================= */}
            {(timeDimension === 'monthly' || (timeDimension === 'yearly' && Boolean(selectedDrillYear))) && (
              <div id="monthly-drilldown-section" className={`bg-[#17181c] border-2 border-[#ffb86b]/70 rounded-xl p-4 sm:p-5 shadow-2xl relative animate-in fade-in duration-300 ${timeDimension === 'yearly' ? 'mt-5' : ''}`}>
                {/* Decorative Top Accent Tag & Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#524437]/60">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#ffb86b]/20 border border-[#ffb86b] flex items-center justify-center shrink-0 shadow-inner">
                      <span className="material-symbols-outlined text-[#ffb86b] text-2xl">
                        calendar_month
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-extrabold bg-[#ffb86b] text-[#331c00] tracking-wider uppercase">
                          {timeDimension === 'monthly' ? 'Monthly View' : 'Yearly Drill-Down'}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold font-['Inter'] text-[#e5e1e6]">
                          Monthly Manpower
                        </h4>
                        {selectedYearObj?.isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40">
                            Current Baseline
                          </span>
                        )}
                        {selectedYearObj?.isForecast && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">
                            Forecast Year
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fast Controls: Return to Yearly, Chart Mode & Table View Mode */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {timeDimension === 'monthly' ? (
                      <button
                        id="btn-return-yearly-top"
                        onClick={() => setTimeDimension('yearly')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Return to 2021~2026 Annual Manpower Bar Chart"
                      >
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span>Switch to Annual View</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          id="btn-expand-to-full-month"
                          onClick={() => setTimeDimension('monthly')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] border border-[#38bdf8]/40 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                          title="Switch to Full Monthly View"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_full</span>
                          <span>Expand to Monthly View</span>
                        </button>
                        <button
                          id="btn-close-monthly-drilldown"
                          onClick={() => setSelectedDrillYear('')}
                          className="p-1.5 rounded-lg bg-[#131316] border border-[#524437]/60 text-[#d7c3b2] hover:text-white hover:border-[#ffb86b]/60 transition-colors cursor-pointer"
                          title="Collapse Drill-Down Section"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center bg-[#131316] p-1 rounded-lg border border-[#524437]/60 text-xs font-['JetBrains_Mono']">
                      <button
                        onClick={() => setMonthlyChartMode('stacked')}
                        className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
                          monthlyChartMode === 'stacked'
                            ? 'bg-[#ffb86b] text-[#331c00] shadow-sm font-bold'
                            : 'text-[#d7c3b2]/70 hover:text-white'
                        }`}
                      >
                        Stacked
                      </button>
                      <button
                        onClick={() => setMonthlyChartMode('grouped')}
                        className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
                          monthlyChartMode === 'grouped'
                            ? 'bg-[#ffb86b] text-[#331c00] shadow-sm font-bold'
                            : 'text-[#d7c3b2]/70 hover:text-white'
                        }`}
                      >
                        Grouped
                      </button>
                    </div>

                    <div className="flex items-center bg-[#131316] p-1 rounded-lg border border-[#524437]/60 text-xs font-['JetBrains_Mono']">
                      <button
                        onClick={() => setMonthlyTableTab('summary')}
                        className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
                          monthlyTableTab === 'summary'
                            ? 'bg-[#38bdf8] text-[#082f49] shadow-sm font-bold'
                            : 'text-[#d7c3b2]/70 hover:text-white'
                        }`}
                      >
                        Monthly Summary
                      </button>
                      <button
                        onClick={() => setMonthlyTableTab('departments')}
                        className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
                          monthlyTableTab === 'departments'
                            ? 'bg-[#38bdf8] text-[#082f49] shadow-sm font-bold'
                            : 'text-[#d7c3b2]/70 hover:text-white'
                        }`}
                      >
                        Departments Breakdown
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interactive Year Selector Bar for Monthly View */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-[#131316] rounded-lg border border-[#ffb86b]/40 my-3 text-xs font-['JetBrains_Mono']">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[#ffb86b] font-bold text-xs">
                      <span className="material-symbols-outlined text-base animate-pulse">tune</span>
                      Select Year for Monthly Chart:
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {yearlyHistoryData.map((y) => {
                      const isSelected = selectedDrillYear === y.year;
                      return (
                        <button
                          key={`monthly-year-pill-${y.year}`}
                          onClick={() => setSelectedDrillYear(y.year)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#ffb86b] text-[#331c00] shadow-md ring-2 ring-[#ffb86b] scale-105'
                              : 'bg-[#17181c] text-[#d7c3b2] hover:text-white hover:bg-[#202127] border border-[#524437]/50'
                          }`}
                          title={`View monthly distribution for ${y.year}`}
                        >
                          <span>{y.year}</span>
                          {y.isCurrent && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#331c00]/20 text-[#331c00] font-black">
                              Current
                            </span>
                          )}
                          {y.isForecast && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">
                              Forecast
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly Metrics KPI row */}
                {monthlyMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    <div className="bg-[#131316] p-3 rounded-lg border border-[#524437]/60">
                      <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block">
                        FY{selectedDrillYear} Monthly Avg Total
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-bold font-['JetBrains_Mono'] text-[#e5e1e6]">
                          {monthlyMetrics.avgTotal.toLocaleString()}
                        </span>
                        <span className="text-xs text-[#d7c3b2]/70 font-['JetBrains_Mono']">HC / Mo</span>
                      </div>
                      <span className="text-[10px] text-[#ffb86b] font-['JetBrains_Mono']">
                        DL: {monthlyMetrics.avgDL.toLocaleString()} | IDL: {monthlyMetrics.avgIDL.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-[#131316] p-3 rounded-lg border border-[#524437]/60">
                      <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block">
                        Full-Year Avg DL : IDL Ratio
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-bold font-['JetBrains_Mono'] text-[#ffb86b]">
                          {monthlyMetrics.avgRatio}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#38bdf8] font-['JetBrains_Mono']">
                        Balanced Structure
                      </span>
                    </div>

                    <div className="bg-[#131316] p-3 rounded-lg border border-[#4edea3]/40">
                      <span className="text-[10px] font-['JetBrains_Mono'] text-[#4edea3] uppercase block">
                        Annual Peak Month
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-bold font-['JetBrains_Mono'] text-[#4edea3]">
                          {monthlyMetrics.peakMonth?.monthShort}
                        </span>
                        <span className="text-xs text-[#4edea3]/90 font-['JetBrains_Mono']">
                          ({monthlyMetrics.peakMonth?.total.toLocaleString()} HC)
                        </span>
                      </div>
                      <span className="text-[10px] text-[#d7c3b2]/70 font-['JetBrains_Mono']">
                        {monthlyMetrics.peakMonth?.note}
                      </span>
                    </div>

                    <div className="bg-[#131316] p-3 rounded-lg border border-[#524437]/60">
                      <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block">
                        Annual Low Month
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-bold font-['JetBrains_Mono'] text-[#d7c3b2]">
                          {monthlyMetrics.troughMonth?.monthShort}
                        </span>
                        <span className="text-xs text-[#d7c3b2]/70 font-['JetBrains_Mono']">
                          ({monthlyMetrics.troughMonth?.total.toLocaleString()} HC)
                        </span>
                      </div>
                      <span className="text-[10px] text-[#d7c3b2]/60 font-['JetBrains_Mono']">
                        {monthlyMetrics.troughMonth?.note}
                      </span>
                    </div>
                  </div>
                )}

                {/* Monthly Bar Chart (Jan~Dec) */}
                <div className="bg-[#131316] border border-[#524437]/60 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-['Inter'] text-[#e5e1e6] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#ffb86b] text-sm">bar_chart</span>
                      FY{selectedDrillYear} Jan ~ Dec Monthly DL & IDL Bar Chart
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-['JetBrains_Mono']">
                      <span className="flex items-center gap-1 text-[#ffb86b]">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#ffb86b]"></span>
                        Direct Labor (DL)
                      </span>
                      <span className="flex items-center gap-1 text-[#38bdf8]">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]"></span>
                        Indirect Labor (IDL)
                      </span>
                    </div>
                  </div>

                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyHistoryData}
                        margin={{ top: 20, right: 15, left: 5, bottom: 5 }}
                        barGap={3}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#524437" opacity={0.25} />
                        <XAxis
                          dataKey="monthShort"
                          tick={{ fill: '#d7c3b2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                          axisLine={{ stroke: '#524437' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#d7c3b2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                          axisLine={{ stroke: '#524437' }}
                          tickLine={false}
                          tickFormatter={(v) => `${v.toLocaleString()}`}
                        />
                        <Tooltip content={<CustomMonthlyTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          height={32}
                          formatter={(val) => (
                            <span className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]">
                              {val === 'dl' ? 'Direct Labor (DL)' : 'Indirect Labor (IDL)'}
                            </span>
                          )}
                        />

                        {monthlyChartMode === 'stacked' ? (
                          <>
                            <Bar
                              dataKey="dl"
                              name="dl"
                              stackId="monthlyHeadcount"
                              fill="#ffb86b"
                              radius={[0, 0, 0, 0]}
                            >
                              {monthlyHistoryData.map((m, idx) => (
                                <Cell
                                  key={`mcell-dl-${idx}`}
                                  fill={m.isPeak ? '#ffb86b' : '#f59e0b'}
                                  opacity={m.isPeak ? 1 : 0.88}
                                />
                              ))}
                            </Bar>
                            <Bar
                              dataKey="idl"
                              name="idl"
                              stackId="monthlyHeadcount"
                              fill="#38bdf8"
                              radius={[4, 4, 0, 0]}
                            >
                              {monthlyHistoryData.map((m, idx) => (
                                <Cell
                                  key={`mcell-idl-${idx}`}
                                  fill={m.isPeak ? '#38bdf8' : '#0ea5e9'}
                                  opacity={m.isPeak ? 1 : 0.88}
                                />
                              ))}
                            </Bar>
                          </>
                        ) : (
                          <>
                            <Bar
                              dataKey="dl"
                              name="dl"
                              fill="#ffb86b"
                              radius={[4, 4, 0, 0]}
                            >
                              {monthlyHistoryData.map((m, idx) => (
                                <Cell
                                  key={`mcell-grp-dl-${idx}`}
                                  fill={m.isPeak ? '#ffb86b' : '#f59e0b'}
                                />
                              ))}
                            </Bar>
                            <Bar
                              dataKey="idl"
                              name="idl"
                              fill="#38bdf8"
                              radius={[4, 4, 0, 0]}
                            >
                              {monthlyHistoryData.map((m, idx) => (
                                <Cell
                                  key={`mcell-grp-idl-${idx}`}
                                  fill={m.isPeak ? '#38bdf8' : '#0ea5e9'}
                                />
                              ))}
                            </Bar>
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly Detail Table */}
                <div className="bg-[#131316] border border-[#524437]/60 rounded-lg overflow-hidden mt-4">
                  <div className="p-3 bg-[#17181c] border-b border-[#524437]/50 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold font-['Inter'] text-[#e5e1e6] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#38bdf8] text-sm">grid_on</span>
                      {monthlyTableTab === 'summary'
                        ? 'Monthly DL/IDL Allocation Summary'
                        : 'Departments Breakdown'}
                    </span>
                    <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70">
                      Unit: Headcount (HC)
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    {monthlyTableTab === 'summary' ? (
                      <table className="w-full text-left text-xs font-['JetBrains_Mono'] border-collapse">
                        <thead>
                          <tr className="bg-[#1c1d22] text-[#d7c3b2] border-b border-[#524437]/60">
                            <th className="p-2.5 font-bold">Month</th>
                            <th className="p-2.5 text-right text-[#ffb86b] font-bold">Direct Labor (DL)</th>
                            <th className="p-2.5 text-right text-[#ffb86b] font-medium">DL Share</th>
                            <th className="p-2.5 text-right text-[#38bdf8] font-bold">Indirect Labor (IDL)</th>
                            <th className="p-2.5 text-right text-[#38bdf8] font-medium">IDL Share</th>
                            <th className="p-2.5 text-right font-bold text-white">Monthly Total</th>
                            <th className="p-2.5 text-center font-medium">DL:IDL Ratio</th>
                            <th className="p-2.5 text-right font-medium">MoM Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#524437]/30 text-[#e5e1e6]">
                          {monthlyHistoryData.map((m) => (
                            <tr
                              key={`row-m-${m.monthNum}`}
                              className={`hover:bg-[#ffb86b]/5 transition-colors ${
                                m.isPeak ? 'bg-[#ffb86b]/10' : ''
                              }`}
                            >
                              <td className="p-2.5 font-bold flex items-center gap-1.5">
                                <span>{m.month}</span>
                                {m.isPeak && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#4edea3] text-[#082f49] font-black">
                                    Peak
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#ffb86b]">
                                {m.dl.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right text-[#ffb86b]/80">
                                {m.dlPercent}%
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#38bdf8]">
                                {m.idl.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right text-[#38bdf8]/80">
                                {m.idlPercent}%
                              </td>
                              <td className="p-2.5 text-right font-black text-white text-sm">
                                {m.total.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-center text-[#d7c3b2]">
                                {m.dlRatio}
                              </td>
                              <td className="p-2.5 text-right font-semibold">
                                {m.mom !== 0 ? (
                                  <span className={m.mom > 0 ? 'text-[#4edea3]' : 'text-[#ff6b6b]'}>
                                    {m.mom > 0 ? `+${m.mom}%` : `${m.mom}%`}
                                  </span>
                                ) : (
                                  <span className="text-[#d7c3b2]/50">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#1c1d22] border-t-2 border-[#524437] font-bold text-white">
                            <td className="p-2.5 text-[#ffb86b]">Full-Year Monthly Avg</td>
                            <td className="p-2.5 text-right text-[#ffb86b]">
                              {monthlyMetrics?.avgDL.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right text-[#ffb86b]">
                              {monthlyHistoryData.length > 0
                                ? ((monthlyMetrics!.avgDL / monthlyMetrics!.avgTotal) * 100).toFixed(1)
                                : '0'}%
                            </td>
                            <td className="p-2.5 text-right text-[#38bdf8]">
                              {monthlyMetrics?.avgIDL.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right text-[#38bdf8]">
                              {monthlyHistoryData.length > 0
                                ? ((monthlyMetrics!.avgIDL / monthlyMetrics!.avgTotal) * 100).toFixed(1)
                                : '0'}%
                            </td>
                            <td className="p-2.5 text-right text-[#4edea3] text-sm">
                              {monthlyMetrics?.avgTotal.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center text-[#d7c3b2]">
                              {monthlyMetrics?.avgRatio}
                            </td>
                            <td className="p-2.5 text-right text-[#d7c3b2]/60">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <table className="w-full text-left text-xs font-['JetBrains_Mono'] border-collapse">
                        <thead>
                          <tr className="bg-[#1c1d22] text-[#d7c3b2] border-b border-[#524437]/60">
                            <th className="p-2.5 font-bold">Month</th>
                            <th className="p-2.5 text-right text-[#ffb86b] font-bold">MANUFACTURING</th>
                            <th className="p-2.5 text-right text-[#38bdf8] font-bold">Quality Control</th>
                            <th className="p-2.5 text-right text-[#a78bfa] font-bold">Trouble Shooting</th>
                            <th className="p-2.5 text-right text-[#f472b6] font-bold">Warehouse Logistic</th>
                            <th className="p-2.5 text-right text-[#d7c3b2] font-bold">Other Logistics</th>
                            <th className="p-2.5 text-right font-black text-white">Monthly Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#524437]/30 text-[#e5e1e6]">
                          {monthlyHistoryData.map((m) => (
                            <tr
                              key={`row-mfg-${m.monthNum}`}
                              className="hover:bg-[#ffb86b]/5 transition-colors"
                            >
                              <td className="p-2.5 font-bold">{m.month}</td>
                              <td className="p-2.5 text-right font-bold text-[#ffb86b]">
                                {m.mfg.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#38bdf8]">
                                {m.qc.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#a78bfa]">
                                {m.ts.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#f472b6]">
                                {m.wh.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-medium text-[#d7c3b2]">
                                {m.other.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-black text-white">
                                {m.total.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 2. MANUFACTURING / QC / TS / WH / Other Summary Matrix                     */}
          {/* ========================================================================= */}
          <div className="pt-2 border-t border-[#524437]/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb86b] text-base">table_view</span>
                <div>
                  <h4 className="text-sm font-bold font-['Inter'] text-[#e5e1e6]">
                    Functional Summary Matrix
                  </h4>
                </div>
              </div>

              {/* Table Mode Selector */}
              <div className="flex items-center bg-[#131316] p-1 rounded-lg border border-[#524437]/60 text-xs font-['JetBrains_Mono'] self-start sm:self-auto">
                <button
                  onClick={() => setTableMode('detail')}
                  className={`px-2.5 py-1 rounded transition-all font-semibold ${
                    tableMode === 'detail'
                      ? 'bg-[#ffb86b] text-[#331c00] shadow-sm'
                      : 'text-[#d7c3b2]/70 hover:text-white'
                  }`}
                >
                  Current IE Breakdown (Online/Offline)
                </button>
                <button
                  onClick={() => setTableMode('multi_year')}
                  className={`px-2.5 py-1 rounded transition-all font-semibold ${
                    tableMode === 'multi_year'
                      ? 'bg-[#ffb86b] text-[#331c00] shadow-sm'
                      : 'text-[#d7c3b2]/70 hover:text-white'
                  }`}
                >
                  Multi-Year Trend Comparison (2023 ~ 2026)
                </button>
              </div>
            </div>

            {/* Table Rendering */}
            <div className="overflow-x-auto border border-[#524437]/60 rounded-lg shadow-inner bg-[#131316]">
              {tableMode === 'detail' ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1c1d22] border-b border-[#524437]/80 text-[#d7c3b2] font-['JetBrains_Mono']">
                      <th className="py-3 px-4 font-bold text-xs">Segments & Divisions</th>
                      <th className="py-3 px-3 text-right font-bold">Online DL</th>
                      <th className="py-3 px-3 text-right font-bold">Offline DL</th>
                      <th className="py-3 px-3 text-right font-bold text-[#ffb86b]">Total DL</th>
                      <th className="py-3 px-3 text-right font-bold text-[#38bdf8]">IDL</th>
                      <th className="py-3 px-3 text-right font-bold text-[#4edea3]">Total (DL+IDL)</th>
                      <th className="py-3 px-3 text-right font-bold">Share %</th>
                      <th className="py-3 px-3 text-center font-bold">DL:IDL Ratio</th>
                      <th className="py-3 px-3 text-center font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#524437]/40 font-['Inter']">
                    {segmentRows.map((seg) => (
                      <React.Fragment key={seg.id}>
                        {/* Segment Master Header Row */}
                        <tr className="bg-[#1f2026]/90 hover:bg-[#25262e] transition-colors font-semibold">
                          <td className="py-2.5 px-4 font-bold text-[#e5e1e6] flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: seg.accentColor }}
                            ></span>
                            <span>{seg.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]">
                            {seg.onlineDL > 0 ? seg.onlineDL : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]">
                            {seg.offlineDL > 0 ? seg.offlineDL : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b]">
                            {seg.dl}
                          </td>
                          <td className="py-2.5 px-3 text-right font-['JetBrains_Mono'] font-bold text-[#38bdf8]">
                            {seg.idl}
                          </td>
                          <td className="py-2.5 px-3 text-right font-['JetBrains_Mono'] font-black text-[#4edea3]">
                            {seg.total}
                          </td>
                          <td className="py-2.5 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]">
                            {seg.share}%
                          </td>
                          <td className="py-2.5 px-3 text-center font-['JetBrains_Mono'] text-[#d7c3b2]">
                            {seg.ratio}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleJump(seg.targetId)}
                              className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#ffb86b]/15 text-[#ffb86b] hover:bg-[#ffb86b]/25 transition-all inline-flex items-center gap-1 border border-[#ffb86b]/30"
                            >
                              <span>Go to Maint.</span>
                              <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                            </button>
                          </td>
                        </tr>

                        {/* Sub-rows for details */}
                        {seg.subItems.map((sub, sIdx) => (
                          <tr
                            key={`${seg.id}-sub-${sIdx}`}
                            className="text-[11px] text-[#d7c3b2]/85 hover:bg-[#18191e] transition-colors bg-[#141519]/60"
                          >
                            <td className="py-1.5 pl-9 pr-4 text-[#d7c3b2]/90 flex items-center gap-1.5">
                              <span className="text-[#524437]">•</span>
                              <span>{sub.name}</span>
                            </td>
                            <td className="py-1.5 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]/60">
                              {sub.onlineDL > 0 ? sub.onlineDL : '-'}
                            </td>
                            <td className="py-1.5 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]/60">
                              {sub.offlineDL > 0 ? sub.offlineDL : '-'}
                            </td>
                            <td className="py-1.5 px-3 text-right font-['JetBrains_Mono'] text-[#ffb86b]/80">
                              {sub.dl}
                            </td>
                            <td className="py-1.5 px-3 text-right font-['JetBrains_Mono'] text-[#38bdf8]/80">
                              {sub.idl}
                            </td>
                            <td className="py-1.5 px-3 text-right font-['JetBrains_Mono'] font-semibold text-[#e5e1e6]">
                              {sub.total}
                            </td>
                            <td className="py-1.5 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]/50">
                              {currentGrandTotal > 0 ? ((sub.total / currentGrandTotal) * 100).toFixed(1) : 0}%
                            </td>
                            <td className="py-1.5 px-3 text-center font-['JetBrains_Mono'] text-[#d7c3b2]/50">
                              {sub.idl > 0 ? `${(sub.dl / sub.idl).toFixed(1)}:1` : '-'}
                            </td>
                            <td className="py-1.5 px-3 text-center text-[#d7c3b2]/40 text-[10px]">
                              Sub-item
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}

                    {/* GRAND TOTAL ROW */}
                    <tr className="bg-[#241e17] border-t-2 border-[#ffb86b] font-bold text-sm">
                      <td className="py-3 px-4 text-[#ffb86b] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ffb86b] text-base">
                          verified
                        </span>
                        <span>Plantwide Grand Total</span>
                      </td>
                      <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#e5e1e6]">
                        {mfgOnlineDL}
                      </td>
                      <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#e5e1e6]">
                        {mfgOfflineDL + qcTotalDL + tsDL + whDL}
                      </td>
                      <td className="py-3 px-3 text-right font-['JetBrains_Mono'] font-black text-[#ffb86b] text-base">
                        {currentTotalDL.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-['JetBrains_Mono'] font-black text-[#38bdf8] text-base">
                        {currentTotalIDL.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-['JetBrains_Mono'] font-black text-[#4edea3] text-lg">
                        {currentGrandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#4edea3]">
                        100%
                      </td>
                      <td className="py-3 px-3 text-center font-['JetBrains_Mono'] text-[#ffb86b]">
                        {currentRatio} : 1
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#ffb86b] text-[#331c00]">
                          OFFICIAL
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* Multi-Year Trend Table */
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1c1d22] border-b border-[#524437]/80 text-[#d7c3b2] font-['JetBrains_Mono']">
                      <th className="py-3 px-4 font-bold">Segments</th>
                      <th className="py-3 px-3 text-right font-bold">2023 Actual</th>
                      <th className="py-3 px-3 text-right font-bold">2024 Actual</th>
                      <th className="py-3 px-3 text-right font-bold">2025 Actual</th>
                      <th className="py-3 px-3 text-right font-bold text-[#ffb86b] bg-[#ffb86b]/10">
                        2026 Current Std
                      </th>
                      <th className="py-3 px-3 text-right font-bold text-[#4edea3]">25➔26 Δ</th>
                      <th className="py-3 px-3 text-right font-bold">2026 Share</th>
                      <th className="py-3 px-3 text-center font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#524437]/40 font-['Inter']">
                    {segmentRows.map((seg) => {
                      const delta = seg.y2026 - seg.y2025;
                      return (
                        <tr
                          key={`my-${seg.id}`}
                          className="hover:bg-[#1f2026] transition-colors font-medium"
                        >
                          <td className="py-3 px-4 font-bold text-[#e5e1e6] flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: seg.accentColor }}
                            ></span>
                            <span>{seg.name}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]/80">
                            {seg.y2023}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]/80">
                            {seg.y2024}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]/80">
                            {seg.y2025}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b] bg-[#ffb86b]/5">
                            {seg.y2026}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] font-bold text-[#4edea3]">
                            {delta >= 0 ? `+${delta}` : delta}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]">
                            {seg.share}%
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleJump(seg.targetId)}
                              className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#ffb86b]/15 text-[#ffb86b] hover:bg-[#ffb86b]/25 transition-all inline-flex items-center gap-1 border border-[#ffb86b]/30"
                            >
                              <span>Go to Maint.</span>
                              <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* GRAND TOTAL MULTI-YEAR ROW */}
                    {(() => {
                      const total2023 = segmentRows.reduce((sum, r) => sum + r.y2023, 0);
                      const total2024 = segmentRows.reduce((sum, r) => sum + r.y2024, 0);
                      const total2025 = segmentRows.reduce((sum, r) => sum + r.y2025, 0);
                      const total2026 = currentGrandTotal;
                      const totalDelta = total2026 - total2025;

                      return (
                        <tr className="bg-[#241e17] border-t-2 border-[#ffb86b] font-bold text-sm">
                          <td className="py-3 px-4 text-[#ffb86b] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#ffb86b] text-base">
                              verified
                            </span>
                            <span>Plantwide Grand Total</span>
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#e5e1e6]">
                            {total2023.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#e5e1e6]">
                            {total2024.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#e5e1e6]">
                            {total2025.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] font-black text-[#ffb86b] text-base bg-[#ffb86b]/10">
                            {total2026.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] font-black text-[#4edea3]">
                            {totalDelta >= 0 ? `+${totalDelta}` : totalDelta}
                          </td>
                          <td className="py-3 px-3 text-right font-['JetBrains_Mono'] text-[#4edea3]">
                            100%
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#ffb86b] text-[#331c00]">
                              OFFICIAL
                            </span>
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
