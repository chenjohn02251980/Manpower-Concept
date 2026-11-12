import React, { useState } from 'react';
import { SiteData } from '../types';
import {
  AUGUST_SMT_ORDERS,
  AUGUST_SMT_LINE_SUMMARIES,
  SMT_PAIRS_CONFIG,
  SmtLineSummary,
  SmtPcaOrder,
} from '../data/apsSmtPcaSchedule';

interface SmtPcaContinuityViewProps {
  site?: SiteData;
  selectedYear: number;
  selectedMonth: number;
  onNavigateToForecast: () => void;
  onSelectSite?: (siteId: string) => void;
}

// Helper to look up IE STANDARD Online DL for SMT line
export function getSmtLineIeStdDL(
  site: SiteData | undefined,
  smtLineName: string,
  fallbackStd: number = 6
): number {
  if (!site?.smtLines || site.smtLines.length === 0) return fallbackStd;
  const target = smtLineName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = site.smtLines.find((l) => {
    const lNorm = l.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return lNorm === target || lNorm.includes(target) || target.includes(lNorm);
  });
  if (match && typeof match.onlineStdDL === 'number' && match.onlineStdDL > 0) {
    return match.onlineStdDL;
  }
  return fallbackStd;
}

// Helper to look up IE STANDARD Online DL for PCA line
export function getPcaLineIeStdDL(
  site: SiteData | undefined,
  pcaLineName: string,
  fallbackStd: number = 18
): number {
  if (!site?.pcaLines || site.pcaLines.length === 0) return fallbackStd;
  const target = pcaLineName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = site.pcaLines.find((l) => {
    const lNorm = l.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return lNorm === target || lNorm.includes(target) || target.includes(lNorm);
  });
  if (match) {
    const totalPcaOnlineDL =
      (match.faStdDL || 0) + (match.testStdDL || 0) + (match.packingStdDL || 0);
    if (totalPcaOnlineDL > 0) return totalPcaOnlineDL;
  }
  return fallbackStd;
}

