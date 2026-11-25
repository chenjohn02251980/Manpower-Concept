import React, { useState, useMemo } from 'react';
import { SiteData, TimePeriod } from '../types';
import {
  querySiteHrManpower,
  getMonthlyBudgetManpower,
} from '../utils/apsSchedule';
import { getBaseMonthlyBudgetManpower } from '../utils/hrDatabase';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface HrActualViewProps {
  site: SiteData;
  sites?: Record<string, SiteData>;
  timePeriod: TimePeriod;
  selectedYear: number;
  selectedMonth: number;
  onNavigateToForecast: () => void;
}

export const HrActualView: React.FC<HrActualViewProps> = ({
  site,
  sites,
  selectedYear,
  selectedMonth,
  onNavigateToForecast,
}) => {
  const [selectedDeptCodeFilter, setSelectedDeptCodeFilter] = useState<string[]>([]);
  const [deptSearchQuery, setDeptSearchQuery] = useState<string>('');
  const [showRawDbRecords, setShowRawDbRecords] = useState<boolean>(true);

  // Full plant query (using site's assigned Department Codes from IE Standard)
  const baseHrQuery = useMemo(
    () => querySiteHrManpower(site, selectedYear, selectedMonth, sites),
    [site, selectedYear, selectedMonth, sites]
  );

  // Active filtered query (applying optional interactive Department Code filter in HR Actual)
  const effectiveFilterCodes = useMemo(() => {
    const q = deptSearchQuery.trim().toUpperCase();
    const assigned = baseHrQuery.totals.activeDeptCodes;
    if (selectedDeptCodeFilter.length > 0 && q) {
      return selectedDeptCodeFilter.filter((c) => c.toUpperCase().includes(q));
    }
    if (selectedDeptCodeFilter.length > 0) {
      return selectedDeptCodeFilter;
    }
    if (q) {
      return assigned.filter((c) => c.toUpperCase().includes(q));
    }
    return undefined;
  }, [baseHrQuery.totals.activeDeptCodes, selectedDeptCodeFilter, deptSearchQuery]);

  const hrQuery = useMemo(() => {
    if (!effectiveFilterCodes) return baseHrQuery;
    return querySiteHrManpower(site, selectedYear, selectedMonth, sites, effectiveFilterCodes);
  }, [baseHrQuery, site, selectedYear, selectedMonth, sites, effectiveFilterCodes]);

  const costCenterData = hrQuery.departmentRows;
  const matchedDbRecords = hrQuery.matchedRecords;
  const baseAnnualInfo = getBaseMonthlyBudgetManpower(site, selectedMonth);

  const totalMonthEndDL = hrQuery.totals.monthEndDL;
  const totalMonthEndIDL = hrQuery.totals.monthEndIDL;
  const totalMonthEndHC = hrQuery.totals.monthEndTotal;
  const totalW3DL = hrQuery.totals.w3DL;
  const totalApsDL = hrQuery.totals.apsDemandDL;
  const totalVariance = totalMonthEndDL - totalApsDL;

  const yearlyBudget = hrQuery.totals.budgetTotal;
  const yearlyBudgetDL = hrQuery.totals.budgetDL;
  const yearlyBudgetIDL = hrQuery.totals.budgetIDL;
  const annualBaseBudget = baseAnnualInfo.annualAverage;
  const budgetHitRate = Math.round(((totalApsDL + (hrQuery.apsPlan.fixedIDL || 0)) / (yearlyBudget || 1)) * 100);

  const toggleFilterCode = (code: string) => {
    setSelectedDeptCodeFilter((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Weekly trend for Recharts
  const weeklyTrend = [
    {
      week: 'Week 1 (W1)',
      SMT: costCenterData.find((r) => r.processType === 'SMT')?.w1DL || 0,
      PCA: costCenterData.find((r) => r.processType === 'PCA')?.w1DL || 0,
      Assembly: costCenterData.find((r) => r.processType === 'System Assembly')?.w1DL || 0,
      Support:
        (costCenterData.find((r) => r.processType === 'Quality')?.w1DL || 0) +
        (costCenterData.find((r) => r.processType === 'Troubleshooting')?.w1DL || 0) +
        (costCenterData.find((r) => r.processType === 'Warehouse')?.w1DL || 0) +
        (costCenterData.find((r) => r.processType === 'Other Support')?.w1DL || 0),
      total: costCenterData.reduce((sum, r) => sum + r.w1DL, 0),
    },
    {
      week: 'Week 2 (W2)',
      SMT: costCenterData.find((r) => r.processType === 'SMT')?.w2DL || 0,
      PCA: costCenterData.find((r) => r.processType === 'PCA')?.w2DL || 0,
      Assembly: costCenterData.find((r) => r.processType === 'System Assembly')?.w2DL || 0,
      Support:
        (costCenterData.find((r) => r.processType === 'Quality')?.w2DL || 0) +
        (costCenterData.find((r) => r.processType === 'Troubleshooting')?.w2DL || 0) +
        (costCenterData.find((r) => r.processType === 'Warehouse')?.w2DL || 0) +
        (costCenterData.find((r) => r.processType === 'Other Support')?.w2DL || 0),
      total: costCenterData.reduce((sum, r) => sum + r.w2DL, 0),
    },
    {
      week: 'Week 3 (W3 - Baseline)',
      SMT: costCenterData.find((r) => r.processType === 'SMT')?.w3DL || 0,
      PCA: costCenterData.find((r) => r.processType === 'PCA')?.w3DL || 0,
      Assembly: costCenterData.find((r) => r.processType === 'System Assembly')?.w3DL || 0,
      Support:
        (costCenterData.find((r) => r.processType === 'Quality')?.w3DL || 0) +
        (costCenterData.find((r) => r.processType === 'Troubleshooting')?.w3DL || 0) +
        (costCenterData.find((r) => r.processType === 'Warehouse')?.w3DL || 0) +
        (costCenterData.find((r) => r.processType === 'Other Support')?.w3DL || 0),
      total: totalW3DL,
    },
    {
      week: 'Week 4 (W4)',
      SMT: costCenterData.find((r) => r.processType === 'SMT')?.w4DL || 0,
      PCA: costCenterData.find((r) => r.processType === 'PCA')?.w4DL || 0,
      Assembly: costCenterData.find((r) => r.processType === 'System Assembly')?.w4DL || 0,
      Support:
        (costCenterData.find((r) => r.processType === 'Quality')?.w4DL || 0) +
        (costCenterData.find((r) => r.processType === 'Troubleshooting')?.w4DL || 0) +
        (costCenterData.find((r) => r.processType === 'Warehouse')?.w4DL || 0) +
        (costCenterData.find((r) => r.processType === 'Other Support')?.w4DL || 0),
      total: costCenterData.reduce((sum, r) => sum + r.w4DL, 0),
    },
    {
      week: 'Month-End (Final)',
      SMT: costCenterData.find((r) => r.processType === 'SMT')?.monthEndDL || 0,
      PCA: costCenterData.find((r) => r.processType === 'PCA')?.monthEndDL || 0,
      Assembly: costCenterData.find((r) => r.processType === 'System Assembly')?.monthEndDL || 0,
      Support:
        (costCenterData.find((r) => r.processType === 'Quality')?.monthEndDL || 0) +
        (costCenterData.find((r) => r.processType === 'Troubleshooting')?.monthEndDL || 0) +
        (costCenterData.find((r) => r.processType === 'Warehouse')?.monthEndDL || 0) +
        (costCenterData.find((r) => r.processType === 'Other Support')?.monthEndDL || 0),
      total: totalMonthEndDL,
    },
  ];

  // Keep reference to getMonthlyBudgetManpower to ensure consistent budget calculation
  void getMonthlyBudgetManpower;

  const isFilterActive = selectedDeptCodeFilter.length > 0 || deptSearchQuery.trim().length > 0;

  return (
    <div className="space-y-6 pb-8 select-none">
      {/* HR System Integration Status Banner */}
      <div className="bg-gradient-to-r from-[#1e1b24] via-[#1a1c24] to-[#141d24] border border-[#a78bfa]/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#a78bfa]/15 border border-[#a78bfa]/30 flex items-center justify-center text-[#a78bfa] shrink-0">
            <span className="material-symbols-outlined text-xl">hub</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-['JetBrains_Mono'] font-bold text-[#a78bfa] uppercase tracking-wider">
                HR Master Database Synced · Department Code Filter
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                {hrQuery.totals.activeDeptCodes.length} DEPT CODES MATCHED
              </span>
            </div>
            <p className="text-xs text-[#d7c3b2]/80 mt-0.5 font-['Inter']">
              Querying HR Database by <strong className="text-[#a78bfa]">Department Code</strong> for{' '}
              <strong>{selectedYear} Month {selectedMonth}</strong>: Budget ({yearlyBudget.toLocaleString()} HC: DL {yearlyBudgetDL} / IDL {yearlyBudgetIDL}) &amp; Paid Manpower ({totalMonthEndHC.toLocaleString()} HC: DL {totalMonthEndDL} / IDL {totalMonthEndIDL}) for <strong className="text-white">{site.name}</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-['JetBrains_Mono']">
          <div className="px-3 py-1.5 rounded bg-[#131316] border border-[#524437]/50 text-right">
            <span className="text-[10px] text-[#d7c3b2]/60 block">M{selectedMonth} Budget (Filtered)</span>
            <span className="text-sm font-bold text-[#a78bfa]">{yearlyBudget.toLocaleString()} HC</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-[#131316] border border-[#524437]/50 text-right">
            <span className="text-[10px] text-[#d7c3b2]/60 block">M{selectedMonth} Paid (Filtered)</span>
            <span className="text-sm font-bold text-[#5de6ff]">{totalMonthEndHC.toLocaleString()} HC</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-[#131316] border border-[#524437]/50 text-right">
            <span className="text-[10px] text-[#d7c3b2]/60 block">Budget Hit Rate</span>
            <span className="text-sm font-bold text-[#ffb86b]">{budgetHitRate}%</span>
          </div>
        </div>
      </div>

      {/* Department Code Filter Controls */}
      <div className="bg-[#1C1D22] border border-[#a78bfa]/35 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a78bfa] text-lg">filter_alt</span>
            <div>
              <h4 className="font-['Inter'] text-sm font-semibold text-[#e5e1e6]">
                HR Database Department Code Filter (Budget &amp; Paid Manpower)
              </h4>
              <p className="text-[11px] text-[#d7c3b2]/70 font-['Inter']">
                HR Actual automatically filters Budget &amp; Paid Manpower records from the HR database using each department&apos;s Department Code(s). Click any code below to isolate specific records.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined text-sm text-[#d7c3b2]/50 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={deptSearchQuery}
                onChange={(e) => setDeptSearchQuery(e.target.value)}
                placeholder="Search Dept Code..."
                className="pl-8 pr-3 py-1.5 bg-[#131316] border border-[#524437]/60 focus:border-[#a78bfa] rounded-md text-xs font-['JetBrains_Mono'] text-[#e5e1e6] placeholder:text-[#d7c3b2]/40 focus:outline-none w-44"
              />
            </div>

            {isFilterActive && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDeptCodeFilter([]);
                  setDeptSearchQuery('');
                }}
                className="px-2.5 py-1.5 rounded-md bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 border border-[#a78bfa]/50 text-xs font-['JetBrains_Mono'] font-bold text-[#a78bfa] cursor-pointer transition-colors"
              >
                Reset Filter
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateToForecast}
              className="px-2.5 py-1.5 rounded-md bg-[#131316] hover:bg-[#201f23] border border-[#524437]/60 hover:border-[#ffb86b]/50 text-xs font-['JetBrains_Mono'] text-[#d7c3b2] hover:text-[#ffb86b] cursor-pointer transition-colors flex items-center gap-1"
              title="Edit Department Codes in IE Standard"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Edit Dept Codes</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedDeptCodeFilter([])}
            className={`px-2.5 py-1 rounded text-[11px] font-['JetBrains_Mono'] font-bold border transition-all cursor-pointer ${
              selectedDeptCodeFilter.length === 0
                ? 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]'
                : 'bg-[#131316] text-[#d7c3b2]/70 border-[#524437]/50 hover:border-[#a78bfa]/50'
            }`}
          >
            ALL ASSIGNED ({baseHrQuery.totals.activeDeptCodes.length})
          </button>
          {baseHrQuery.totals.activeDeptCodes.map((code) => {
            const isSelected = selectedDeptCodeFilter.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleFilterCode(code)}
                className={`px-2.5 py-1 rounded text-[11px] font-['JetBrains_Mono'] font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#5de6ff]/20 text-[#5de6ff] border-[#5de6ff]'
                    : 'bg-[#131316] text-[#a78bfa]/90 border-[#a78bfa]/30 hover:border-[#a78bfa]'
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Top Metric Cards (5 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Budget Manpower (Filtered from HR DB by Department Code) */}
        <div className="bg-[#1C1D22] border border-[#a78bfa]/50 p-5 rounded-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#a78bfa] uppercase">
            <span>Budget Manpower (HR DB)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#a78bfa]/20 border border-[#a78bfa]/40 font-bold">
              DEPT FILTER
            </span>
          </div>
          <div className="text-3xl font-bold font-['JetBrains_Mono'] text-[#a78bfa] mt-2">
            {yearlyBudget.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#d7c3b2]/60">HC</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            M{selectedMonth} Budget (DL: {yearlyBudgetDL} · IDL: {yearlyBudgetIDL}) · Base: {annualBaseBudget} HC
          </p>
        </div>

        <div className="bg-[#1C1D22] border border-[#524437]/60 p-5 rounded-lg">
          <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/80 uppercase block">
            Month-End Actual Paid (HR DB)
          </span>
          <div className="text-3xl font-bold font-['JetBrains_Mono'] text-[#5de6ff] mt-2">
            {totalMonthEndDL.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            Paid IDL: {totalMonthEndIDL} · Total: {totalMonthEndHC.toLocaleString()} HC (By Dept Code)
          </p>
        </div>

        <div className="bg-[#1C1D22] border border-[#524437]/60 p-5 rounded-lg">
          <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/80 uppercase block">
            Week 3 (W3) Snapshot Paid DL
          </span>
          <div className="text-3xl font-bold font-['JetBrains_Mono'] text-[#ffb86b] mt-2">
            {totalW3DL.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            Baseline headcount at APS plan release
          </p>
        </div>

        <div className="bg-[#1C1D22] border border-[#524437]/60 p-5 rounded-lg">
          <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/80 uppercase block">
            Monthly APS Demand DL
          </span>
          <div className="text-3xl font-bold font-['JetBrains_Mono'] text-[#e5e1e6] mt-2">
            {totalApsDL.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            Derived from active lines and shifts
          </p>
        </div>

        <div className="bg-[#1C1D22] border border-[#524437]/60 p-5 rounded-lg">
          <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/80 uppercase block">
            Actual Paid vs APS Variance Gap
          </span>
          <div
            className={`text-3xl font-bold font-['JetBrains_Mono'] mt-2 ${
              totalVariance < 0 ? 'text-[#F59E0B]' : 'text-[#4edea3]'
            }`}
          >
            {totalVariance > 0 ? `+${totalVariance}` : totalVariance}{' '}
            <span className="text-sm font-normal text-[#d7c3b2]/60">DL</span>
          </div>
          <p className="text-[11px] text-[#d7c3b2]/60 mt-1">
            {totalVariance < 0
              ? 'Deficit: recruitment & OT prioritized'
              : 'Adequate: headcount satisfies production schedule'}
          </p>
        </div>
      </div>

      {/* 2. Department Code Weekly & Month-End Payroll + Budget Matrix Table */}
      <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-['Inter'] text-base font-semibold text-[#e5e1e6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb86b]">domain</span>
              Department Code Weekly &amp; Month-End Payroll &amp; Budget Tracking
            </h4>
            <p className="text-xs text-[#d7c3b2]/70 mt-0.5">
              HR Budget &amp; Paid Manpower fetched from HR database by assigned Department Code and compared against APS demand
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-[#524437]/40 bg-[#131316]">
          <table className="w-full text-left font-['Inter'] text-xs">
            <thead className="bg-[#201f23] text-[#d7c3b2]/80 font-['JetBrains_Mono']">
              <tr>
                <th className="p-3 border-b border-[#524437]/40">Department</th>
                <th className="p-3 border-b border-[#524437]/40 text-center">Department Code</th>
                <th className="p-3 border-b border-[#524437]/40 text-right bg-[#a78bfa]/10 text-[#a78bfa]">
                  HR Budget (HC)
                </th>
                <th className="p-3 border-b border-[#524437]/40 text-right">W1 Paid</th>
                <th className="p-3 border-b border-[#524437]/40 text-right">W2 Paid</th>
                <th className="p-3 border-b border-[#524437]/40 text-right bg-[#ffb86b]/10 text-[#ffb86b]">
                  W3 (Baseline)
                </th>
                <th className="p-3 border-b border-[#524437]/40 text-right">W4 Paid</th>
                <th className="p-3 border-b border-[#524437]/40 text-right bg-[#5de6ff]/10 text-[#5de6ff] font-bold">
                  Month-End DL
                </th>
                <th className="p-3 border-b border-[#524437]/40 text-right text-[#c084fc]">
                  Paid IDL
                </th>
                <th className="p-3 border-b border-[#524437]/40 text-right">Demand Schedule</th>
                <th className="p-3 border-b border-[#524437]/40 text-right">Variance (Gap)</th>
                <th className="p-3 border-b border-[#524437]/40 text-center">Attendance</th>
                <th className="p-3 border-b border-[#524437]/40 text-center">Status &amp; Action</th>
              </tr>
            </thead>
            <tbody>
              {costCenterData.map((row) => {
                const codes = row.deptCodes || row.costCenters;
                return (
                  <tr
                    key={row.department}
                    className="border-b border-[#524437]/20 hover:bg-[#1c1b1f] transition-colors"
                  >
                    <td className="p-3 font-semibold text-[#e5e1e6]">{row.department}</td>
                    <td className="p-3 text-center">
                      {codes.length === 0 ? (
                        <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/40 italic">
                          No Dept Code
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {codes.map((cc) => (
                            <span
                              key={cc}
                              className="px-1.5 py-0.5 rounded bg-[#201f23] border border-[#a78bfa]/40 text-[11px] font-bold text-[#a78bfa] font-['JetBrains_Mono']"
                            >
                              {cc}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td
                      className="p-3 text-right font-['JetBrains_Mono'] font-bold text-[#a78bfa] bg-[#a78bfa]/5"
                      title={`Budget DL: ${row.budgetDL ?? 0} / Budget IDL: ${row.budgetIDL ?? 0}`}
                    >
                      {(row.budgetTotal ?? 0).toLocaleString()}
                      <span className="block text-[9px] font-normal text-[#d7c3b2]/60">
                        {row.budgetDL ?? 0} DL / {row.budgetIDL ?? 0} IDL
                      </span>
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]">
                      {row.w1DL}
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]">
                      {row.w2DL}
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b] bg-[#ffb86b]/5">
                      {row.w3DL}
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] text-[#d7c3b2]">
                      {row.w4DL}
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] font-bold text-[#5de6ff] bg-[#5de6ff]/5 text-sm">
                      {row.monthEndDL}
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] font-semibold text-[#c084fc]">
                      {row.monthEndIDL ?? 0}
                    </td>
                    <td className="p-3 text-right font-['JetBrains_Mono'] text-[#e5e1e6]">
                      {row.apsDemandDL}
                    </td>
                    <td
                      className={`p-3 text-right font-['JetBrains_Mono'] font-bold ${
                        row.varianceDL < 0 ? 'text-[#F59E0B]' : 'text-[#4edea3]'
                      }`}
                    >
                      {row.varianceDL > 0 ? `+${row.varianceDL}` : row.varianceDL}
                    </td>
                    <td className="p-3 text-center font-['JetBrains_Mono'] text-[#d7c3b2]">
                      {row.attendanceRate}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold border ${
                          row.status === 'DEFICIT'
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                            : row.status === 'SURPLUS'
                            ? 'bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3]/40'
                            : 'bg-[#5de6ff]/20 text-[#5de6ff] border-[#5de6ff]/40'
                        }`}
                        title={row.actionNeeded}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[#201f23] font-['JetBrains_Mono'] font-bold text-xs text-[#e5e1e6]">
              <tr>
                <td className="p-3" colSpan={2}>
                  Total Plant Paid &amp; Budget Headcount (By Dept Code)
                </td>
                <td className="p-3 text-right text-[#a78bfa] bg-[#a78bfa]/10">
                  {yearlyBudget.toLocaleString()}
                  <span className="block text-[9px] font-normal text-[#d7c3b2]/70">
                    {yearlyBudgetDL} DL / {yearlyBudgetIDL} IDL
                  </span>
                </td>
                <td className="p-3 text-right text-[#d7c3b2]">
                  {costCenterData.reduce((sum, r) => sum + r.w1DL, 0)}
                </td>
                <td className="p-3 text-right text-[#d7c3b2]">
                  {costCenterData.reduce((sum, r) => sum + r.w2DL, 0)}
                </td>
                <td className="p-3 text-right text-[#ffb86b] bg-[#ffb86b]/10">
                  {totalW3DL}
                </td>
                <td className="p-3 text-right text-[#d7c3b2]">
                  {costCenterData.reduce((sum, r) => sum + r.w4DL, 0)}
                </td>
                <td className="p-3 text-right text-[#5de6ff] bg-[#5de6ff]/10 text-sm">
                  {totalMonthEndDL}
                </td>
                <td className="p-3 text-right text-[#c084fc]">
                  {totalMonthEndIDL}
                </td>
                <td className="p-3 text-right text-[#e5e1e6]">{totalApsDL}</td>
                <td
                  className={`p-3 text-right ${
                    totalVariance < 0 ? 'text-[#F59E0B]' : 'text-[#4edea3]'
                  }`}
                >
                  {totalVariance > 0 ? `+${totalVariance}` : totalVariance}
                </td>
                <td className="p-3 text-center text-[#d7c3b2]">98.2%</td>
                <td className="p-3 text-center text-[#ffb86b]">
                  {totalVariance < 0 ? 'DEFICIT GAP' : 'BALANCED'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 3. HR Database Matched Records by Department Code */}
      <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h4 className="font-['Inter'] text-base font-semibold text-[#e5e1e6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#a78bfa]">database</span>
              HR Database Filtered Records (Per Department Code)
            </h4>
            <p className="text-xs text-[#d7c3b2]/70 mt-0.5">
              Individual Department Code records queried from the HR Database for M{selectedMonth} Budget &amp; Paid Manpower aggregation ({matchedDbRecords.length} matched records)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRawDbRecords(!showRawDbRecords)}
            className="px-3 py-1.5 rounded bg-[#131316] hover:bg-[#201f23] border border-[#524437]/50 text-xs font-['JetBrains_Mono'] text-[#d7c3b2] cursor-pointer flex items-center gap-1"
          >
            <span>{showRawDbRecords ? 'Hide Records' : 'Show Records'}</span>
            <span className="material-symbols-outlined text-sm">
              {showRawDbRecords ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {showRawDbRecords && (
          <div className="overflow-x-auto rounded border border-[#524437]/40 bg-[#131316]">
            <table className="w-full text-left font-['Inter'] text-xs">
              <thead className="bg-[#201f23] text-[#d7c3b2]/80 font-['JetBrains_Mono'] text-[11px]">
                <tr>
                  <th className="p-2.5 border-b border-[#524437]/40">Department Code</th>
                  <th className="p-2.5 border-b border-[#524437]/40">HR Department Name</th>
                  <th className="p-2.5 border-b border-[#524437]/40">Function</th>
                  <th className="p-2.5 border-b border-[#524437]/40 text-right text-[#a78bfa]">Budget DL</th>
                  <th className="p-2.5 border-b border-[#524437]/40 text-right text-[#c4b5fd]">Budget IDL</th>
                  <th className="p-2.5 border-b border-[#524437]/40 text-right text-[#a78bfa] font-bold">Budget Total</th>
                  <th className="p-2.5 border-b border-[#524437]/40 text-right">W3 Paid DL</th>
                  <th className="p-2.5 border-b border-[#524437]/40 text-right text-[#5de6ff]">Paid DL</th>
                  <th className="p-2.5 border-b border-[#524437]/40 text-right text-[#c084fc]">Paid IDL</th>
                  <th className="p-2.5 border-b border-[#524437]/40 text-right text-[#5de6ff] font-bold">Paid Total</th>
                  <th className="p-2.5 border-b border-[#524437]/40 text-center">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#524437]/20 font-['JetBrains_Mono']">
                {matchedDbRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-center text-[#d7c3b2]/50 italic">
                      No HR Database records matched the selected Department Code filter.
                    </td>
                  </tr>
                ) : (
                  matchedDbRecords.map((rec) => (
                    <tr key={`${rec.processType}-${rec.deptCode}`} className="hover:bg-[#1c1b1f] transition-colors">
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#201f23] border border-[#a78bfa]/40 text-[11px] font-bold text-[#a78bfa]">
                          {rec.deptCode}
                        </span>
                      </td>
                      <td className="p-2.5 font-['Inter'] text-[#e5e1e6]">{rec.label}</td>
                      <td className="p-2.5 text-[#d7c3b2]/80">{rec.department}</td>
                      <td className="p-2.5 text-right text-[#a78bfa]">{rec.budgetDL}</td>
                      <td className="p-2.5 text-right text-[#c4b5fd]">{rec.budgetIDL}</td>
                      <td className="p-2.5 text-right font-bold text-[#a78bfa]">{rec.budgetTotal}</td>
                      <td className="p-2.5 text-right text-[#ffb86b]">{rec.w3DL}</td>
                      <td className="p-2.5 text-right text-[#5de6ff]">{rec.monthEndDL}</td>
                      <td className="p-2.5 text-right text-[#c084fc]">{rec.monthEndIDL}</td>
                      <td className="p-2.5 text-right font-bold text-[#5de6ff]">{rec.monthEndTotal}</td>
                      <td className="p-2.5 text-center text-[#d7c3b2]">{rec.attendanceRate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Weekly Payroll Progression Visual Chart */}
      <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-['Inter'] text-base font-semibold text-[#e5e1e6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb86b]">stacked_bar_chart</span>
              Weekly (W1 ~ W4) &amp; Month-End Paid Headcount Progression
            </h4>
            <p className="text-xs text-[#d7c3b2]/70 mt-0.5">
              Cumulative weekly punch-clock progression towards month-end final payroll reconciliation
            </p>
          </div>
        </div>

        <div className="w-full h-[300px] bg-[#131316]/60 border border-[#524437]/30 rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#524437" opacity={0.3} />
              <XAxis
                dataKey="week"
                stroke="#d7c3b2"
                tick={{ fill: '#d7c3b2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              />
              <YAxis
                stroke="#d7c3b2"
                tick={{ fill: '#d7c3b2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1D22',
                  borderColor: '#524437',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }} />
              <Bar dataKey="SMT" name="SMT Process" fill="#ffb86b" stackId="a" />
              <Bar dataKey="PCA" name="PCA Process" fill="#cd8939" stackId="a" />
              <Bar dataKey="Assembly" name="System Assembly" fill="#5de6ff" stackId="a" />
              <Bar dataKey="Support" name="QA / TS / WH / Other Support" fill="#a78bfa" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
