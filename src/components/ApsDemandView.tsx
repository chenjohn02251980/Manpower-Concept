import React, { useState } from 'react';
import { SiteData, TimePeriod } from '../types';
import { SmtPcaContinuityView } from './SmtPcaContinuityView';
import {
  generateMonthlyApsPlan,
  getNextMonthPeriod,
  getDatesForMonth,
  getLineSummariesForMonth,
  getMonthDailyStats,
  getLineIeStandardDL,
  ApsLineSummary,
  AUGUST_2026_DATES,
  AUGUST_LINE_SUMMARIES,
} from '../utils/apsSchedule';

interface ApsDemandViewProps {
  site: SiteData;
  timePeriod: TimePeriod;
  selectedYear: number;
  selectedMonth: number;
  onNavigateToForecast: () => void;
  onChangeMonth?: (month: number) => void;
  onSelectSite?: (siteId: string) => void;
}

export const ApsDemandView: React.FC<ApsDemandViewProps> = ({
  site,
  timePeriod,
  selectedYear,
  selectedMonth,
  onNavigateToForecast,
  onChangeMonth,
  onSelectSite,
}) => {
  const [activeProcessFilter, setActiveProcessFilter] = useState<
    'ALL' | 'SMT' | 'PCA' | 'System Assembly'
  >('ALL');

  // Process Section Selector: SMT ➔ PCA Continuity vs System Assembly
  const [processSection, setProcessSection] = useState<'SMT_PCA_CONTINUITY' | 'SYSTEM_ASSEMBLY'>(
    'SMT_PCA_CONTINUITY'
  );

  // Interactive shift overrides for simulation
  const [shiftOverrides, setShiftOverrides] = useState<Record<string, number>>({});

  // Master dates for currently selected month (Jan - Aug 2026 System Assembly)
  const currentMonthDates = getDatesForMonth(selectedYear, selectedMonth);
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>('');

  // Safe selected date resolution for current month
  const selectedDate = currentMonthDates.includes(selectedCustomDate)
    ? selectedCustomDate
    : (currentMonthDates.find((d) => d.endsWith('/07') || d.endsWith('/05') || d.endsWith('/03') || d.endsWith('/08')) || currentMonthDates[0]);

  const [plantFilter, setPlantFilter] = useState<'ALL' | 'TP08' | 'TP15' | 'TP16'>('ALL');
  const [matrixViewTab, setMatrixViewTab] = useState<'DAILY_DETAIL' | 'MONTH_GRID'>('DAILY_DETAIL');

  const { targetYear, targetMonth } = getNextMonthPeriod(selectedYear, selectedMonth);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const planMonthName = monthNames[selectedMonth - 1] || `Month ${selectedMonth}`;
  const targetMonthName = monthNames[targetMonth - 1] || `Month ${targetMonth}`;

  // Compute baseline plan
  const basePlan = generateMonthlyApsPlan(site, selectedYear, selectedMonth);

  // Baseline online DL from un-overridden shifts
  const baselineOnlineDL = basePlan.lines.reduce(
    (sum, l) => sum + l.ieStdDLPerShift * (l.dailyShifts || 1),
    0
  );

  // Apply any temporary shift overrides to the plan lines
  const linesWithOverrides = basePlan.lines.map((l) => {
    const currentShift = shiftOverrides[l.lineId] ?? l.dailyShifts;
    const dailyRequiredDL = l.ieStdDLPerShift * currentShift;
    return {
      ...l,
      dailyShifts: currentShift,
      dailyRequiredDL,
    };
  });

  const smtOnlineDL = linesWithOverrides
    .filter((l) => l.process === 'SMT')
    .reduce((sum, l) => sum + l.dailyRequiredDL, 0);

  const pcaOnlineDL = linesWithOverrides
    .filter((l) => l.process === 'PCA')
    .reduce((sum, l) => sum + l.dailyRequiredDL, 0);

  const assemblyOnlineDL = linesWithOverrides
    .filter((l) => l.process === 'System Assembly')
    .reduce((sum, l) => sum + l.dailyRequiredDL, 0);

  const totalOnlineDL = smtOnlineDL + pcaOnlineDL + assemblyOnlineDL;

  // Capacity ratio based on online line load (scales with capacity demand)
  const capacityRatio = baselineOnlineDL > 0 ? totalOnlineDL / baselineOnlineDL : 1;

  // Dynamic Offline DL: scales with capacity demand (higher production activity = proportionally higher offline DL support)
  const totalOfflineDL = Math.round(basePlan.totalOfflineDL * capacityRatio);

  // Dynamic Support DL: PQC/OQC inspection, WH material handling, TS DL scale with capacity
  const totalSupportDL = Math.round(basePlan.totalSupportDL * capacityRatio);

  // Total DL = Online DL + Offline DL + Support DL (all scale with capacity changes)
  const totalApsDemandDL = totalOnlineDL + totalOfflineDL + totalSupportDL;

  // Fixed IDL (Indirect Labor is CONSTANT: does NOT vary with capacity increases or decreases)
  const fixedIDL = basePlan.fixedIDL;
  const mfgIDL = basePlan.mfgIDL;
  const supportIDL = basePlan.supportIDL;

  // Total Demand Headcount = Variable DL + Fixed IDL
  const totalDemandHeadcount = totalApsDemandDL + fixedIDL;

  const filteredLines = linesWithOverrides.filter((l) => {
    if (activeProcessFilter === 'ALL') return true;
    return l.process === activeProcessFilter;
  });

  const handleShiftChange = (lineId: string, newShift: number) => {
    setShiftOverrides((prev) => ({
      ...prev,
      [lineId]: newShift,
    }));
  };

  const handleResetShifts = () => {
    setShiftOverrides({});
  };

  // Month Daily Stats for selected date
  const currentDayStats = getMonthDailyStats(site, selectedMonth, selectedDate, plantFilter);

  // Filtered Month Line Summaries for selected month
  const monthLineSummaries = getLineSummariesForMonth(selectedMonth);
  const filteredMonthLines = monthLineSummaries.filter((l) => {
    if (plantFilter === 'ALL') return true;
    return l.plant === plantFilter;
  });

  const totalMonthPlanQty = filteredMonthLines.reduce((sum, l) => sum + l.totalPlanQty, 0);
  const totalMonthScheduledQty = filteredMonthLines.reduce((sum, l) => sum + l.totalScheduledQty, 0);

  return (
    <div className="space-y-6 pb-8 select-none">
      {/* 0. Primary APS Process Domain Switcher */}
      <div className="bg-[#1C1D22] border border-[#524437]/70 rounded-xl p-3 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ffb86b] text-lg">view_in_ar</span>
          <span className="text-xs font-['JetBrains_Mono'] text-[#e5e1e6] font-bold">
            APS Process Schedule Domain:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setProcessSection('SMT_PCA_CONTINUITY')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-['JetBrains_Mono'] font-bold transition-all flex items-center justify-center gap-2 ${
              processSection === 'SMT_PCA_CONTINUITY'
                ? 'bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-[#082f49] shadow-lg ring-2 ring-[#38bdf8]/40'
                : 'bg-[#131316] text-[#d7c3b2]/80 hover:text-white border border-[#524437]/60'
            }`}
          >
            <span className="material-symbols-outlined text-sm">link</span>
            <span>SMT ➔ PCA Continuous Process</span>
            <span
              className={`px-1.5 py-0.2 text-[9px] rounded font-extrabold uppercase ${
                processSection === 'SMT_PCA_CONTINUITY'
                  ? 'bg-[#082f49]/20 text-[#082f49]'
                  : 'bg-[#38bdf8]/20 text-[#38bdf8]'
              }`}
            >
              August Live Simulation
            </span>
          </button>

          <button
            onClick={() => setProcessSection('SYSTEM_ASSEMBLY')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-['JetBrains_Mono'] font-bold transition-all flex items-center justify-center gap-2 ${
              processSection === 'SYSTEM_ASSEMBLY'
                ? 'bg-[#ffb86b] text-[#492900] shadow-lg ring-2 ring-[#ffb86b]/40'
                : 'bg-[#131316] text-[#d7c3b2]/80 hover:text-white border border-[#524437]/60'
            }`}
          >
            <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
            <span>SYSTEM ASSEMBLY (CPU & RACK)</span>
            <span
              className={`px-1.5 py-0.2 text-[9px] rounded font-extrabold uppercase ${
                processSection === 'SYSTEM_ASSEMBLY'
                  ? 'bg-[#492900]/20 text-[#492900]'
                  : 'bg-[#ffb86b]/20 text-[#ffb86b]'
              }`}
            >
              Jan–Aug APS Actual
            </span>
          </button>
        </div>
      </div>

      {/* Conditional Content based on selected Process Domain */}
      {processSection === 'SMT_PCA_CONTINUITY' ? (
        <SmtPcaContinuityView
          site={site}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onNavigateToForecast={onNavigateToForecast}
          onSelectSite={onSelectSite}
        />
      ) : (
        <>
      {/* Interactive Month Switcher (Jan to Dec, with 1-8 highlighted) */}
      {onChangeMonth && (
        <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/80 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#ffb86b]">date_range</span>
            Switch Schedule Month:
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const isSelected = selectedMonth === m;
              const isApsMaster = m <= 8;
              const mShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return (
                <button
                  key={m}
                  onClick={() => onChangeMonth(m)}
                  className={`px-2.5 py-1 text-xs font-['JetBrains_Mono'] rounded transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#ffb86b] text-[#492900] font-bold shadow-md ring-1 ring-[#ffb86b]'
                      : isApsMaster
                      ? 'bg-[#131316] text-[#e5e1e6] hover:bg-[#201f23] border border-[#524437]/60'
                      : 'text-[#d7c3b2]/60 hover:text-[#e5e1e6] hover:bg-[#201f23]'
                  }`}
                >
                  <span>{mShortNames[m - 1]}</span>
                  {isApsMaster && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        isSelected
                          ? 'bg-[#492900]/20 text-[#492900]'
                          : 'bg-[#4edea3]/20 text-[#4edea3]'
                      }`}
                    >
                      APS
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Core Logic Linkage Indicator Bar */}
      <div className="bg-[#1C1D22] border border-[#ffb86b]/40 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#ffb86b]/15 border border-[#ffb86b]/30 flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[#ffb86b] text-xl">sync_alt</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-['Inter'] text-sm font-bold text-[#e5e1e6]">
                IE Standard ➔ APS Demand Linkage Architecture
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#ffb86b]/20 text-[#ffb86b] border border-[#ffb86b]/30">
                SYSTEM CORE RULE
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#d7c3b2]/85 mt-1 leading-relaxed">
              IE Standard sets monthly standard manpower per line & shift (Online/Offline DL + IDL). In APS Demand, <strong className="text-[#ffb86b]">DL (Online & Offline) scales dynamically with capacity requirements & active shifts</strong>, whereas <strong className="text-[#5de6ff]">IDL remains strictly fixed (constant, unaffected by capacity fluctuations)</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={onNavigateToForecast}
            className="px-3 py-1.5 rounded-lg text-xs font-['JetBrains_Mono'] font-bold bg-[#131316] text-[#ffb86b] hover:bg-[#ffb86b]/15 border border-[#ffb86b]/40 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Switch to IE Standard to configure line DL & IDL baselines"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>MANAGE IE BASELINE</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Variable DL */}
        <div className="bg-[#1C1D22] border border-[#ffb86b]/40 p-4.5 rounded-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#ffb86b] uppercase font-bold block">
                {planMonthName} Demand DL
              </span>
              <span className="text-[9px] text-[#4edea3] font-['JetBrains_Mono'] font-bold">
                ⚡ Scales with Capacity
              </span>
            </div>
            <span className="material-symbols-outlined text-lg text-[#ffb86b]">
              precision_manufacturing
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-['JetBrains_Mono'] text-[#ffb86b] mt-2">
            {totalApsDemandDL.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            Online {totalOnlineDL} + Offline {totalOfflineDL} + Supp {totalSupportDL}
          </p>
        </div>

        {/* Fixed IDL (Constant) */}
        <div className="bg-[#1C1D22] border border-[#5de6ff]/40 p-4.5 rounded-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#5de6ff] uppercase font-bold block">
                Fixed Plant IDL
              </span>
              <span className="text-[9px] text-[#5de6ff] font-['JetBrains_Mono'] font-bold">
                🔒 Constant • Capacity Independent
              </span>
            </div>
            <span className="material-symbols-outlined text-lg text-[#5de6ff]">
              support_agent
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-['JetBrains_Mono'] text-[#5de6ff] mt-2">
            {fixedIDL.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">IDL</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            MFG IDL: {mfgIDL} | Support IDL: {supportIDL}
          </p>
        </div>

        {/* Total Demand Headcount */}
        <div className="bg-[#1C1D22] border border-[#4edea3]/40 p-4.5 rounded-lg relative overflow-hidden ring-1 ring-[#4edea3]/30">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#4edea3] uppercase font-bold block">
                Total Headcount Demand
              </span>
              <span className="text-[9px] text-[#d7c3b2]/70 font-['JetBrains_Mono']">
                Variable DL + Fixed IDL
              </span>
            </div>
            <span className="material-symbols-outlined text-lg text-[#4edea3]">
              groups
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-['JetBrains_Mono'] text-[#e5e1e6] mt-2">
            {totalDemandHeadcount.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#4edea3]">HC</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            {totalApsDemandDL} DL (Variable) + {fixedIDL} IDL (Fixed)
          </p>
        </div>

        {/* Online Manufacturing DL */}
        <div className="bg-[#1C1D22] border border-[#524437]/60 p-4.5 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/80 uppercase block">
                Online Direct Labor
              </span>
              <span className="text-[9px] text-[#d7c3b2]/60 font-['JetBrains_Mono']">
                SMT • PCA • Assembly
              </span>
            </div>
            <span className="material-symbols-outlined text-lg text-[#5de6ff]">factory</span>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-['JetBrains_Mono'] text-[#5de6ff] mt-2">
            {totalOnlineDL.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            SMT {smtOnlineDL} | PCA {pcaOnlineDL} | Assy {assemblyOnlineDL}
          </p>
        </div>

        {/* Total Scheduled Daily Shifts & Volume */}
        <div className="bg-[#1C1D22] border border-[#524437]/60 p-4.5 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/80 uppercase block">
                Scheduled Shifts & Volume
              </span>
              <span className="text-[9px] text-[#a78bfa] font-['JetBrains_Mono'] font-bold">
                {totalMonthPlanQty.toLocaleString()} Units Plan
              </span>
            </div>
            <span className="material-symbols-outlined text-lg text-[#a78bfa]">inventory_2</span>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-['JetBrains_Mono'] text-[#a78bfa] mt-2">
            {linesWithOverrides.reduce((sum, l) => sum + l.dailyShifts, 0)}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">shifts/day</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            Across {linesWithOverrides.filter((l) => l.dailyShifts > 0).length} active lines | {filteredMonthLines.length} lines
          </p>
        </div>
      </div>

      {/* 3. ⭐ DAILY PRODUCTION SCHEDULE ⭐ */}
      <div className="bg-[#1C1D22] border border-[#ffb86b]/40 rounded-lg p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Plant Filter */}
          <div className="flex bg-[#131316] p-1 rounded-lg border border-[#524437]/60">
            {(['ALL', 'TP08', 'TP15', 'TP16'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlantFilter(p)}
                className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-bold transition-all ${
                  plantFilter === p
                    ? 'bg-[#ffb86b] text-[#492900] shadow-sm'
                    : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                }`}
              >
                {p === 'ALL' ? `All Plants (${filteredMonthLines.length} Lines)` : p}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-[#131316] p-1 rounded-lg border border-[#524437]/60">
            <button
              onClick={() => setMatrixViewTab('DAILY_DETAIL')}
              className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded transition-all flex items-center gap-1 ${
                matrixViewTab === 'DAILY_DETAIL'
                  ? 'bg-[#5de6ff] text-[#00363f] font-bold shadow-sm'
                  : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_agenda</span>
              Daily Lines & MOs
            </button>
            <button
              onClick={() => setMatrixViewTab('MONTH_GRID')}
              className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded transition-all flex items-center gap-1 ${
                matrixViewTab === 'MONTH_GRID'
                  ? 'bg-[#5de6ff] text-[#00363f] font-bold shadow-sm'
                  : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_on</span>
              Monthly Schedule Gantt
            </button>
          </div>
        </div>

        {/* Date Selector Ribbon across current month */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/80 mb-2">
            <span>Click date to view daily line allocation:</span>
            <span className="text-[#ffb86b]">
              Selected: <strong className="text-white">{selectedDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#524437] scrollbar-track-[#131316]">
            {currentMonthDates.map((dt) => {
              const parts = dt.split('/');
              const mNum = parts[1];
              const dayStr = parts[2];
              const isSelected = selectedDate === dt;
              // Check if any lines have production on this day for the filtered plant
              const dayTotalQty = filteredMonthLines.reduce(
                (sum, l) => sum + (l.daily[dt]?.totalQty || 0),
                0
              );
              const activeLinesCount = filteredMonthLines.filter(
                (l) => (l.daily[dt]?.totalQty || 0) > 0
              ).length;
              const hasProduction = dayTotalQty > 0;

              return (
                <button
                  key={dt}
                  onClick={() => setSelectedCustomDate(dt)}
                  className={`shrink-0 flex flex-col items-center justify-between p-2 rounded-lg border transition-all min-w-[58px] text-center ${
                    isSelected
                      ? 'bg-[#ffb86b] text-[#492900] border-[#ffb86b] shadow-lg scale-105 font-bold ring-2 ring-[#ffb86b]/40 z-10'
                      : hasProduction
                      ? 'bg-[#131316] text-[#e5e1e6] border-[#524437]/70 hover:border-[#ffb86b]/60'
                      : 'bg-[#131316]/40 text-[#d7c3b2]/40 border-[#524437]/30 hover:border-[#524437]'
                  }`}
                  title={`${dt}: ${dayTotalQty} units scheduled across ${activeLinesCount} lines`}
                >
                  <span className="text-[10px] font-['JetBrains_Mono'] opacity-80">
                    {parseInt(mNum, 10)}/{dayStr}
                  </span>
                  <span
                    className={`text-xs font-bold font-['JetBrains_Mono'] my-0.5 ${
                      isSelected
                        ? 'text-[#492900]'
                        : hasProduction
                        ? 'text-[#4edea3]'
                        : 'text-[#d7c3b2]/40'
                    }`}
                  >
                    {hasProduction ? `${dayTotalQty}` : '-'}
                  </span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-['JetBrains_Mono'] ${
                      isSelected
                        ? 'bg-[#492900]/20 text-[#492900]'
                        : hasProduction
                        ? 'bg-[#4edea3]/20 text-[#4edea3]'
                        : 'text-[#d7c3b2]/30'
                    }`}
                  >
                    {hasProduction ? `${activeLinesCount} Lines` : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode 1: Daily Detailed View (Selected Date Active Lines + Work Orders) */}
        {matrixViewTab === 'DAILY_DETAIL' && (
          <div className="space-y-4">
            {/* Daily KPI Bar */}
            <div className="bg-[#131316] border border-[#524437]/60 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#ffb86b]/20 border border-[#ffb86b]/40 flex items-center justify-center text-[#ffb86b]">
                  <span className="material-symbols-outlined text-xl">event_available</span>
                </div>
                <div>
                  <div className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/80">
                    Scheduled Baseline Date
                  </div>
                  <div className="text-lg font-bold font-['JetBrains_Mono'] text-[#e5e1e6]">
                    {selectedDate}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 block">
                    Active Lines
                  </span>
                  <span className="text-base font-bold font-['JetBrains_Mono'] text-[#ffb86b]">
                    {currentDayStats.activeLinesCount} Lines Active
                  </span>
                </div>

                <div className="h-8 w-[1px] bg-[#524437]/50 hidden sm:block"></div>

                <div>
                  <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 block">
                    Scheduled Shifts
                  </span>
                  <span className="text-base font-bold font-['JetBrains_Mono'] text-[#4edea3]">
                    {currentDayStats.totalShiftsOnDate} Shifts / Day
                  </span>
                </div>

                <div className="h-8 w-[1px] bg-[#524437]/50 hidden sm:block"></div>

                <div>
                  <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 block">
                    Daily Plan Qty
                  </span>
                  <span className="text-base font-bold font-['JetBrains_Mono'] text-[#5de6ff]">
                    {currentDayStats.totalDayQty.toLocaleString()} units
                  </span>
                </div>

                <div className="h-8 w-[1px] bg-[#524437]/50 hidden sm:block"></div>

                <div>
                  <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 block">
                    Daily Required DL
                  </span>
                  <span className="text-base font-bold font-['JetBrains_Mono'] text-[#ffb86b]">
                    {currentDayStats.totalDayDL} DL{' '}
                    <span className="text-[10px] text-[#d7c3b2]/60 font-normal">
                      (IE Std × Shifts)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-grid: Left Active Lines Table, Right MO Work Orders Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Active Lines on Selected Date */}
              <div className="lg:col-span-6 bg-[#131316] border border-[#524437]/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-['Inter'] text-sm font-semibold text-[#e5e1e6] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#ffb86b]">linear_scale</span>
                    Active Lines & DL Calculation
                  </h5>
                  <span className="text-[11px] font-['JetBrains_Mono'] text-[#ffb86b] px-2 py-0.5 rounded bg-[#ffb86b]/10 border border-[#ffb86b]/30">
                    {currentDayStats.activeLinesCount} Lines Active
                  </span>
                </div>

                {currentDayStats.activeLinesCount === 0 ? (
                  <div className="text-center py-10 text-xs text-[#d7c3b2]/60 font-['JetBrains_Mono'] bg-[#1c1b1f]/60 rounded border border-[#524437]/30">
                    <span className="material-symbols-outlined text-3xl text-[#d7c3b2]/30 mb-2 block">
                      event_busy
                    </span>
                    No lines scheduled for production on this date
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-['Inter'] text-xs">
                      <thead className="bg-[#201f23] text-[#d7c3b2]/80 font-['JetBrains_Mono'] text-[11px]">
                        <tr>
                          <th className="p-2.5 border-b border-[#524437]/40">Plant / Line</th>
                          <th className="p-2.5 border-b border-[#524437]/40">Family / Model</th>
                          <th className="p-2.5 border-b border-[#524437]/40 text-center">Shift</th>
                          <th className="p-2.5 border-b border-[#524437]/40 text-right">PlanQty</th>
                          <th className="p-2.5 border-b border-[#524437]/40 text-right">
                            <span className="text-[#ffb86b]">IE Std</span>
                          </th>
                          <th className="p-2.5 border-b border-[#524437]/40 text-right">
                            <span className="text-[#5de6ff]">Required DL</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDayStats.lineDetails.map((item) => (
                          <tr
                            key={`${item.plant}-${item.line}`}
                            className="border-b border-[#524437]/20 hover:bg-[#1c1b1f] transition-colors"
                          >
                            <td className="p-2.5 font-semibold text-[#e5e1e6] font-['JetBrains_Mono']">
                              <span className="px-1.5 py-0.5 rounded bg-[#201f23] text-[#ffb86b] text-[10px] mr-1.5 border border-[#524437]/60">
                                {item.plant}
                              </span>
                              Line-{item.line}
                            </td>
                            <td className="p-2.5 text-[#d7c3b2]/90">
                              <div className="font-semibold">{item.family}</div>
                              <div className="text-[10px] text-[#d7c3b2]/60 truncate max-w-[120px]">
                                {item.model}
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold border ${
                                  item.hasDay && item.hasNight
                                    ? 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/40'
                                    : item.hasDay
                                    ? 'bg-[#ffb86b]/20 text-[#ffb86b] border-[#ffb86b]/40'
                                    : 'bg-[#5de6ff]/20 text-[#5de6ff] border-[#5de6ff]/40'
                                }`}
                              >
                                {item.hasDay && item.hasNight
                                  ? 'D + N (2 Shifts)'
                                  : item.hasDay
                                  ? 'Day Shift (1)'
                                  : 'Night Shift (1)'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#e5e1e6]">
                              {item.dayQty.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#ffb86b] font-bold">
                              {item.stdDL}{' '}
                              <span className="text-[9px] text-[#d7c3b2]/60 font-normal">/Shift</span>
                            </td>
                            <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#5de6ff] font-bold">
                              {item.requiredDL} DL
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#201f23] font-['JetBrains_Mono'] font-bold text-xs text-[#e5e1e6]">
                        <tr>
                          <td className="p-2.5" colSpan={3}>
                            Daily Total ({selectedDate})
                          </td>
                          <td className="p-2.5 text-right text-[#e5e1e6]">
                            {currentDayStats.totalDayQty.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right text-[#ffb86b]">
                            {currentDayStats.lineDetails.reduce((s, l) => s + l.stdDL, 0)}
                          </td>
                          <td className="p-2.5 text-right text-[#5de6ff]">
                            {currentDayStats.totalDayDL} DL
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Work Orders (MOs) on Selected Date */}
              <div className="lg:col-span-6 bg-[#131316] border border-[#524437]/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-['Inter'] text-sm font-semibold text-[#e5e1e6] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#5de6ff]">assignment</span>
                    Production MOs on this Date
                  </h5>
                  <span className="text-[11px] font-['JetBrains_Mono'] text-[#5de6ff] px-2 py-0.5 rounded bg-[#5de6ff]/10 border border-[#5de6ff]/30">
                    {currentDayStats.ordersOnDate.length} Orders
                  </span>
                </div>

                {currentDayStats.ordersOnDate.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#d7c3b2]/60 font-['JetBrains_Mono'] bg-[#1c1b1f]/60 rounded border border-[#524437]/30">
                    No work orders on this date
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[360px] scrollbar-thin scrollbar-thumb-[#524437]">
                    <table className="w-full text-left font-['Inter'] text-xs">
                      <thead className="bg-[#201f23] text-[#d7c3b2]/80 font-['JetBrains_Mono'] text-[11px] sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5 border-b border-[#524437]/40">MO Number</th>
                          <th className="p-2.5 border-b border-[#524437]/40">Line</th>
                          <th className="p-2.5 border-b border-[#524437]/40">Model / Family</th>
                          <th className="p-2.5 border-b border-[#524437]/40 text-center">Shift</th>
                          <th className="p-2.5 border-b border-[#524437]/40 text-right">Daily PlanQty</th>
                          <th className="p-2.5 border-b border-[#524437]/40 text-right">UPH</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDayStats.ordersOnDate.map((ord) => (
                          <tr
                            key={ord.id}
                            className="border-b border-[#524437]/20 hover:bg-[#1c1b1f] transition-colors"
                          >
                            <td className="p-2.5 font-semibold text-[#ffb86b] font-['JetBrains_Mono']">
                              {ord.mo || 'N/A'}
                            </td>
                            <td className="p-2.5 text-[#e5e1e6] font-['JetBrains_Mono']">
                              {ord.plant}-{ord.line}
                            </td>
                            <td className="p-2.5 text-[#d7c3b2]/90">
                              <div className="font-semibold">{ord.family}</div>
                              <div className="text-[10px] text-[#d7c3b2]/60 truncate max-w-[130px]">
                                {ord.model}
                              </div>
                            </td>
                            <td className="p-2.5 text-center font-['JetBrains_Mono']">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#201f23] text-[#e5e1e6] border border-[#524437]/60">
                                {ord.shiftText}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#4edea3]">
                              {ord.planQty}
                            </td>
                            <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#d7c3b2]/70">
                              {ord.uph || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Full Matrix Grid (Lines × Monthly Schedule Gantt) */}
        {matrixViewTab === 'MONTH_GRID' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-[#d7c3b2]/80">
              <span>
                <strong>Monthly Production Matrix:</strong> Daily operating shifts (D: Day, N: Night, 2: Dual) and planned quantities in Month {selectedMonth}.
              </span>
              <div className="flex items-center gap-3 font-['JetBrains_Mono'] text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#ffb86b]"></span> Day Shift (D)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#5de6ff]"></span> Night Shift (N)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#a78bfa]"></span> Dual Shifts (2)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#524437]/40"></span> Off / Unscheduled
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded border border-[#524437]/50 bg-[#131316]">
              <table className="w-full text-left font-['Inter'] text-xs">
                <thead className="bg-[#201f23] text-[#d7c3b2]/80 font-['JetBrains_Mono'] text-[10px]">
                  <tr>
                    <th className="p-2.5 border-b border-[#524437]/40 sticky left-0 bg-[#201f23] z-20 min-w-[130px]">
                      Plant / Line
                    </th>
                    <th className="p-2.5 border-b border-[#524437]/40 min-w-[110px]">Family / Model</th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center">
                      <span className="text-[#ffb86b]">IE Std DL</span>
                    </th>
                    {currentMonthDates.map((dt) => {
                      const dayStr = dt.split('/')[2];
                      const isSel = selectedDate === dt;
                      return (
                        <th
                          key={dt}
                          onClick={() => setSelectedCustomDate(dt)}
                          className={`p-1 text-center border-b border-[#524437]/40 cursor-pointer transition-colors min-w-[28px] ${
                            isSel ? 'bg-[#ffb86b] text-[#492900] font-bold' : 'hover:bg-[#2a292d]'
                          }`}
                          title={`Click to select ${dt}`}
                        >
                          {dayStr}
                        </th>
                      );
                    })}
                    <th className="p-2.5 border-b border-[#524437]/40 text-center">Active Days</th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-right">Monthly PlanQty</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMonthLines.map((line) => {
                    const stdDL = getLineIeStandardDL(site, line.line);
                    return (
                      <tr
                        key={`${line.plant}-${line.line}`}
                        className="border-b border-[#524437]/20 hover:bg-[#1c1b1f] transition-colors"
                      >
                        <td className="p-2.5 font-semibold text-[#e5e1e6] font-['JetBrains_Mono'] sticky left-0 bg-[#131316] z-10 border-r border-[#524437]/30">
                          <span className="px-1.5 py-0.5 rounded bg-[#201f23] text-[#ffb86b] text-[10px] mr-1 border border-[#524437]/60">
                            {line.plant}
                          </span>
                          {line.line}
                        </td>
                        <td className="p-2.5 text-[#d7c3b2]/90">
                          <div className="font-semibold text-xs">{line.family}</div>
                          <div className="text-[10px] text-[#d7c3b2]/60 truncate max-w-[100px]">
                            {line.model}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-['JetBrains_Mono'] font-bold text-[#ffb86b]">
                          {stdDL} DL
                        </td>
                        {currentMonthDates.map((dt) => {
                          const dayData = line.daily[dt];
                          const hasD = dayData?.hasDay;
                          const hasN = dayData?.hasNight;
                          const qty = dayData?.totalQty || 0;
                          const isSel = selectedDate === dt;

                          let badgeClass = 'text-[#d7c3b2]/20';
                          let badgeText = '-';

                          if (hasD && hasN) {
                            badgeClass = 'bg-[#a78bfa] text-[#131316] font-bold';
                            badgeText = '2';
                          } else if (hasD) {
                            badgeClass = 'bg-[#ffb86b] text-[#492900] font-bold';
                            badgeText = 'D';
                          } else if (hasN) {
                            badgeClass = 'bg-[#5de6ff] text-[#00363f] font-bold';
                            badgeText = 'N';
                          }

                          return (
                            <td
                              key={dt}
                              onClick={() => setSelectedCustomDate(dt)}
                              className={`p-1 text-center font-['JetBrains_Mono'] text-[10px] cursor-pointer transition-colors ${
                                isSel ? 'bg-[#ffb86b]/20 ring-1 ring-[#ffb86b]' : 'hover:bg-[#201f23]'
                              }`}
                              title={`${line.plant}-${line.line} on ${dt}: ${qty} units scheduled`}
                            >
                              <span
                                className={`inline-block w-5 h-5 rounded-full leading-5 text-center ${badgeClass}`}
                              >
                                {badgeText}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-center font-['JetBrains_Mono'] font-bold text-[#4edea3]">
                          {line.activeDaysCount} Days
                        </td>
                        <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b]">
                          {line.totalPlanQty.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#201f23] font-['JetBrains_Mono'] font-bold text-xs text-[#e5e1e6]">
                  <tr>
                    <td className="p-2.5 sticky left-0 bg-[#201f23] z-10" colSpan={3}>
                      Total {planMonthName} Plan Volume
                    </td>
                    {currentMonthDates.map((dt) => {
                      const dayQty = filteredMonthLines.reduce(
                        (sum, l) => sum + (l.daily[dt]?.totalQty || 0),
                        0
                      );
                      return (
                        <td key={dt} className="p-1 text-center text-[9px] text-[#4edea3]">
                          {dayQty > 0 ? (dayQty > 999 ? `${Math.round(dayQty / 1000)}k` : dayQty) : ''}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-center text-[#4edea3]">
                      {currentMonthDates.filter((dt) => filteredMonthLines.some((l) => (l.daily[dt]?.totalQty || 0) > 0)).length} Active Days
                    </td>
                    <td className="p-2.5 text-right text-[#ffb86b]">
                      {totalMonthPlanQty.toLocaleString()} Units
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Monthly Process Lines & Shift Headcount Matrix (SMT / PCA / System Assembly) */}
      <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h4 className="font-['Inter'] text-base font-semibold text-[#e5e1e6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb86b]">table_chart</span>
              Target Month ({targetMonthName} {targetYear}) Process Lines & Shift Headcount Matrix
            </h4>
          </div>

          {/* Process Filter Tabs & Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-[#201f23] p-1 rounded-lg border border-[#524437]/40">
              {(
                [
                  { key: 'ALL', label: 'All Processes' },
                  { key: 'SMT', label: 'SMT' },
                  { key: 'PCA', label: 'PCA' },
                  { key: 'System Assembly', label: 'System Assembly' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveProcessFilter(tab.key)}
                  className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded transition-all ${
                    activeProcessFilter === tab.key
                      ? 'bg-[#ffb86b] text-[#492900] font-bold shadow-sm'
                      : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {Object.keys(shiftOverrides).length > 0 && (
              <button
                onClick={handleResetShifts}
                className="px-2.5 py-1 text-[11px] font-['JetBrains_Mono'] text-[#ffb86b] hover:bg-[#2a292d] rounded border border-[#ffb86b]/40 transition-colors"
                title="Reset shifts to default"
              >
                Reset Shifts
              </button>
            )}
          </div>
        </div>

        {/* Schedule Matrix Table */}
        <div className="overflow-x-auto rounded border border-[#524437]/40 bg-[#131316]">
          <table className="w-full text-left font-['Inter'] text-xs">
            <thead className="bg-[#201f23] text-[#d7c3b2]/80 font-['JetBrains_Mono']">
              <tr>
                <th className="p-3 border-b border-[#524437]/40">Process</th>
                <th className="p-3 border-b border-[#524437]/40">Line</th>
                <th className="p-3 border-b border-[#524437]/40 text-center">Model / Series</th>
                <th className="p-3 border-b border-[#524437]/40 text-center">Daily Shifts</th>
                <th className="p-3 border-b border-[#524437]/40 text-right">
                  <span className="text-[#ffb86b] font-bold">IE Std DL / Shift</span>
                  <span className="block text-[10px] text-[#d7c3b2]/60 font-normal">
                    (from IE Standard)
                  </span>
                </th>
                <th className="p-3 border-b border-[#524437]/40 text-right">
                  <span className="text-[#5de6ff] font-bold">Daily Required DL</span>
                  <span className="block text-[10px] text-[#d7c3b2]/60 font-normal">
                    (Shifts × IE Std DL)
                  </span>
                </th>
                <th className="p-3 border-b border-[#524437]/40 text-center">Active Days / Month</th>
                <th className="p-3 border-b border-[#524437]/40 text-center">Schedule Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line) => {
                const processBadgeColor =
                  line.process === 'SMT'
                    ? 'bg-[#ffb86b]/20 text-[#ffb86b] border-[#ffb86b]/40'
                    : line.process === 'PCA'
                    ? 'bg-[#cd8939]/20 text-[#ffb86b] border-[#cd8939]/40'
                    : 'bg-[#5de6ff]/20 text-[#5de6ff] border-[#5de6ff]/40';

                return (
                  <tr
                    key={line.lineId}
                    className="border-b border-[#524437]/20 hover:bg-[#1c1b1f] transition-colors"
                  >
                    <td className="p-3 font-semibold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold border ${processBadgeColor}`}
                      >
                        {line.process}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#e5e1e6] font-['JetBrains_Mono']">
                      {line.lineName}
                    </td>
                    <td className="p-3 text-center text-[#d7c3b2]/80">
                      {line.category ? `${line.category} Board Series` : 'System Assembly Unit'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-[#201f23] px-2 py-1 rounded border border-[#524437]/40">
                        <select
                          value={line.dailyShifts}
                          onChange={(e) => handleShiftChange(line.lineId, Number(e.target.value))}
                          className="bg-transparent text-xs font-['JetBrains_Mono'] font-bold text-[#ffb86b] focus:outline-none cursor-pointer"
                        >
                          <option value={0} className="bg-[#1C1D22] text-[#d7c3b2]">
                            0 shifts (Offline)
                          </option>
                          <option value={1} className="bg-[#1C1D22] text-[#e5e1e6]">
                            1 shift/day (Day Shift)
                          </option>
                          <option value={2} className="bg-[#1C1D22] text-[#e5e1e6]">
                            2 shifts/day (Day + Night)
                          </option>
                          <option value={3} className="bg-[#1C1D22] text-[#e5e1e6]">
                            3 shifts/day (3 Shifts)
                          </option>
                          <option value={4} className="bg-[#1C1D22] text-[#e5e1e6]">
                            4 shifts/day (24/7 Shifts)
                          </option>
                        </select>
                      </div>
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] text-sm font-bold text-[#ffb86b]">
                      {line.ieStdDLPerShift}{' '}
                      <span className="text-[10px] text-[#d7c3b2]/60 font-normal">DL/shift</span>
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] text-sm font-bold text-[#5de6ff]">
                      {line.dailyRequiredDL}{' '}
                      <span className="text-[10px] text-[#d7c3b2]/60 font-normal">DL</span>
                    </td>
                    <td className="p-3 text-center font-['JetBrains_Mono'] text-[#d7c3b2]/80">
                      {line.dailyShifts > 0 ? `${line.daysActiveInMonth} Days` : '0 Days'}
                    </td>
                    <td className="p-3 text-center">
                      {line.dailyShifts > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/30 flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                          SCHEDULED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] bg-[#524437]/30 text-[#d7c3b2]/50">
                          OFFLINE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[#201f23] font-['JetBrains_Mono'] font-bold text-xs text-[#e5e1e6]">
              <tr>
                <td className="p-3" colSpan={3}>
                  Filtered Lines Subtotal
                </td>
                <td className="p-3 text-center text-[#ffb86b]">
                  {filteredLines.reduce((sum, l) => sum + l.dailyShifts, 0)} shifts/day
                </td>
                <td className="p-3 text-right text-[#ffb86b]">
                  {filteredLines.reduce((sum, l) => sum + l.ieStdDLPerShift, 0)} DL (1-Shift Base Total)
                </td>
                <td className="p-3 text-right text-[#5de6ff]">
                  {filteredLines.reduce((sum, l) => sum + l.dailyRequiredDL, 0)} DL
                </td>
                <td className="p-3 text-center text-[#d7c3b2]/60">22 Working Days</td>
                <td className="p-3 text-center text-[#4edea3]">
                  {filteredLines.filter((l) => l.dailyShifts > 0).length} Active Lines
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Manpower Composition Summary Bar: DL Variable + IDL Fixed */}
        <div className="mt-4 p-4 rounded-lg bg-[#18181c] border border-[#524437]/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-['JetBrains_Mono']">
            <div className="flex items-center gap-2">
              <span className="text-[#d7c3b2]/60">Online DL (Variable):</span>
              <span className="font-bold text-[#5de6ff]">{totalOnlineDL} DL</span>
            </div>
            <span className="text-[#524437]">•</span>
            <div className="flex items-center gap-2">
              <span className="text-[#d7c3b2]/60">Offline DL (Variable):</span>
              <span className="font-bold text-[#ffb86b]">{totalOfflineDL} DL</span>
            </div>
            <span className="text-[#524437]">•</span>
            <div className="flex items-center gap-2">
              <span className="text-[#d7c3b2]/60">Support DL (Variable):</span>
              <span className="font-bold text-[#ffb86b]">{totalSupportDL} DL</span>
            </div>
            <span className="text-[#524437]">•</span>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#ffb86b]/15 border border-[#ffb86b]/30">
              <span className="text-[#ffb86b] font-medium">TOTAL REQUIRED DL:</span>
              <span className="font-bold text-[#ffb86b]">{totalApsDemandDL} DL</span>
            </div>
            <span className="text-[#524437]">+</span>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#5de6ff]/15 border border-[#5de6ff]/30" title="Fixed IDL from IE Standard - Unchanged by Capacity">
              <span className="text-[#5de6ff] font-medium">FIXED IDL (CONSTANT):</span>
              <span className="font-bold text-[#5de6ff]">{fixedIDL} IDL</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4edea3]/15 border border-[#4edea3]/40">
            <span className="text-xs font-['JetBrains_Mono'] text-[#4edea3] font-medium">TOTAL DEMAND HC:</span>
            <span className="text-sm font-['JetBrains_Mono'] font-extrabold text-[#4edea3]">
              {totalDemandHeadcount} HC
            </span>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