export const SmtPcaContinuityView: React.FC<SmtPcaContinuityViewProps> = ({
  site,
  selectedYear,
  selectedMonth,
  onNavigateToForecast,
  onSelectSite,
}) => {
  const isTaoActive = !site || site.id === 'tao' || site.code === 'TAO' || site.id === 'overall';

  // Dates for August 2026
  const augustDates = Array.from({ length: 31 }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    return `2026/08/${day}`;
  });

  const [selectedDate, setSelectedDate] = useState<string>('2026/08/03');
  const [plantFilter, setPlantFilter] = useState<
    'ALL' | 'TP05' | 'TP08' | 'TP11' | 'TP12' | 'TP15' | 'TP16'
  >('ALL');
  const [activeTab, setActiveTab] = useState<'DAILY' | 'GRID' | 'SIMULATION'>('DAILY');
  const [simulatedShifts, setSimulatedShifts] = useState<Record<string, number>>({});

  // If currently on a site that is not TAO, prompt user to select TAO to activate the schedule
  if (!isTaoActive && site) {
    return (
      <div className="space-y-6 pb-12 select-none">
        <div className="bg-[#1C1D22] border border-[#524437]/70 rounded-xl p-8 max-w-3xl mx-auto shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#ffb86b]/10 border border-[#ffb86b]/30 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-[#ffb86b]">domain</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/30 text-xs font-['JetBrains_Mono'] font-bold mb-3">
            <span className="material-symbols-outlined text-sm">info</span>
            Plant Scope Notice
          </div>

          <h3 className="text-xl lg:text-2xl font-bold font-['Inter'] text-[#e5e1e6] mb-3">
            Currently Selected Plant: {site.name} ({site.code})
          </h3>

          <div className="p-4 bg-[#131316] rounded-lg border border-[#524437]/50 text-xs sm:text-sm text-[#d7c3b2]/90 leading-relaxed font-['Inter'] max-w-xl mx-auto mb-6 text-left">
            <p className="mb-2">
              The provided <strong className="text-[#38bdf8]">August APS Continuous Process Simulation Data</strong> belongs to{' '}
              <strong className="text-[#ffb86b]">TAO Plant</strong>.
            </p>
            <p className="text-xs text-[#d7c3b2]/80">
              Sub-plants <code className="text-[#ffb86b] font-bold">TP05, TP08, TP11, TP12, TP15, TP16</code> are consolidated under TAO Plant. Select{' '}
              <strong className="text-[#ffb86b]">TAO</strong> from the menu to activate linked line scheduling and dynamic manpower calculation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onSelectSite?.('tao')}
              className="w-full sm:w-auto px-6 py-3 bg-[#ffb86b] text-[#492900] font-['JetBrains_Mono'] font-bold text-sm rounded-lg hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">domain</span>
              Switch to TAO Plant to Enable Scheduling
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter line summaries by plant
  const filteredLines = AUGUST_SMT_LINE_SUMMARIES.filter((l) => {
    if (plantFilter === 'ALL') return true;
    return l.plant === plantFilter;
  });

  // Calculate stats for the selected date
  const dayLineDetails = filteredLines.map((l) => {
    const dailyInfo = l.daily[selectedDate] || {
      dayQty: 0,
      nightQty: 0,
      totalQty: 0,
      hasDay: false,
      hasNight: false,
      shifts: 0,
      smtDL: 0,
      pcaDL: 0,
      totalDL: 0,
    };

    // Calculate shifts according to APS Demand logic:
    // D (day shift) = 1S, N (night shift) = 1S, D+N = 2S
    let apsDateShifts = 0;
    if (dailyInfo.hasDay && dailyInfo.hasNight) {
      apsDateShifts = 2; // D + N = 2S
    } else if (dailyInfo.hasDay || dailyInfo.hasNight) {
      apsDateShifts = 1; // D or N = 1S
    } else if (dailyInfo.shifts > 0) {
      apsDateShifts = dailyInfo.shifts;
    }

    // Effective shifts: supports overrides from 0S to 4S (0, 1, 2, 3, 4 shifts)
    const effectiveShifts =
      simulatedShifts[l.smtLine] !== undefined
        ? simulatedShifts[l.smtLine]
        : apsDateShifts;

    // Number sources are strictly from IE STANDARD per line!
    const smtStdDL = getSmtLineIeStdDL(site, l.smtLine, l.smtStdDL);
    const pcaStdDL = getPcaLineIeStdDL(site, l.pcaLine, l.pcaStdDL);

    const smtDL = effectiveShifts * smtStdDL;
    const pcaDL = effectiveShifts * pcaStdDL;
    const totalDL = smtDL + pcaDL;

    const dayOrders = AUGUST_SMT_ORDERS.filter(
      (o) => o.smtLine === l.smtLine && o.date === selectedDate
    );

    return {
      smtLine: l.smtLine,
      pcaLine: l.pcaLine,
      plant: l.plant,
      smtStdDL,
      pcaStdDL,
      totalPairStdDL: smtStdDL + pcaStdDL,
      dayQty: dailyInfo.dayQty,
      nightQty: dailyInfo.nightQty,
      totalQty: dailyInfo.totalQty,
      hasDay: dailyInfo.hasDay,
      hasNight: dailyInfo.hasNight,
      shifts: effectiveShifts,
      originalShifts: apsDateShifts,
      isSimulated: simulatedShifts[l.smtLine] !== undefined,
      smtDL,
      pcaDL,
      totalDL,
      orders: dayOrders,
    };
  });

  const activeLinesOnDate = dayLineDetails.filter((d) => d.shifts > 0);
  const totalDayPlanQty = dayLineDetails.reduce((sum, d) => sum + d.totalQty, 0);
  const totalDayShifts = dayLineDetails.reduce((sum, d) => sum + d.shifts, 0);
  const totalDaySmtDL = dayLineDetails.reduce((sum, d) => sum + d.smtDL, 0);
  const totalDayPcaDL = dayLineDetails.reduce((sum, d) => sum + d.pcaDL, 0);
  const totalDayContinuousDL = totalDaySmtDL + totalDayPcaDL;

  // Month-wide totals
  const totalMonthPlanQty = filteredLines.reduce((sum, l) => sum + l.totalPlanQty, 0);
  const totalMonthActiveLineDays = filteredLines.reduce((sum, l) => sum + l.activeDays, 0);

  const handleShiftOverride = (line: string, shifts: number) => {
    setSimulatedShifts((prev) => ({
      ...prev,
      [line]: shifts,
    }));
  };

  const handleResetSim = () => {
    setSimulatedShifts({});
  };

  return (
    <div className="space-y-6">
      {/* Plant Filters & View Tabs */}
      <div className="bg-[#1C1D22] border border-[#524437]/70 rounded-xl p-4 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/90 flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-sm text-[#38bdf8]">domain</span>
              TAO Plant Units:
            </span>
            <span className="text-[10px] text-[#ffb86b] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#ffb86b]/10 border border-[#ffb86b]/30 font-medium">
              TP05, TP08, TP11, TP12, TP15, TP16 are under TAO Plant
            </span>
            <div className="flex flex-wrap bg-[#131316] p-1 rounded-lg border border-[#524437]/60">
              {(['ALL', 'TP05', 'TP08', 'TP11', 'TP12', 'TP15', 'TP16'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlantFilter(p)}
                  className={`px-2.5 py-1 text-xs font-['JetBrains_Mono'] rounded font-bold transition-all ${
                    plantFilter === p
                      ? 'bg-[#38bdf8] text-[#082f49] shadow-sm'
                      : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                  }`}
                >
                  {p === 'ALL' ? 'All Plants' : p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-[#131316] p-1 rounded-lg border border-[#524437]/60">
              <button
                onClick={() => setActiveTab('DAILY')}
                className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'DAILY'
                    ? 'bg-[#ffb86b] text-[#492900] shadow-sm'
                    : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">view_agenda</span>
                Daily SMT ➔ PCA Linked Line Details
              </button>
              <button
                onClick={() => setActiveTab('GRID')}
                className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'GRID'
                    ? 'bg-[#4edea3] text-[#052e16] shadow-sm'
                    : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">grid_on</span>
                Monthly Schedule Matrix Gantt
              </button>
              <button
                onClick={() => setActiveTab('SIMULATION')}
                className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'SIMULATION'
                    ? 'bg-[#a78bfa] text-[#2e1065] shadow-sm'
                    : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">science</span>
                Linked Manpower What-If Simulation
              </button>
            </div>

            {Object.keys(simulatedShifts).length > 0 && (
              <button
                onClick={handleResetSim}
                className="px-2.5 py-1 text-xs font-['JetBrains_Mono'] text-[#ffb86b] hover:bg-[#2a292d] rounded border border-[#ffb86b]/40 transition-colors"
                title="Reset to actual APS schedule"
              >
                Reset Simulation
              </button>
            )}
          </div>
        </div>

      {/* Date Ribbon across August (2026/8/1 ~ 2026/8/31) */}
      <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-4">
        <div className="flex justify-between items-center text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/80 mb-2.5">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#38bdf8]">calendar_today</span>
            Select August date to view daily SMT ➔ PCA line status and manpower demand:
          </span>
          <span className="text-[#ffb86b]">
            Active Date: <strong className="text-white bg-[#131316] px-2 py-0.5 rounded border border-[#524437]">{selectedDate}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#524437] scrollbar-track-[#131316]">
          {augustDates.map((dt) => {
            const dayNum = parseInt(dt.split('/')[2], 10);
            const isSelected = selectedDate === dt;

            // Total plan qty on this day across filtered lines
            const dayQty = filteredLines.reduce(
              (sum, l) => sum + (l.daily[dt]?.totalQty || 0),
              0
            );
            const activeLinesCount = filteredLines.filter(
              (l) => (l.daily[dt]?.shifts || 0) > 0
            ).length;
            const hasProduction = dayQty > 0 || activeLinesCount > 0;

            return (
              <button
                key={dt}
                onClick={() => setSelectedDate(dt)}
                className={`shrink-0 flex flex-col items-center justify-between p-2 rounded-lg border transition-all min-w-[56px] text-center ${
                  isSelected
                    ? 'bg-[#38bdf8] text-[#082f49] border-[#38bdf8] shadow-lg scale-105 font-bold ring-2 ring-[#38bdf8]/40 z-10'
                    : hasProduction
                    ? 'bg-[#131316] text-[#e5e1e6] border-[#524437]/70 hover:border-[#38bdf8]/60'
                    : 'bg-[#131316]/40 text-[#d7c3b2]/30 border-[#524437]/30 hover:border-[#524437]'
                }`}
                title={`${dt}: SMT Plan Qty ${dayQty.toLocaleString()} pcs, ${activeLinesCount} active line(s) (linked to ${activeLinesCount} PCA line(s))`}
              >
                <span className="text-[10px] font-['JetBrains_Mono'] opacity-80">
                  8/{dayNum}
                </span>
                <span
                  className={`text-xs font-bold font-['JetBrains_Mono'] my-0.5 ${
                    isSelected
                      ? 'text-[#082f49]'
                      : hasProduction
                      ? 'text-[#4edea3]'
                      : 'text-[#d7c3b2]/30'
                  }`}
                >
                  {hasProduction ? (dayQty > 999 ? `${Math.round(dayQty / 1000)}k` : dayQty) : '-'}
                </span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-['JetBrains_Mono'] ${
                    isSelected
                      ? 'bg-[#082f49]/20 text-[#082f49]'
                      : hasProduction
                      ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                      : 'text-[#d7c3b2]/20'
                  }`}
                >
                  {hasProduction ? `${activeLinesCount}L` : 'Off'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards on Selected Date */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* SMT Active Lines */}
        <div className="bg-[#1C1D22] border border-[#ffb86b]/40 p-4 rounded-lg">
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block">
            Daily SMT Active Lines
          </span>
          <div className="text-2xl font-bold font-['JetBrains_Mono'] text-[#ffb86b] mt-1">
            {activeLinesOnDate.length}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">Lines</span>
          </div>
          <span className="text-[10px] text-[#d7c3b2]/60 mt-0.5 block">
            {totalDayShifts} Shifts Active
          </span>
        </div>

        {/* Linked PCA Active Lines */}
        <div className="bg-[#1C1D22] border border-[#4edea3]/40 p-4 rounded-lg">
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block">
            Linked PCA Active Lines
          </span>
          <div className="text-2xl font-bold font-['JetBrains_Mono'] text-[#4edea3] mt-1">
            {activeLinesOnDate.length}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">Lines (1:1)</span>
          </div>
          <span className="text-[10px] text-[#4edea3]/80 mt-0.5 block font-bold">
            Post-SMT Downstream Flow
          </span>
        </div>

        {/* Daily SMT Plan Qty */}
        <div className="bg-[#1C1D22] border border-[#524437]/60 p-4 rounded-lg">
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase block">
            Daily Plan Qty
          </span>
          <div className="text-2xl font-bold font-['JetBrains_Mono'] text-[#e5e1e6] mt-1">
            {totalDayPlanQty.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">pcs</span>
          </div>
          <span className="text-[10px] text-[#d7c3b2]/60 mt-0.5 block">
            Monthly Total {totalMonthPlanQty.toLocaleString()}
          </span>
        </div>

        {/* SMT Required DL */}
        <div className="bg-[#1C1D22] border border-[#ffb86b]/40 p-4 rounded-lg">
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#ffb86b] uppercase block font-semibold">
            Daily SMT Required DL
          </span>
          <div className="text-2xl font-bold font-['JetBrains_Mono'] text-[#ffb86b] mt-1">
            {totalDaySmtDL}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <span className="text-[10px] text-[#d7c3b2]/60 mt-0.5 block">
            Σ (Shifts × SMT Std)
          </span>
        </div>

        {/* Linked PCA Required DL */}
        <div className="bg-[#1C1D22] border border-[#4edea3]/40 p-4 rounded-lg">
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#4edea3] uppercase block font-semibold">
            Daily Linked PCA DL
          </span>
          <div className="text-2xl font-bold font-['JetBrains_Mono'] text-[#4edea3] mt-1">
            {totalDayPcaDL}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <span className="text-[10px] text-[#4edea3]/80 mt-0.5 block">
            Σ (Shifts × PCA Std)
          </span>
        </div>

        {/* Total SMT + PCA DL */}
        <div className="bg-[#1C1D22] border border-[#38bdf8] p-4 rounded-lg ring-1 ring-[#38bdf8]/30">
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#38bdf8] uppercase block font-bold">
            Continuous Process Total DL
          </span>
          <div className="text-2xl font-bold font-['JetBrains_Mono'] text-[#38bdf8] mt-1">
            {totalDayContinuousDL}{' '}
            <span className="text-xs font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <span className="text-[10px] text-[#d7c3b2]/80 mt-0.5 block">
            SMT {totalDaySmtDL} + PCA {totalDayPcaDL}
          </span>
        </div>
      </div>

      {/* TAB 1: DAILY CONTINUITY DETAIL */}
      {activeTab === 'DAILY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Lines Coupling Table */}
          <div className="lg:col-span-7 bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-5">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3.5">
              <div>
                <h4 className="font-['Inter'] text-sm font-bold text-[#e5e1e6] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#38bdf8] text-base">alt_route</span>
                  {selectedDate} SMT ➔ PCA Linked Lines & Manpower Allocation
                </h4>
                <p className="text-xs text-[#d7c3b2]/75 mt-0.5 leading-relaxed">
                  Source: <strong className="text-[#ffb86b]">IE Standard Online DL per line</strong> • APS Shift logic: <strong className="text-[#e5e1e6]">D=1S, N=1S, D+N=2S</strong> (Range: <strong className="text-[#38bdf8]">0S~4S</strong>)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-['JetBrains_Mono'] text-[#38bdf8] px-2 py-0.5 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30">
                  {activeLinesOnDate.length} Active Lines
                </span>
                <button
                  onClick={onNavigateToForecast}
                  className="px-2.5 py-1 rounded text-[11px] font-['JetBrains_Mono'] font-bold bg-[#ffb86b]/15 text-[#ffb86b] hover:bg-[#ffb86b]/25 border border-[#ffb86b]/35 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Configure SMT/PCA Online DL in IE Standard"
                >
                  <span className="material-symbols-outlined text-xs">tune</span>
                  <span>IE STD BASELINE</span>
                </button>
              </div>
            </div>

            {activeLinesOnDate.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#d7c3b2]/60 font-['JetBrains_Mono'] bg-[#131316] rounded border border-[#524437]/40">
                <span className="material-symbols-outlined text-3xl text-[#d7c3b2]/30 mb-2 block">
                  event_busy
                </span>
                {selectedDate} Scheduled line shutdown or no production planned (No lines scheduled on this date)
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-['Inter'] text-xs">
                  <thead className="bg-[#131316] text-[#d7c3b2]/80 font-['JetBrains_Mono'] text-[11px]">
                    <tr>
                      <th className="p-2.5 border-b border-[#524437]/50">SMT ➔ PCA Line</th>
                      <th className="p-2.5 border-b border-[#524437]/50">Plant</th>
                      <th className="p-2.5 border-b border-[#524437]/50 text-center">Shift (0S~4S)</th>
                      <th className="p-2.5 border-b border-[#524437]/50 text-right">PlanQty</th>
                      <th className="p-2.5 border-b border-[#524437]/50 text-right">
                        <span className="text-[#ffb86b] inline-flex flex-col items-end leading-tight">
                          <span>SMT DL</span>
                          <span className="text-[9px] text-[#ffb86b]/70 font-normal">IE Online Std × Shift</span>
                        </span>
                      </th>
                      <th className="p-2.5 border-b border-[#524437]/50 text-right">
                        <span className="text-[#4edea3] inline-flex flex-col items-end leading-tight">
                          <span>PCA DL</span>
                          <span className="text-[9px] text-[#4edea3]/70 font-normal">IE Online Std × Shift</span>
                        </span>
                      </th>
                      <th className="p-2.5 border-b border-[#524437]/50 text-right">
                        <span className="text-[#38bdf8]">Total DL</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLinesOnDate.map((item) => (
                      <tr
                        key={item.smtLine}
                        className="border-b border-[#524437]/20 hover:bg-[#131316]/70 transition-colors"
                      >
                        <td className="p-2.5 font-['JetBrains_Mono']">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded font-bold bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/40">
                              {item.smtLine}
                            </span>
                            <span className="text-[#38bdf8] text-xs font-bold">➔</span>
                            <span className="px-2 py-0.5 rounded font-bold bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40">
                              {item.pcaLine}
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5 font-['JetBrains_Mono'] text-[#d7c3b2]">
                          {item.plant}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-[#201f23] px-2 py-0.5 rounded border border-[#524437]/50">
                            <select
                              value={item.shifts}
                              onChange={(e) => handleShiftOverride(item.smtLine, Number(e.target.value))}
                              className="bg-transparent text-[11px] font-['JetBrains_Mono'] font-bold text-[#ffb86b] focus:outline-none cursor-pointer"
                              title={`Schedule: ${item.hasDay ? 'D' : ''}${item.hasDay && item.hasNight ? '+' : ''}${item.hasNight ? 'N' : ''} (Click to override 0S~4S)`}
                            >
                              <option value={0} className="bg-[#1C1D22] text-[#d7c3b2]">0S (Offline)</option>
                              <option value={1} className="bg-[#1C1D22] text-[#e5e1e6]">1S ({item.hasNight ? 'N' : 'D'})</option>
                              <option value={2} className="bg-[#1C1D22] text-[#e5e1e6]">2S (D + N)</option>
                              <option value={3} className="bg-[#1C1D22] text-[#e5e1e6]">3S (3 Shifts)</option>
                              <option value={4} className="bg-[#1C1D22] text-[#e5e1e6]">4S (24/7)</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#e5e1e6]">
                          {item.totalQty.toLocaleString()}
                          <span className="block text-[9px] text-[#d7c3b2]/60 font-normal">
                            D:{item.dayQty} / N:{item.nightQty}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b]">
                          {item.smtDL} DL
                          <span className="block text-[9px] text-[#ffb86b]/70 font-normal">
                            {item.shifts}S × {item.smtStdDL} (IE Std)
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#4edea3]">
                          {item.pcaDL} DL
                          <span className="block text-[9px] text-[#4edea3]/70 font-normal">
                            {item.shifts}S × {item.pcaStdDL} (IE Std)
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#38bdf8]">
                          {item.totalDL} DL
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#131316] font-['JetBrains_Mono'] font-bold text-xs text-[#e5e1e6]">
                    <tr>
                      <td className="p-2.5" colSpan={3}>
                        Daily Total (Total for {selectedDate})
                      </td>
                      <td className="p-2.5 text-right text-[#e5e1e6]">
                        {totalDayPlanQty.toLocaleString()} pcs
                      </td>
                      <td className="p-2.5 text-right text-[#ffb86b]">
                        {totalDaySmtDL} DL
                      </td>
                      <td className="p-2.5 text-right text-[#4edea3]">
                        {totalDayPcaDL} DL
                      </td>
                      <td className="p-2.5 text-right text-[#38bdf8]">
                        {totalDayContinuousDL} DL
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* SMT Work Orders (MOs) on Selected Date */}
          <div className="lg:col-span-5 bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-5">
            <div className="flex justify-between items-center mb-3.5">
              <div>
                <h4 className="font-['Inter'] text-sm font-bold text-[#e5e1e6] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffb86b] text-base">receipt_long</span>
                  {selectedDate} SMT Work Orders (MO Orders)
                </h4>
                <p className="text-xs text-[#d7c3b2]/60 mt-0.5">
                  Actual August APS schedule MO orders and scheduled intervals
                </p>
              </div>
              <span className="text-xs font-['JetBrains_Mono'] text-[#ffb86b] px-2 py-0.5 rounded bg-[#ffb86b]/10 border border-[#ffb86b]/30">
                {AUGUST_SMT_ORDERS.filter((o) => o.date === selectedDate).length} Orders
              </span>
            </div>

            {AUGUST_SMT_ORDERS.filter((o) => o.date === selectedDate).length === 0 ? (
              <div className="text-center py-12 text-xs text-[#d7c3b2]/60 font-['JetBrains_Mono'] bg-[#131316] rounded border border-[#524437]/40">
                No manufacturing work orders scheduled for this date
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[380px] scrollbar-thin scrollbar-thumb-[#524437]">
                <table className="w-full text-left font-['Inter'] text-xs">
                  <thead className="bg-[#131316] text-[#d7c3b2]/80 font-['JetBrains_Mono'] text-[11px] sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 border-b border-[#524437]/50">MO Number</th>
                      <th className="p-2.5 border-b border-[#524437]/50">Line</th>
                      <th className="p-2.5 border-b border-[#524437]/50">Model</th>
                      <th className="p-2.5 border-b border-[#524437]/50 text-right">PlanQty</th>
                      <th className="p-2.5 border-b border-[#524437]/50 text-center">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AUGUST_SMT_ORDERS.filter((o) => o.date === selectedDate).map((ord) => (
                      <tr
                        key={ord.id}
                        className="border-b border-[#524437]/20 hover:bg-[#131316]/70 transition-colors"
                      >
                        <td className="p-2.5 font-semibold text-[#ffb86b] font-['JetBrains_Mono'] text-[11px]">
                          {ord.mo}
                        </td>
                        <td className="p-2.5 font-['JetBrains_Mono'] font-bold text-[#e5e1e6]">
                          {ord.smtLine}
                        </td>
                        <td className="p-2.5 text-[#d7c3b2]">
                          <div className="font-semibold">{ord.family}</div>
                          <div className="text-[10px] text-[#d7c3b2]/60 truncate max-w-[120px]">
                            {ord.model}
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#4edea3]">
                          {ord.planQty.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-['JetBrains_Mono']">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              ord.dType === 'NPI'
                                ? 'bg-[#ffb86b]/20 text-[#ffb86b] border border-[#ffb86b]/40'
                                : 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40'
                            }`}
                          >
                            {ord.dType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FULL MONTH MATRIX GRID */}
      {activeTab === 'GRID' && (
        <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-5">
          <div className="flex justify-between items-center mb-3 text-xs text-[#d7c3b2]/80">
            <span>
              <strong>August SMT ➔ PCA Monthly Schedule Gantt:</strong> View monthly scheduled production days and shifts for 12 SMT lines and paired downstream PCA lines.
            </span>
            <div className="flex items-center gap-3 font-['JetBrains_Mono'] text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#ffb86b]"></span> Day Shift (D)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#5de6ff]"></span> Night Shift (N)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#a78bfa]"></span> 2: Double (D+N)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#524437]/40"></span> Off / Idle
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-[#524437]/50 bg-[#131316]">
            <table className="w-full text-left font-['Inter'] text-xs">
              <thead className="bg-[#201f23] text-[#d7c3b2]/80 font-['JetBrains_Mono'] text-[10px]">
                <tr>
                  <th className="p-2 border-b border-[#524437]/40 sticky left-0 bg-[#201f23] z-20 min-w-[130px]">
                    SMT ➔ PCA Line
                  </th>
                  <th className="p-2 border-b border-[#524437]/40 text-center">Plant</th>
                  <th className="p-2 border-b border-[#524437]/40 text-center">
                    <span className="text-[#ffb86b]">SMT Std</span>
                  </th>
                  <th className="p-2 border-b border-[#524437]/40 text-center">
                    <span className="text-[#4edea3]">PCA Std</span>
                  </th>
                  {augustDates.map((dt) => {
                    const dayNum = dt.split('/')[2];
                    const isSel = selectedDate === dt;
                    return (
                      <th
                        key={dt}
                        onClick={() => setSelectedDate(dt)}
                        className={`p-1 text-center border-b border-[#524437]/40 cursor-pointer min-w-[26px] ${
                          isSel ? 'bg-[#38bdf8] text-[#082f49] font-bold' : 'hover:bg-[#2a292d]'
                        }`}
                        title={`Click to switch to 8/${dayNum}`}
                      >
                        {dayNum}
                      </th>
                    );
                  })}
                  <th className="p-2 border-b border-[#524437]/40 text-center">Active Days</th>
                  <th className="p-2 border-b border-[#524437]/40 text-right">Plan Qty</th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((line) => (
                  <tr
                    key={line.smtLine}
                    className="border-b border-[#524437]/20 hover:bg-[#1c1b1f] transition-colors"
                  >
                    <td className="p-2 font-semibold text-[#e5e1e6] font-['JetBrains_Mono'] sticky left-0 bg-[#131316] z-10 border-r border-[#524437]/30">
                      <span className="text-[#ffb86b]">{line.smtLine}</span>
                      <span className="text-[#38bdf8] mx-1">➔</span>
                      <span className="text-[#4edea3]">{line.pcaLine}</span>
                    </td>
                    <td className="p-2 text-center font-['JetBrains_Mono'] text-[#d7c3b2]">
                      {line.plant}
                    </td>
                    <td className="p-2 text-center font-['JetBrains_Mono'] text-[#ffb86b] font-bold">
                      {getSmtLineIeStdDL(site, line.smtLine, line.smtStdDL)}
                    </td>
                    <td className="p-2 text-center font-['JetBrains_Mono'] text-[#4edea3] font-bold">
                      {getPcaLineIeStdDL(site, line.pcaLine, line.pcaStdDL)}
                    </td>
                    {augustDates.map((dt) => {
                      const dayData = line.daily[dt];
                      const shifts = dayData?.shifts || 0;
                      const hasD = dayData?.hasDay;
                      const hasN = dayData?.hasNight;
                      const qty = dayData?.totalQty || 0;
                      const isSel = selectedDate === dt;

                      let badgeClass = 'text-[#d7c3b2]/20';
                      let badgeText = '-';

                      if (shifts === 2) {
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
                          onClick={() => setSelectedDate(dt)}
                          className={`p-1 text-center font-['JetBrains_Mono'] text-[10px] cursor-pointer ${
                            isSel ? 'bg-[#38bdf8]/20 ring-1 ring-[#38bdf8]' : 'hover:bg-[#201f23]'
                          }`}
                          title={`${line.smtLine} on ${dt}: ${qty} pcs (Shifts: ${shifts})`}
                        >
                          <span
                            className={`inline-block w-4 h-4 rounded-full leading-4 text-center ${badgeClass}`}
                          >
                            {badgeText}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-['JetBrains_Mono'] font-bold text-[#4edea3]">
                      {line.activeDays} Days
                    </td>
                    <td className="p-2 text-right font-['JetBrains_Mono'] font-bold text-[#e5e1e6]">
                      {line.totalPlanQty.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WHAT-IF SIMULATION */}
      {activeTab === 'SIMULATION' && (
        <div className="bg-[#1C1D22] border border-[#a78bfa]/40 rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-['Inter'] text-base font-bold text-[#e5e1e6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#a78bfa]">science</span>
                SMT ➔ PCA Line Coupling & Manpower Sandbox (What-If Simulation for {selectedDate})
              </h4>
              <p className="text-xs text-[#d7c3b2]/70 mt-1">
                Adjust operating shifts for any SMT line to instantly simulate the resulting direct manpower changes on the linked PCA line.
              </p>
            </div>
            {Object.keys(simulatedShifts).length > 0 && (
              <button
                onClick={handleResetSim}
                className="px-3 py-1.5 text-xs font-['JetBrains_Mono'] font-bold bg-[#ffb86b] text-[#492900] rounded hover:opacity-90 transition-all"
              >
                Reset to Actual Schedule
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayLineDetails.map((line) => (
              <div
                key={line.smtLine}
                className={`p-3.5 rounded-lg border transition-all ${
                  line.isSimulated
                    ? 'bg-[#a78bfa]/10 border-[#a78bfa] shadow-md'
                    : 'bg-[#131316] border-[#524437]/50'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-['JetBrains_Mono'] font-bold text-sm text-[#e5e1e6]">
                    <span className="text-[#ffb86b]">{line.smtLine}</span>
                    <span className="text-[#38bdf8] mx-1">➔</span>
                    <span className="text-[#4edea3]">{line.pcaLine}</span>
                  </span>
                  <span className="text-[10px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded bg-[#201f23] text-[#d7c3b2]/80 border border-[#524437]/50">
                    {line.plant}
                  </span>
                </div>

                <div className="text-xs text-[#d7c3b2]/80 space-y-1 mb-3 font-['JetBrains_Mono']">
                  <div className="flex justify-between">
                    <span>Original Shifts:</span>
                    <span className="text-white font-bold">{line.originalShifts} Shift(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Simulated Shifts:</span>
                    <span className="text-[#38bdf8] font-bold">{line.shifts} Shift(s)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#524437]/30">
                    <span>SMT DL:</span>
                    <span className="text-[#ffb86b] font-bold">{line.smtDL} DL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PCA Linked DL:</span>
                    <span className="text-[#4edea3] font-bold">{line.pcaDL} DL</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#524437]/30 font-bold">
                    <span>Total DL:</span>
                    <span className="text-[#38bdf8]">{line.totalDL} DL</span>
                  </div>
                </div>

                {/* Shift Selector Buttons (0S ~ 4S) */}
                <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-xs">
                  <span className="text-[11px] text-[#d7c3b2]/60 mr-1">Shifts:</span>
                  {[0, 1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleShiftOverride(line.smtLine, s)}
                      className={`flex-1 py-1 rounded text-center font-bold transition-all ${
                        line.shifts === s
                          ? 'bg-[#38bdf8] text-[#082f49] shadow-sm'
                          : 'bg-[#201f23] text-[#d7c3b2]/70 hover:bg-[#2a292d]'
                      }`}
                      title={s === 0 ? '0S (Offline)' : s === 1 ? '1S (Single Shift)' : s === 2 ? '2S (D + N)' : s === 3 ? '3S (Continuous)' : '4S (24/7)'}
                    >
                      {s}S
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
