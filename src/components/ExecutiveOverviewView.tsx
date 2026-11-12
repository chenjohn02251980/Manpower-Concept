import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { SiteData, TimePeriod, CostCenterPayrollWeekly, AnnualManpowerTab } from '../types';
import { calculateSiteMetrics } from '../utils/calculations';
import {
  generateMonthlyApsPlan,
  generateCostCenterPayrollData,
  generate12MonthTrend,
  getMonthlyApsVolumes,
  getMonthlyBudgetManpower,
} from '../utils/apsSchedule';
import { getOrInitSiteMonthlyData } from '../utils/monthlyDepartmentHelper';
import { parseCostCenters } from './CostCenterMultiPicker';

interface ExecutiveOverviewViewProps {
  sites: Record<string, SiteData>;
  currentSite: SiteData;
  timePeriod: TimePeriod;
  selectedYear: number;
  selectedMonth: number;
  onChangeMonth: (month: number) => void;
  onSelectSite: (siteId: string) => void;
  onNavigateToForecast: () => void;
  summaryCards?: React.ReactNode;
  annualManpowerTab?: AnnualManpowerTab;
  onAnnualManpowerTabChange?: (tab: AnnualManpowerTab) => void;
}

const AnnualCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isTotalDeficit = (data.varianceGap ?? 0) < 0;
    const isDlDeficit = (data.dlVarianceGap ?? 0) < 0;

    const totalAps = data.totalApsDemand ?? ((data.apsDemandDL || 0) + (data.apsDemandIDL || 0));
    const totalHr = data.totalHrActual ?? ((data.hrActualDL || 0) + (data.hrActualIDL || 0));

    return (
      <div className="bg-[#131316]/95 border border-[#524437] rounded-lg p-4 shadow-2xl backdrop-blur-md text-xs font-['Inter'] min-w-[280px]">
        <div className="font-['JetBrains_Mono'] text-[#ffb86b] font-bold pb-2 border-b border-[#524437]/50 mb-2.5 flex items-center justify-between gap-4">
          <span className="text-sm">{label} — APS vs HR Headcount Analysis</span>
          <div className="flex items-center gap-1">
            {data.isHistoricalAps && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40">
                Jan–Aug APS Plan
              </span>
            )}
            {data.isSelected && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#ffb86b] text-[#492900] font-bold">
                CURRENT
              </span>
            )}
          </div>
        </div>

        {/* 1. Yearly Budget Manpower Target */}
        {data.yearlyBudget && (
          <div className="mb-2.5 pb-2 border-b border-[#524437]/30 space-y-1 font-['JetBrains_Mono']">
            <div className="flex justify-between items-center text-xs text-[#a78bfa]">
              <span className="font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#a78bfa]"></span>
                Yearly Budget Total (DL+IDL):
              </span>
              <span className="font-bold text-[#e5e1e6] text-sm">
                {data.yearlyBudget.toLocaleString()} HC
              </span>
            </div>
            <div className="flex justify-between pl-4 text-[11px] text-[#d7c3b2]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#a78bfa]"></span>
                Budget Direct DL:
              </span>
              <span className="font-semibold text-white">
                {(data.yearlyBudgetDL || 0).toLocaleString()} DL
              </span>
            </div>
            <div className="flex justify-between pl-4 text-[11px] text-[#d7c3b2]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
                Budget Indirect IDL:
              </span>
              <span className="font-semibold text-white">
                {(data.yearlyBudgetIDL || 0).toLocaleString()} IDL
              </span>
            </div>
            <div className="flex justify-between pl-4 text-[11px] text-[#ffb86b]">
              <span>Budget Hit Rate (APS / Budget):</span>
              <span className="font-bold">
                {Math.round(((totalAps ?? 0) / (data.yearlyBudget || 1)) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* 2. APS Total Headcount (DL + IDL) */}
        <div className="mb-2.5 pb-2 border-b border-[#524437]/30 space-y-1 font-['JetBrains_Mono']">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#ffb86b] font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ffb86b]"></span>
              APS Demand Total (DL+IDL):
            </span>
            <span className="font-bold text-[#ffb86b] text-sm">
              {(totalAps ?? 0).toLocaleString()} HC
            </span>
          </div>
          <div className="flex justify-between pl-4 text-[11px] text-[#d7c3b2]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ffb86b]"></span>
              Direct DL:
            </span>
            <span className="font-semibold text-white">
              {(data.apsDemandDL ?? 0).toLocaleString()} DL
            </span>
          </div>
          <div className="flex justify-between pl-4 text-[11px] text-[#d7c3b2]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#fb923c]"></span>
              Indirect IDL:
            </span>
            <span className="font-semibold text-white">
              {(data.apsDemandIDL || 0).toLocaleString()} IDL
            </span>
          </div>
        </div>

        {/* 3. HR Paid Total Headcount (DL + IDL) */}
        <div className="mb-2.5 pb-2 border-b border-[#524437]/30 space-y-1 font-['JetBrains_Mono']">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#5de6ff] font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#5de6ff]"></span>
              HR Paid Total (DL+IDL):
            </span>
            <span className="font-bold text-[#5de6ff] text-sm">
              {(totalHr ?? 0).toLocaleString()} HC
            </span>
          </div>
          <div className="flex justify-between pl-4 text-[11px] text-[#d7c3b2]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#5de6ff]"></span>
              Direct DL:
            </span>
            <span className="font-semibold text-white">
              {(data.hrActualDL ?? 0).toLocaleString()} DL
            </span>
          </div>
          <div className="flex justify-between pl-4 text-[11px] text-[#d7c3b2]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#c084fc]"></span>
              Indirect IDL:
            </span>
            <span className="font-semibold text-white">
              {(data.hrActualIDL || 0).toLocaleString()} IDL
            </span>
          </div>
        </div>

        {/* 4. Net Variance & Fulfillment */}
        <div className="space-y-1 font-['JetBrains_Mono']">
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-[#d7c3b2]">Net Total GAP:</span>
            <span
              className={`font-bold ${
                isTotalDeficit ? 'text-[#F59E0B]' : 'text-[#4edea3]'
              }`}
            >
              {data.varianceGap > 0 ? `+${data.varianceGap}` : data.varianceGap} HC
            </span>
          </div>
          <div className="flex justify-between gap-4 text-[11px] text-[#d7c3b2]/80">
            <span>Net Direct DL GAP:</span>
            <span
              className={`font-semibold ${
                isDlDeficit ? 'text-[#F59E0B]' : 'text-[#4edea3]'
              }`}
            >
              {(data.dlVarianceGap ?? data.varianceGap) > 0
                ? `+${data.dlVarianceGap ?? data.varianceGap}`
                : data.dlVarianceGap ?? data.varianceGap}{' '}
              DL
            </span>
          </div>
          <div className="flex justify-between gap-4 text-[11px] text-[#ffb86b] pt-1 border-t border-[#524437]/30">
            <span>Budget Manpower Hit-rate:</span>
            <span className="font-bold">
              {data.budgetHitRate ?? Math.round(((totalAps ?? 0) / (data.yearlyBudget || 1)) * 100)}%
            </span>
          </div>
          <div className="flex justify-between gap-4 text-[11px] text-[#4edea3]">
            <span>Manpower Utilization (Demand / Paid):</span>
            <span className="font-bold">
              {data.manpowerUtilization ?? Math.round(((totalAps ?? 0) / (totalHr || 1)) * 100)}%
            </span>
          </div>
          <div className="flex justify-between gap-4 text-[11px] text-[#d7c3b2]/80">
            <span>Staffing Fulfillment:</span>
            <span className="font-bold text-[#e5e1e6]">
              {data.fulfillmentRate}%
            </span>
          </div>
          <div className="flex justify-between gap-4 text-[10px] text-[#d7c3b2]/50 pt-1">
            <span>Active Lines & Shifts:</span>
            <span className="text-[#e5e1e6]">
              {data.activeLines || 8} Lines · {data.totalShifts || 18} Shifts/day
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CostCenterCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const budget = data.yearlyBudget ?? 0;
    const aps = data.apsDemand ?? 0;
    const hr = data.hrActual ?? 0;
    const hitRate = Math.round((aps / (budget || 1)) * 100);
    const netGap = hr - aps;
    const buffer = budget - aps;

    return (
      <div className="bg-[#1C1D22] border border-[#524437] p-3 rounded-lg shadow-xl text-xs font-['Inter'] min-w-[280px]">
        <div className="font-semibold text-white mb-1.5 border-b border-[#524437]/50 pb-1.5 flex justify-between items-center">
          <span>{data.fullName || label}</span>
          <span className="text-[10px] text-[#ffb86b] font-['JetBrains_Mono'] bg-[#ffb86b]/10 px-1.5 py-0.5 rounded border border-[#ffb86b]/20">
            Hit Rate: {hitRate}%
          </span>
        </div>
        {data.costCenters && data.costCenters.length > 0 && (
          <div className="text-[10px] text-[#a78bfa] font-['JetBrains_Mono'] mb-2 flex flex-wrap gap-1">
            {data.costCenters.map((cc: string) => (
              <span key={cc} className="bg-[#a78bfa]/10 px-1.5 py-0.5 rounded border border-[#a78bfa]/20">
                {cc}
              </span>
            ))}
          </div>
        )}
        <div className="space-y-1 font-['JetBrains_Mono'] text-[11px]">
          {/* 1. Yearly Budget */}
          <div className="flex justify-between text-[#a78bfa]">
            <span>1. Yearly Budget ({data.monthLabel || 'Selected Month'}):</span>
            <span className="font-bold">{budget.toLocaleString()} HC</span>
          </div>
          {data.budgetDL !== undefined && (
            <div className="flex justify-between text-[#a78bfa]/70 text-[10px] pl-3">
              <span>DL: {data.budgetDL.toLocaleString()} HC | IDL: {data.budgetIDL?.toLocaleString()} HC</span>
              <span className="text-[9px] uppercase tracking-wide">DL+IDL</span>
            </div>
          )}

          {/* 2. APS Demand Manpower */}
          <div className="flex justify-between text-[#ffb86b] mt-1">
            <span>2. APS Demand Manpower:</span>
            <span className="font-bold">{aps.toLocaleString()} HC</span>
          </div>
          {data.apsDL !== undefined && (
            <div className="flex justify-between text-[#ffb86b]/70 text-[10px] pl-3">
              <span>DL: {data.apsDL.toLocaleString()} HC | IDL: {data.apsIDL?.toLocaleString()} HC</span>
              <span className="text-[9px] uppercase tracking-wide">DL+IDL</span>
            </div>
          )}

          {/* 3. HR Paid Manpower */}
          <div className="flex justify-between text-[#5de6ff] mt-1">
            <span>3. HR Paid Manpower:</span>
            <span className="font-bold">{hr.toLocaleString()} HC</span>
          </div>
          {data.hrDL !== undefined && (
            <div className="flex justify-between text-[#5de6ff]/70 text-[10px] pl-3">
              <span>DL: {data.hrDL.toLocaleString()} HC | IDL: {data.hrIDL?.toLocaleString()} HC</span>
              <span className="text-[9px] uppercase tracking-wide">DL+IDL</span>
            </div>
          )}

          <div className="pt-2 mt-1.5 border-t border-[#524437]/40 space-y-1">
            <div className="flex justify-between">
              <span className="text-[#d7c3b2]/80">Budget Hit Rate (APS / Budget):</span>
              <span className="font-bold text-[#ffb86b]">{hitRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#d7c3b2]/80">Budget Headroom:</span>
              <span className={`font-bold ${buffer >= 0 ? 'text-[#4edea3]' : 'text-[#F59E0B]'}`}>
                {buffer > 0 ? `+${buffer}` : buffer} HC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#d7c3b2]/80">HR Net Gap (Paid - Demand):</span>
              <span className={`font-bold ${netGap >= 0 ? 'text-[#4edea3]' : 'text-[#F59E0B]'}`}>
                {netGap > 0 ? `+${netGap}` : netGap} HC
              </span>
            </div>
            {data.diagnosis && (
              <div className="pt-1.5 border-t border-[#524437]/40 flex items-center justify-between text-[10px]">
                <span className="text-[#d7c3b2]/80">主要差異分析:</span>
                <span
                  className="font-bold px-1.5 py-0.5 rounded border"
                  style={{
                    color: data.diagnosis.driverColor,
                    backgroundColor: `${data.diagnosis.driverColor}20`,
                    borderColor: `${data.diagnosis.driverColor}50`,
                  }}
                >
                  {data.diagnosis.driverName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// -------------------------------------------------------------
// -------------------------------------------------------------
// Cost Center Headcount Variance Diagnostic Engine
// Analyzes: 1. Budget overrun vs 2. APS Demand & HR Paid Gap
// Identifies primary driver: Yearly Budget (#a78bfa) / APS Demand (#ffb86b) / HR Paid Manpower (#5de6ff)
// -------------------------------------------------------------
export interface CostCenterDiagnosisResult {
  primaryDriver: 'budget' | 'demand' | 'paid';
  driverName: 'Yearly Budget' | 'APS Demand' | 'HR Paid Manpower';
  driverColor: string; // '#a78bfa' | '#ffb86b' | '#5de6ff'
  driverBg: string;
  driverBorder: string;
  varianceCategory: 'Budget Overrun' | 'Demand vs Paid Gap' | 'Budget Surplus' | 'Balanced Headcount';
  budgetGap: number; // demand - budget (> 0 means demand exceeds budget)
  paidBudgetGap: number; // paid - budget (> 0 means paid exceeds budget)
  hrDemandGap: number; // paid - demand (< 0 means paid shortage, > 0 means surplus)
  analysisSummary: string;
  actionText: string;
}

export function analyzeCostCenterVariance(
  yearlyBudget: number,
  apsDemand: number,
  hrActual: number,
  _processName?: string
): CostCenterDiagnosisResult {
  const budgetGap = apsDemand - yearlyBudget; // APS vs Budget
  const paidBudgetGap = hrActual - yearlyBudget; // HR vs Budget
  const hrDemandGap = hrActual - apsDemand; // HR vs APS (shortfall if < 0)

  const absBudgetGap = Math.abs(budgetGap);
  const absPaidBudgetGap = Math.abs(paidBudgetGap);
  const absHrDemandGap = Math.abs(hrDemandGap);

  let primaryDriver: 'budget' | 'demand' | 'paid' = 'demand';
  let driverName: 'Yearly Budget' | 'APS Demand' | 'HR Paid Manpower' = 'APS Demand';
  let driverColor = '#ffb86b';
  let driverBg = 'bg-[#ffb86b]/15';
  let driverBorder = 'border-[#ffb86b]/40';
  let varianceCategory: 'Budget Overrun' | 'Demand vs Paid Gap' | 'Budget Surplus' | 'Balanced Headcount' = 'Budget Overrun';
  let analysisSummary = '';
  let actionText = '';

  // 1. HR Paid diverges noticeably from APS Demand (hrDemandGap is dominant discrepancy)
  if (absHrDemandGap >= absBudgetGap && absHrDemandGap >= 3) {
    primaryDriver = 'paid';
    driverName = 'HR Paid Manpower';
    driverColor = '#5de6ff';
    driverBg = 'bg-[#5de6ff]/15';
    driverBorder = 'border-[#5de6ff]/40';
    varianceCategory = 'Demand vs Paid Gap';
    if (hrDemandGap < 0) {
      const budgetContext = budgetGap > 0
        ? `Demand exceeds budget by +${budgetGap} HC`
        : `Budget headroom +${Math.abs(budgetGap)} HC`;
      analysisSummary = `[Demand vs Paid Gap] Primarily driven by HR Paid shortage (-${Math.abs(hrDemandGap)} HC), ${budgetContext}; expedite recruitment & backfill.`;
      actionText = `Accelerate HR recruiting and shopfloor retention to close the -${Math.abs(hrDemandGap)} HC labor deficit.`;
    } else {
      analysisSummary = `[Demand vs Paid Gap] Primarily driven by HR Paid surplus (+${hrDemandGap} HC over APS demand); optimize shift deployment.`;
      actionText = `Review shift attendance and overtime hours; cross-deploy staff to support bottleneck processes.`;
    }
  }
  // 2. APS Demand exceeds Yearly Budget and is the dominant discrepancy
  else if (budgetGap > 0 && budgetGap >= absHrDemandGap) {
    primaryDriver = 'demand';
    driverName = 'APS Demand';
    driverColor = '#ffb86b';
    driverBg = 'bg-[#ffb86b]/15';
    driverBorder = 'border-[#ffb86b]/40';
    varianceCategory = 'Budget Overrun';
    const hrStatus = hrDemandGap < 0
      ? `HR paid shortage -${Math.abs(hrDemandGap)} HC`
      : hrDemandGap > 0
      ? `HR paid surplus +${hrDemandGap} HC`
      : `HR paid matches demand exactly`;
    analysisSummary = `[Budget Overrun] Primarily driven by APS Demand order ramp (+${budgetGap} HC vs budget); ${hrStatus}; submit supplemental budget approval.`;
    actionText = `Submit supplemental headcount request or project quota approval to management.`;
  }
  // 3. HR Paid is higher than budget and demand, pushing budget overrun
  else if (paidBudgetGap > 0 && hrDemandGap > 0) {
    primaryDriver = 'paid';
    driverName = 'HR Paid Manpower';
    driverColor = '#5de6ff';
    driverBg = 'bg-[#5de6ff]/15';
    driverBorder = 'border-[#5de6ff]/40';
    varianceCategory = 'Budget Overrun';
    analysisSummary = `[Budget Overrun] Primarily driven by HR Paid headcount (+${paidBudgetGap} HC vs budget, +${hrDemandGap} HC vs demand); tighten labor & payroll expenses.`;
    actionText = `Initiate staffing review and hiring controls on this process to prevent payroll overruns.`;
  }
  // 4. Both Demand and Paid are well below Budget (budget baseline is high / slack)
  else if (budgetGap < -3 && paidBudgetGap < -3) {
    primaryDriver = 'budget';
    driverName = 'Yearly Budget';
    driverColor = '#a78bfa';
    driverBg = 'bg-[#a78bfa]/15';
    driverBorder = 'border-[#a78bfa]/40';
    varianceCategory = 'Budget Surplus';
    analysisSummary = `[Budget Surplus] Driven by generous budget baseline (+${Math.abs(budgetGap)} HC headroom); demand and paid staffing remain safely within budget ceiling.`;
    actionText = `Ample budget headroom available for operational buffer during upcoming peak season.`;
  }
  // 5. Balanced or minor variance
  else {
    if (absBudgetGap > absHrDemandGap) {
      primaryDriver = budgetGap > 0 ? 'demand' : 'budget';
      driverName = budgetGap > 0 ? 'APS Demand' : 'Yearly Budget';
      driverColor = budgetGap > 0 ? '#ffb86b' : '#a78bfa';
      driverBg = budgetGap > 0 ? 'bg-[#ffb86b]/15' : 'bg-[#a78bfa]/15';
      driverBorder = budgetGap > 0 ? 'border-[#ffb86b]/40' : 'border-[#a78bfa]/40';
      varianceCategory = budgetGap > 0 ? 'Budget Overrun' : 'Budget Surplus';
      analysisSummary = budgetGap > 0
        ? `[Budget Overrun] Driven by minor APS Demand increase (+${budgetGap} HC vs budget), supply gap ${hrDemandGap >= 0 ? `+${hrDemandGap}` : hrDemandGap} HC.`
        : `[Budget Surplus] Minor variance from budget baseline (+${Math.abs(budgetGap)} HC headroom); operations stable.`;
      actionText = 'Process staffing stable; continue monitoring scheduling and fulfillment.';
    } else {
      primaryDriver = 'paid';
      driverName = 'HR Paid Manpower';
      driverColor = '#5de6ff';
      driverBg = 'bg-[#5de6ff]/15';
      driverBorder = 'border-[#5de6ff]/40';
      varianceCategory = 'Demand vs Paid Gap';
      analysisSummary = `[Demand vs Paid Gap] Minor fluctuation in HR Paid staffing (gap ${hrDemandGap >= 0 ? `+${hrDemandGap}` : hrDemandGap} HC, budget gap ${budgetGap >= 0 ? `+${budgetGap}` : budgetGap} HC).`;
      actionText = 'Shopfloor staffing aligns closely with schedule requirements; normal operations.';
    }
  }

  return {
    primaryDriver,
    driverName,
    driverColor,
    driverBg,
    driverBorder,
    varianceCategory,
    budgetGap,
    paidBudgetGap,
    hrDemandGap,
    analysisSummary,
    actionText,
  };
}

export const ExecutiveOverviewView: React.FC<ExecutiveOverviewViewProps> = ({
  sites,
  currentSite,
  timePeriod,
  selectedYear,
  selectedMonth,
  onChangeMonth,
  onSelectSite,
  onNavigateToForecast,
  summaryCards,
  annualManpowerTab: propAnnualManpowerTab,
  onAnnualManpowerTabChange,
}) => {
  const [activeAnnualTab, setActiveAnnualTab] = useState<AnnualManpowerTab>(() => {
    if (propAnnualManpowerTab) return propAnnualManpowerTab;
    try {
      const saved = localStorage.getItem('executive_annual_manpower_tab');
      if (saved === 'trend' || saved === 'matrix' || saved === 'both') {
        return saved as AnnualManpowerTab;
      }
    } catch {
      // ignore
    }
    return 'trend';
  });

  React.useEffect(() => {
    if (propAnnualManpowerTab) {
      setActiveAnnualTab(propAnnualManpowerTab);
    }
  }, [propAnnualManpowerTab]);

  const handleTabChange = (tab: AnnualManpowerTab) => {
    setActiveAnnualTab(tab);
    try {
      localStorage.setItem('executive_annual_manpower_tab', tab);
    } catch {
      // ignore
    }
    onAnnualManpowerTabChange?.(tab);
  };

  const currentMetrics = calculateSiteMetrics(currentSite, timePeriod);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = monthNames[selectedMonth - 1] || `Month ${selectedMonth}`;

  // Compute monthly APS plan and Cost Center payroll data
  const currentApsPlan = generateMonthlyApsPlan(currentSite, selectedYear, selectedMonth);
  const costCenterData = generateCostCenterPayrollData(currentSite, currentApsPlan);

  const monthlyApsDemandDL = currentApsPlan.totalApsDemandDL;
  const monthlyApsDemandIDL = currentMetrics.totalIDL;
  const monthlyApsTotal = monthlyApsDemandDL + monthlyApsDemandIDL;

  const hrMonthEndDL = costCenterData.reduce((sum, r) => sum + r.monthEndDL, 0);
  const hrMonthEndIDL = currentSite.actualHrIDL !== undefined ? currentSite.actualHrIDL : currentMetrics.totalIDL;
  const hrTotalPaid = hrMonthEndDL + hrMonthEndIDL;

  const netVariance = hrMonthEndDL - monthlyApsDemandDL;
  const netTotalVariance = hrTotalPaid - monthlyApsTotal;
  const fulfillmentRate = Math.round((hrTotalPaid / (monthlyApsTotal || 1)) * 100);

  // 12-Month Annual Trend Data
  const annualTrend = generate12MonthTrend(currentSite, selectedYear, selectedMonth);

  // Selected Month Budget Manpower & Department allocation
  const selectedMonthBudget = getMonthlyBudgetManpower(currentSite, selectedMonth);
  const monthlyDeptMap = getOrInitSiteMonthlyData(currentSite);
  const currentMonthDept = monthlyDeptMap[selectedMonth] || monthlyDeptMap[9] || Object.values(monthlyDeptMap)[0];

  // 1. Department & Snapshot References for DL + IDL
  const snap = currentMonthDept.snapshot;

  // Process IDL figures from snapshot (or site configuration fallback)
  const smtIDL = snap?.smtIdl ?? currentSite.smtIdl ?? 0;
  const pcaIDL = snap?.pcaIdl ?? currentSite.pcaIdl ?? 0;
  const sysIDL = snap?.assemblyIdl ?? currentSite.assemblyIdl ?? 0;
  const qcIDL = currentMonthDept.qcIDL ?? ((snap?.qualityControl?.pqcIDL ?? 0) + (snap?.qualityControl?.oqcIndirectIDL ?? 0));
  const tsIDL = currentMonthDept.tsIDL ?? (snap?.troubleShooting?.idlEntry ?? 0);
  const whIDL = currentMonthDept.whIDL ?? (snap?.warehouse?.adminIDL ?? 0);

  // Cost center rows
  const smtRow = costCenterData.find((r) => r.processType === 'SMT');
  const pcaRow = costCenterData.find((r) => r.processType === 'PCA');
  const sysRow = costCenterData.find((r) => r.processType === 'System Assembly');
  const qcRow = costCenterData.find((r) => r.processType === 'Quality');
  const tsRow = costCenterData.find((r) => r.processType === 'Troubleshooting');
  const whRow = costCenterData.find((r) => r.processType === 'Warehouse');

  // Fallback Cost Centers for processes
  const qcCostCenters = Array.from(new Set(parseCostCenters(currentSite.qualityControl?.oqcCostCenter)));
  const tsCostCenters = [currentSite.troubleShooting?.costCenter || 'CC-TS-7301'];
  const whCostCenters = [currentSite.warehouse?.costCenter || 'CC-WH-7401'];

  // Process DL demands
  const smtDL = smtRow?.apsDemandDL || 0;
  const pcaDL = pcaRow?.apsDemandDL || 0;
  const sysDL = sysRow?.apsDemandDL || 0;
  const qcDL = qcRow?.apsDemandDL ?? currentMonthDept.qcDL;
  const tsDL = tsRow?.apsDemandDL ?? currentMonthDept.tsDL;
  const whDL = whRow?.apsDemandDL ?? currentMonthDept.whDL;

  // Total APS Demands (DL + IDL)
  const smtApsTotal = smtDL + smtIDL;
  const pcaApsTotal = pcaDL + pcaIDL;
  const sysApsTotal = sysDL + sysIDL;
  const qcApsTotal = qcDL + qcIDL;
  const tsApsTotal = tsDL + tsIDL;
  const whApsTotal = whDL + whIDL;

  // HR Actuals DL & IDL
  const smtHrDL = smtRow?.monthEndDL || 0;
  const pcaHrDL = pcaRow?.monthEndDL || 0;
  const sysHrDL = sysRow?.monthEndDL || 0;
  const qcHrDL = qcRow?.monthEndDL ?? currentMonthDept.qcDL;
  const tsHrDL = tsRow?.monthEndDL ?? currentMonthDept.tsDL;
  const whHrDL = whRow?.monthEndDL ?? currentMonthDept.whDL;

  // Total HR Actuals (DL + IDL)
  const smtHrTotal = smtHrDL + smtIDL;
  const pcaHrTotal = pcaHrDL + pcaIDL;
  const sysHrTotal = sysHrDL + sysIDL;
  const qcHrTotal = qcHrDL + qcIDL;
  const tsHrTotal = tsHrDL + tsIDL;
  const whHrTotal = whHrDL + whIDL;

  // Yearly Budget Total Allocation (DL + IDL)
  const baseTotalHeadcount = currentMonthDept.totalHeadcount || (currentMonthDept.totalDL + currentMonthDept.totalIDL) || 1;
  const mfgTotalHeadcount = currentMonthDept.mfgDL + currentMonthDept.mfgIDL;

  const budgetMfgTotal = Math.round(selectedMonthBudget.total * (mfgTotalHeadcount / baseTotalHeadcount));
  const budgetQcTotal = Math.round(selectedMonthBudget.total * ((currentMonthDept.qcDL + currentMonthDept.qcIDL) / baseTotalHeadcount));
  const budgetTsTotal = Math.round(selectedMonthBudget.total * ((currentMonthDept.tsDL + currentMonthDept.tsIDL) / baseTotalHeadcount));
  const budgetWhTotal = Math.round(selectedMonthBudget.total * ((currentMonthDept.whDL + currentMonthDept.whIDL) / baseTotalHeadcount));

  // Manufacturing Detailed Process Budget Split (SMT, PCA, Assembly)
  const mfgDemandTotal = smtApsTotal + pcaApsTotal + sysApsTotal || 1;
  const budgetSmtTotal = Math.round(budgetMfgTotal * (smtApsTotal / mfgDemandTotal));
  const budgetPcaTotal = Math.round(budgetMfgTotal * (pcaApsTotal / mfgDemandTotal));
  const budgetSysTotal = Math.max(0, budgetMfgTotal - (budgetSmtTotal + budgetPcaTotal));

  // DL Budget breakdowns
  const baseTotalDL = currentMonthDept.totalDL || (currentApsPlan.totalApsDemandDL || 1);
  const mfgRatio = currentMonthDept.mfgDL / baseTotalDL;
  const budgetMfgDL = Math.round(selectedMonthBudget.dl * mfgRatio);
  const mfgTotalBase = smtDL + pcaDL + sysDL || 1;
  const budgetSmtDL = Math.round(budgetMfgDL * (smtDL / mfgTotalBase));
  const budgetPcaDL = Math.round(budgetMfgDL * (pcaDL / mfgTotalBase));
  const budgetSysDL = Math.max(0, budgetMfgDL - (budgetSmtDL + budgetPcaDL));
  const budgetQcDL = Math.round(selectedMonthBudget.dl * (currentMonthDept.qcDL / baseTotalDL));
  const budgetTsDL = Math.round(selectedMonthBudget.dl * (currentMonthDept.tsDL / baseTotalDL));
  const budgetWhDL = Math.round(selectedMonthBudget.dl * (currentMonthDept.whDL / baseTotalDL));

  // Compute diagnosis for each detailed process
  const smtDiag = analyzeCostCenterVariance(budgetSmtTotal, smtApsTotal, smtHrTotal, 'SMT');
  const pcaDiag = analyzeCostCenterVariance(budgetPcaTotal, pcaApsTotal, pcaHrTotal, 'PCA');
  const sysDiag = analyzeCostCenterVariance(budgetSysTotal, sysApsTotal, sysHrTotal, 'System Assembly');
  const qcDiag = analyzeCostCenterVariance(budgetQcTotal, qcApsTotal, qcHrTotal, 'Quality Control');
  const tsDiag = analyzeCostCenterVariance(budgetTsTotal, tsApsTotal, tsHrTotal, 'Trouble Shooting');
  const whDiag = analyzeCostCenterVariance(budgetWhTotal, whApsTotal, whHrTotal, 'Warehouse Logistics');

  // Detailed Process Breakdown (DL + IDL)
  const detailedProcessVarianceData = [
    {
      id: 'smt',
      name: 'SMT',
      fullName: 'SMT - Surface Mount Technology',
      costCenters: smtRow?.costCenters || parseCostCenters(currentSite.smtCostCenter),
      yearlyBudget: budgetSmtTotal,
      budgetDL: budgetSmtDL,
      budgetIDL: Math.max(0, budgetSmtTotal - budgetSmtDL),
      apsDemand: smtApsTotal,
      apsDL: smtDL,
      apsIDL: smtIDL,
      hrActual: smtHrTotal,
      hrDL: smtHrDL,
      hrIDL: smtIDL,
      varianceDL: smtRow?.varianceDL || 0,
      varianceTotal: smtHrTotal - smtApsTotal,
      budgetGap: smtApsTotal - budgetSmtTotal,
      hitRate: Math.round((smtApsTotal / (budgetSmtTotal || 1)) * 100),
      monthLabel,
      actionPlan: smtDiag.analysisSummary,
      diagnosis: smtDiag,
    },
    {
      id: 'pca',
      name: 'PCA',
      fullName: 'PCA - Printed Circuit Assembly',
      costCenters: pcaRow?.costCenters || parseCostCenters(currentSite.pcaCostCenter),
      yearlyBudget: budgetPcaTotal,
      budgetDL: budgetPcaDL,
      budgetIDL: Math.max(0, budgetPcaTotal - budgetPcaDL),
      apsDemand: pcaApsTotal,
      apsDL: pcaDL,
      apsIDL: pcaIDL,
      hrActual: pcaHrTotal,
      hrDL: pcaHrDL,
      hrIDL: pcaIDL,
      varianceDL: pcaRow?.varianceDL || 0,
      varianceTotal: pcaHrTotal - pcaApsTotal,
      budgetGap: pcaApsTotal - budgetPcaTotal,
      hitRate: Math.round((pcaApsTotal / (budgetPcaTotal || 1)) * 100),
      monthLabel,
      actionPlan: pcaDiag.analysisSummary,
      diagnosis: pcaDiag,
    },
    {
      id: 'sys',
      name: 'Assembly',
      fullName: 'Assembly - System Integration & Rack Assembly',
      costCenters: sysRow?.costCenters || parseCostCenters(currentSite.assemblyCostCenter),
      yearlyBudget: budgetSysTotal,
      budgetDL: budgetSysDL,
      budgetIDL: Math.max(0, budgetSysTotal - budgetSysDL),
      apsDemand: sysApsTotal,
      apsDL: sysDL,
      apsIDL: sysIDL,
      hrActual: sysHrTotal,
      hrDL: sysHrDL,
      hrIDL: sysIDL,
      varianceDL: sysRow?.varianceDL || 0,
      varianceTotal: sysHrTotal - sysApsTotal,
      budgetGap: sysApsTotal - budgetSysTotal,
      hitRate: Math.round((sysApsTotal / (budgetSysTotal || 1)) * 100),
      monthLabel,
      actionPlan: sysDiag.analysisSummary,
      diagnosis: sysDiag,
    },
    {
      id: 'qc_p',
      name: 'Quality',
      fullName: 'Quality - Quality Control & Assurance',
      costCenters: qcRow?.costCenters || qcCostCenters,
      yearlyBudget: budgetQcTotal,
      budgetDL: budgetQcDL,
      budgetIDL: Math.max(0, budgetQcTotal - budgetQcDL),
      apsDemand: qcApsTotal,
      apsDL: qcDL,
      apsIDL: qcIDL,
      hrActual: qcHrTotal,
      hrDL: qcHrDL,
      hrIDL: qcIDL,
      varianceDL: qcRow?.varianceDL || 0,
      varianceTotal: qcHrTotal - qcApsTotal,
      budgetGap: qcApsTotal - budgetQcTotal,
      hitRate: Math.round((qcApsTotal / (budgetQcTotal || 1)) * 100),
      monthLabel,
      actionPlan: qcDiag.analysisSummary,
      diagnosis: qcDiag,
    },
    {
      id: 'ts_p',
      name: 'Troubleshoot',
      fullName: 'Troubleshoot - Failure Analysis & Repair',
      costCenters: tsRow?.costCenters || tsCostCenters,
      yearlyBudget: budgetTsTotal,
      budgetDL: budgetTsDL,
      budgetIDL: Math.max(0, budgetTsTotal - budgetTsDL),
      apsDemand: tsApsTotal,
      apsDL: tsDL,
      apsIDL: tsIDL,
      hrActual: tsHrTotal,
      hrDL: tsHrDL,
      hrIDL: tsIDL,
      varianceDL: tsRow?.varianceDL || 0,
      varianceTotal: tsHrTotal - tsApsTotal,
      budgetGap: tsApsTotal - budgetTsTotal,
      hitRate: Math.round((tsApsTotal / (budgetTsTotal || 1)) * 100),
      monthLabel,
      actionPlan: tsDiag.analysisSummary,
      diagnosis: tsDiag,
    },
    {
      id: 'wh_p',
      name: 'Warehouse',
      fullName: 'Warehouse - Logistics & Inventory Control',
      costCenters: whRow?.costCenters || whCostCenters,
      yearlyBudget: budgetWhTotal,
      budgetDL: budgetWhDL,
      budgetIDL: Math.max(0, budgetWhTotal - budgetWhDL),
      apsDemand: whApsTotal,
      apsDL: whDL,
      apsIDL: whIDL,
      hrActual: whHrTotal,
      hrDL: whHrDL,
      hrIDL: whIDL,
      varianceDL: whRow?.varianceDL || 0,
      varianceTotal: whHrTotal - whApsTotal,
      budgetGap: whApsTotal - budgetWhTotal,
      hitRate: Math.round((whApsTotal / (budgetWhTotal || 1)) * 100),
      monthLabel,
      actionPlan: whDiag.analysisSummary,
      diagnosis: whDiag,
    },
  ];

  // Active data for Detailed Process breakdown
  const activeChartData = detailedProcessVarianceData;

  // Multi-site consolidated metrics (excluding internal TAO sub-plants)
  const isInternalSubPlant = (s: SiteData) =>
    s.id === 'tp08' ||
    s.id === 'tp15' ||
    s.id === 'tp16' ||
    s.code === 'TP08' ||
    s.code === 'TP15' ||
    s.code === 'TP16';

  const allSiteMetrics = (Object.values(sites) as SiteData[])
    .filter((s) => !isInternalSubPlant(s))
    .map((s) => ({
      site: s,
      metrics: calculateSiteMetrics(s, timePeriod),
      apsPlan: generateMonthlyApsPlan(s, selectedYear, selectedMonth),
    }));

  // Resolve plant-level gap indication for action plan
  const getRowPlantActionText = (row: CostCenterPayrollWeekly): string => {
    if (currentSite.id === 'overall') {
      const siteBreakdown: Array<{ name: string; gap: number }> = [];
      allSiteMetrics
        .filter((m) => m.site.id !== 'overall')
        .forEach(({ site, apsPlan }) => {
          const siteCC = generateCostCenterPayrollData(site, apsPlan);
          const dept = siteCC.find((d) => d.processType === row.processType);
          if (dept && dept.varianceDL !== 0) {
            siteBreakdown.push({ name: site.name, gap: dept.varianceDL });
          }
        });

      if (row.varianceDL < 0) {
        const deficits = siteBreakdown
          .filter((s) => s.gap < 0)
          .sort((a, b) => a.gap - b.gap);
        if (deficits.length > 0) {
          return `Deficit Plants: ${deficits.slice(0, 3).map((s) => `${s.name} (${s.gap} DL)`).join(', ')}`;
        }
      } else if (row.varianceDL > 0) {
        const surpluses = siteBreakdown
          .filter((s) => s.gap > 0)
          .sort((a, b) => b.gap - a.gap);
        if (surpluses.length > 0) {
          return `Surplus Plants: ${surpluses.slice(0, 3).map((s) => `${s.name} (+${s.gap} DL)`).join(', ')}`;
        }
      }
      return 'Plant headcount balanced (No significant gap)';
    }

    return row.actionNeeded;
  };

  // Yearly Budget Manpower (Connected from HR System, calculated per month based on seasonal capacity)
  const monthlyBudgetInfo = getMonthlyBudgetManpower(currentSite, selectedMonth);
  const yearlyBudget = monthlyBudgetInfo.total;
  const yearlyBudgetDL = monthlyBudgetInfo.dl;
  const yearlyBudgetIDL = monthlyBudgetInfo.idl;
  const annualBaseBudget = monthlyBudgetInfo.annualAverage;
  
  // Budget Hit Rate = APS manpower / Budget manpower
  // (Both Total Headcount Hit Rate & Direct Labor Hit Rate)
  const budgetHitRateTotal = Math.round((monthlyApsTotal / (yearlyBudget || 1)) * 100);
  const budgetHitRateDL = Math.round((monthlyApsDemandDL / (yearlyBudgetDL || 1)) * 100);
  const budgetVarianceGap = monthlyApsTotal - yearlyBudget;
  const isBudgetExceeded = budgetVarianceGap > 0;

  // Manpower Utilization Rate = Schedule Demand / HR Paid Actual
  const manpowerUtilizationTotal = Math.round((monthlyApsTotal / (hrTotalPaid || 1)) * 100);
  const manpowerUtilizationDL = Math.round((monthlyApsDemandDL / (hrMonthEndDL || 1)) * 100);
  const manpowerUtilizationIDL = Math.round((monthlyApsDemandIDL / (hrMonthEndIDL || 1)) * 100);

  // Render Multi-Plant Summary Matrix table (controlled via Annual Manpower 資訊 menu)
  const renderPlantSummaryMatrix = () => (
    <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6 shadow-xl relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#38bdf8] uppercase tracking-wider mb-1">
            <span>Multi-Plant Comparative Overview</span>
          </div>
          <h4 className="font-['Inter'] text-base font-semibold text-[#e5e1e6] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8]">factory</span>
            Plant Summary Matrix ({monthLabel} {selectedYear})
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-['JetBrains_Mono'] text-xs text-[#38bdf8] bg-[#38bdf8]/10 px-2.5 py-1 rounded border border-[#38bdf8]/20 font-bold">
            Total Plants: {allSiteMetrics.filter((item) => item.site.id !== 'overall').length} Manufacturing Sites
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-[#524437]/40 bg-[#131316]">
        <table className="w-full text-left font-['Inter'] text-xs min-w-[1280px]">
          <thead className="bg-[#201f23] text-[#d7c3b2]/80 font-['JetBrains_Mono'] text-[11px]">
            <tr className="border-b border-[#524437]/40">
              <th rowSpan={2} className="p-3 border-r border-[#524437]/40 align-middle">
                PLANT / SITE
              </th>
              <th colSpan={3} className="p-2 text-center border-r border-[#524437]/40 bg-[#1a232b] text-[#38bdf8] font-semibold">
                APS Monthly Production Volume
              </th>
              <th colSpan={3} className="p-2 text-center border-r border-[#524437]/40 bg-[#1f1a29] text-[#a78bfa] font-semibold">
                Yearly Budget Manpower
              </th>
              <th colSpan={3} className="p-2 text-center border-r border-[#524437]/40 bg-[#29221b] text-[#ffb86b] font-semibold">
                APS Demand Manpower
              </th>
              <th colSpan={3} className="p-2 text-center border-r border-[#524437]/40 bg-[#14232a] text-[#5de6ff] font-semibold">
                HR Paid Manpower
              </th>
              <th rowSpan={2} className="p-3 border-r border-[#524437]/40 text-right align-middle bg-[#29221b] text-[#ffb86b] font-semibold">
                BUDGET HIT RATE
              </th>
              <th rowSpan={2} className="p-3 border-r border-[#524437]/40 text-right align-middle">
                NET MANPOWER GAP
              </th>
              <th rowSpan={2} className="p-3 border-r border-[#524437]/40 text-right align-middle bg-[#14232a] text-[#4edea3] font-semibold">
                MANPOWER UTILIZATION RATE
              </th>
              <th rowSpan={2} className="p-3 border-r border-[#524437]/40 text-center align-middle">
                STATUS
              </th>
              <th rowSpan={2} className="p-3 text-center align-middle">
                ACTION
              </th>
            </tr>
            <tr className="border-b border-[#524437]/40 bg-[#18181c] text-[10px]">
              <th className="p-2 text-right border-r border-[#524437]/20 text-[#38bdf8]">SMT Volume (pcs)</th>
              <th className="p-2 text-right border-r border-[#524437]/20 text-[#a78bfa]">CPU ASSEMBLY (units)</th>
              <th className="p-2 text-right border-r border-[#524437]/40 text-[#ffb86b]">RACK ASSEMBLY (racks)</th>
              <th className="p-2 text-right border-r border-[#524437]/20 text-[#a78bfa]">DL</th>
              <th className="p-2 text-right border-r border-[#524437]/20 text-[#c084fc]">IDL</th>
              <th className="p-2 text-right border-r border-[#524437]/40 text-[#a78bfa] font-bold bg-[#a78bfa]/10">Total</th>
              <th className="p-2 text-right border-r border-[#524437]/20 text-[#ffb86b]">DL</th>
              <th className="p-2 text-right border-r border-[#524437]/20 text-[#fb923c]">IDL</th>
              <th className="p-2 text-right border-r border-[#524437]/40 text-[#ffb86b] font-bold bg-[#ffb86b]/10">Total</th>
              <th className="p-2 text-right border-r border-[#524437]/20 text-[#5de6ff]">DL</th>
              <th className="p-2 text-right border-r border-[#524437]/20 text-[#c084fc]">IDL</th>
              <th className="p-2 text-right border-r border-[#524437]/40 text-[#5de6ff] font-bold bg-[#5de6ff]/10">Total</th>
            </tr>
          </thead>
          <tbody>
            {allSiteMetrics
              .filter((item) => item.site.id !== 'overall')
              .map(({ site: s, metrics, apsPlan }) => {
                const sVolumes = getMonthlyApsVolumes(s, selectedMonth);
                const sApsDL = apsPlan.totalApsDemandDL;
                const sApsIDL = metrics.totalIDL;
                const sApsTotal = sApsDL + sApsIDL;

                const sHrDL = s.actualHrDL || sApsDL;
                const sHrIDL = s.actualHrIDL !== undefined ? s.actualHrIDL : metrics.totalIDL;
                const sHrTotal = sHrDL + sHrIDL;

                const sBudget = getMonthlyBudgetManpower(s, selectedMonth);
                const sBudgetHitRate = Math.round((sApsTotal / (sBudget.total || 1)) * 100);

                const sNetGap = sHrTotal - sApsTotal;
                const sGapDL = sHrDL - sApsDL;
                const sUtilRate = Math.round((sApsTotal / (sHrTotal || 1)) * 100);
                const isCurrent = s.id === currentSite.id;

                return (
                  <tr
                    key={s.id}
                    className={`border-b border-[#524437]/20 hover:bg-[#1c1b1f] transition-colors ${
                      isCurrent ? 'bg-[#ffb86b]/5' : ''
                    }`}
                  >
                    <td className="p-3 font-semibold text-[#e5e1e6] font-['JetBrains_Mono'] flex items-center gap-2 border-r border-[#524437]/30">
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb86b]"></span>
                      )}
                      <span>{s.name}</span>
                      <span className="text-[10px] text-[#d7c3b2]/50">({s.code})</span>
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#38bdf8] border-r border-[#524437]/20">
                      {(sVolumes?.smtVolume ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#a78bfa] border-r border-[#524437]/20">
                      {(sVolumes?.cpuVolume ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#ffb86b] border-r border-[#524437]/40">
                      {((sVolumes as any)?.rackVolume ?? 66).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#a78bfa] border-r border-[#524437]/20">
                      {(sBudget.dl ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#c084fc] border-r border-[#524437]/20">
                      {(sBudget.idl ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#a78bfa] bg-[#a78bfa]/5 border-r border-[#524437]/40">
                      {(sBudget.total ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#ffb86b] border-r border-[#524437]/20">
                      {(sApsDL ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#fb923c] border-r border-[#524437]/20">
                      {(sApsIDL ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b] bg-[#ffb86b]/5 border-r border-[#524437]/40">
                      {(sApsTotal ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#5de6ff] border-r border-[#524437]/20">
                      {(sHrDL ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] text-[#c084fc] border-r border-[#524437]/20">
                      {(sHrIDL ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#5de6ff] bg-[#5de6ff]/5 border-r border-[#524437]/40">
                      {(sHrTotal ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b] bg-[#ffb86b]/5 border-r border-[#524437]/40">
                      {sBudgetHitRate}%
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold border-r border-[#524437]/30">
                      <div className={sNetGap < 0 ? 'text-[#F59E0B]' : 'text-[#4edea3]'}>
                        {sNetGap > 0 ? `+${sNetGap}` : sNetGap}
                      </div>
                      <div className="text-[10px] text-[#d7c3b2]/60 font-normal">
                        DL: {sGapDL > 0 ? `+${sGapDL}` : sGapDL}
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#4edea3] bg-[#4edea3]/5 border-r border-[#524437]/30">
                      {sUtilRate}%
                    </td>
                    <td className="p-2.5 text-center border-r border-[#524437]/30">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          sNetGap < 0
                            ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                            : 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                        }`}
                      >
                        {sNetGap < 0 ? 'DEFICIT' : 'SUFFICIENT'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => onSelectSite(s.id)}
                        className="px-2.5 py-1 bg-[#ffb86b]/10 hover:bg-[#ffb86b]/20 text-[#ffb86b] rounded text-[11px] font-['JetBrains_Mono'] border border-[#ffb86b]/30 transition-colors"
                      >
                        Switch Site
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
          {(() => {
            const totals = allSiteMetrics
              .filter((item) => item.site.id !== 'overall')
              .reduce(
                (acc, { site: s, metrics, apsPlan }) => {
                  const sVolumes = getMonthlyApsVolumes(s, selectedMonth);
                  const sApsDL = apsPlan.totalApsDemandDL;
                  const sApsIDL = metrics.totalIDL;
                  const sApsTotal = sApsDL + sApsIDL;

                  const sHrDL = s.actualHrDL || sApsDL;
                  const sHrIDL = s.actualHrIDL !== undefined ? s.actualHrIDL : metrics.totalIDL;
                  const sHrTotal = sHrDL + sHrIDL;

                  const sBudget = getMonthlyBudgetManpower(s, selectedMonth);

                  acc.smtVol += sVolumes?.smtVolume ?? 0;
                  acc.cpuVol += sVolumes?.cpuVolume ?? 0;
                  acc.rackVol += (sVolumes as any)?.rackVolume ?? 66;

                  acc.budgetDL += sBudget.dl ?? 0;
                  acc.budgetIDL += sBudget.idl ?? 0;
                  acc.budgetTotal += sBudget.total ?? 0;

                  acc.apsDL += sApsDL;
                  acc.apsIDL += sApsIDL;
                  acc.apsTotal += sApsTotal;

                  acc.hrDL += sHrDL;
                  acc.hrIDL += sHrIDL;
                  acc.hrTotal += sHrTotal;

                  return acc;
                },
                {
                  smtVol: 0,
                  cpuVol: 0,
                  rackVol: 0,
                  budgetDL: 0,
                  budgetIDL: 0,
                  budgetTotal: 0,
                  apsDL: 0,
                  apsIDL: 0,
                  apsTotal: 0,
                  hrDL: 0,
                  hrIDL: 0,
                  hrTotal: 0,
                  netGap: 0,
                  gapDL: 0,
                }
              );

            totals.netGap = totals.hrTotal - totals.apsTotal;
            totals.gapDL = totals.hrDL - totals.apsDL;

            const totalUtilRate = Math.round((totals.apsTotal / (totals.hrTotal || 1)) * 100);
            const totalBudgetHitRate = Math.round((totals.apsTotal / (totals.budgetTotal || 1)) * 100);

            return (
              <tfoot className="bg-[#18181c] text-[#e5e1e6] font-['JetBrains_Mono'] font-bold border-t-2 border-[#524437]">
                <tr>
                  <td className="p-3 border-r border-[#524437]/30">TOTAL / AVG</td>
                  <td className="p-2.5 text-right text-[#38bdf8] border-r border-[#524437]/20">
                    {(totals?.smtVol ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#a78bfa] border-r border-[#524437]/20">
                    {(totals?.cpuVol ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#ffb86b] border-r border-[#524437]/40">
                    {(totals?.rackVol ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#a78bfa] border-r border-[#524437]/20">
                    {(totals?.budgetDL ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#c084fc] border-r border-[#524437]/20">
                    {(totals?.budgetIDL ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#a78bfa] bg-[#a78bfa]/15 border-r border-[#524437]/40 font-extrabold">
                    {(totals?.budgetTotal ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#ffb86b] border-r border-[#524437]/20">
                    {(totals?.apsDL ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#fb923c] border-r border-[#524437]/20">
                    {(totals?.apsIDL ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#ffb86b] bg-[#ffb86b]/15 border-r border-[#524437]/40 font-extrabold">
                    {(totals?.apsTotal ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#5de6ff] border-r border-[#524437]/20">
                    {(totals?.hrDL ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#c084fc] border-r border-[#524437]/20">
                    {(totals?.hrIDL ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#5de6ff] bg-[#5de6ff]/15 border-r border-[#524437]/40 font-extrabold">
                    {(totals?.hrTotal ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[#ffb86b] bg-[#ffb86b]/15 border-r border-[#524437]/40 font-extrabold">
                    {totalBudgetHitRate}%
                  </td>
                  <td className="p-2.5 text-right border-r border-[#524437]/30">
                    <div className={totals.netGap < 0 ? 'text-[#F59E0B]' : 'text-[#4edea3]'}>
                      {totals.netGap > 0 ? `+${totals.netGap}` : totals.netGap}
                    </div>
                    <div className="text-[10px] text-[#d7c3b2]/60 font-normal">
                      DL: {totals.gapDL > 0 ? `+${totals.gapDL}` : totals.gapDL}
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-bold text-[#4edea3] bg-[#4edea3]/10 border-r border-[#524437]/30">
                    {totalUtilRate}%
                  </td>
                  <td className="p-2.5 text-center border-r border-[#524437]/30">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        totals.netGap < 0
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                          : 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                      }`}
                    >
                      {totals.netGap < 0 ? 'DEFICIT' : 'SUFFICIENT'}
                    </span>
                  </td>
                  <td className="p-2.5 text-center text-[#d7c3b2]/50 text-[10px]">
                    ALL PLANTS
                  </td>
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 select-none">
      {/* 1. Summary KPI Cards */}
      {summaryCards}

      {/* 2. Visual Chart 1: Annual APS Demand VS HR (Jan - Dec Bar Chart with Dual-Axis) */}
      {(activeAnnualTab === 'trend' || activeAnnualTab === 'both') && (
        <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#ffb86b] uppercase tracking-wider mb-1">
              <span>Annual Staffing Comparison</span>
            </div>
            <h4 className="font-['Inter'] text-lg font-bold text-[#e5e1e6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb86b]">equalizer</span>
              Annual Manpower Trend
            </h4>
          </div>

          {/* ⭐ Top Summary Pills: 1. Yearly Budget & Hit Rate, 2. HR Paid Actual & Utilization Rate ⭐ */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pill 1: Yearly Budget Manpower & Hit Rate */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#131316] border border-[#a78bfa]/40 rounded-lg shadow-sm hover:border-[#a78bfa]/70 transition-colors">
              <span className="material-symbols-outlined text-[#a78bfa] text-lg">account_balance</span>
              <div>
                <div className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#a78bfa] font-bold flex items-center gap-1.5">
                  Yearly Budget ({monthLabel})
                  <span className="px-1.5 py-0.2 bg-[#a78bfa]/15 text-[#a78bfa] rounded text-[9px] border border-[#a78bfa]/30">BUDGET</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-['JetBrains_Mono'] font-bold text-white">
                    {yearlyBudget.toLocaleString()} <span className="text-[10px] font-normal text-[#d7c3b2]/70">HC</span>
                  </span>
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/60">
                    (DL: {yearlyBudgetDL} · IDL: {yearlyBudgetIDL})
                  </span>
                </div>
              </div>
              <div className="ml-1 pl-2.5 border-l border-[#524437]/50 text-right">
                <div className="text-[9px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#d7c3b2]/60">Hit Rate</div>
                <div className="text-xs font-['JetBrains_Mono'] font-bold text-[#ffb86b]">
                  {budgetHitRateTotal}%
                </div>
              </div>
            </div>

            {/* Pill 2: HR Paid Actual & Manpower Utilization Rate */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#131316] border border-[#5de6ff]/40 rounded-lg shadow-sm hover:border-[#5de6ff]/70 transition-colors">
              <span className="material-symbols-outlined text-[#5de6ff] text-lg">badge</span>
              <div>
                <div className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#5de6ff] font-bold flex items-center gap-1.5">
                  HR Paid Actual ({monthLabel})
                  <span className="px-1.5 py-0.2 bg-[#5de6ff]/15 text-[#5de6ff] rounded text-[9px] border border-[#5de6ff]/30">HR PAID</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-['JetBrains_Mono'] font-bold text-white">
                    {hrTotalPaid.toLocaleString()} <span className="text-[10px] font-normal text-[#d7c3b2]/70">HC</span>
                  </span>
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/60">
                    (DL: {hrMonthEndDL} · IDL: {hrMonthEndIDL})
                  </span>
                </div>
              </div>
              <div className="ml-1 pl-2.5 border-l border-[#524437]/50 text-right">
                <div className="text-[9px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#d7c3b2]/60">Utilization</div>
                <div className="text-xs font-['JetBrains_Mono'] font-bold text-[#4edea3]">
                  {manpowerUtilizationTotal}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="w-full h-[420px] bg-[#131316]/60 border border-[#524437]/30 rounded-lg p-4 backdrop-blur-sm">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={annualTrend}
              margin={{ top: 15, right: 35, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#524437" opacity={0.3} />
              <XAxis
                dataKey="monthName"
                stroke="#d7c3b2"
                opacity={0.8}
                tick={{ fill: '#d7c3b2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              />
              {/* Primary Y-Axis (Left): Headcount with headroom so bars stay below rate lines */}
              <YAxis
                yAxisId="left"
                stroke="#d7c3b2"
                opacity={0.8}
                domain={[0, (dataMax: number) => Math.ceil((dataMax * 1.3) / 100) * 100]}
                tick={{ fill: '#d7c3b2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                label={{
                  value: 'Headcount (HC)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#a78bfa',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  dy: 40,
                }}
              />
              {/* Secondary Y-Axis (Right): Rates (%) adjusted to lift line chart upward */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#ffb86b"
                opacity={0.9}
                domain={[0, (dataMax: number) => Math.max(110, Math.ceil(dataMax + 2))]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tick={{ fill: '#ffb86b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickFormatter={(val) => `${val}%`}
                label={{
                  value: 'Rate (%)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#ffb86b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  dy: -30,
                }}
              />
              <Tooltip content={<AnnualCustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: '12px',
                  fontSize: '11px',
                  fontFamily: 'Inter',
                  color: '#e5e1e6',
                }}
              />
              {/* 100% Target Reference Line on Secondary Axis */}
              <ReferenceLine
                yAxisId="right"
                y={100}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{
                  value: '100% Benchmark',
                  fill: '#cbd5e1',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontFamily: 'JetBrains Mono',
                }}
              />

              {/* 1. Yearly Budget Manpower Stacked Bar: stackId="budget" */}
              <Bar
                yAxisId="left"
                dataKey="yearlyBudgetDL"
                stackId="budget"
                name="Budget DL"
                fill="#7c3aed"
                barSize={12}
              />
              <Bar
                yAxisId="left"
                dataKey="yearlyBudgetIDL"
                stackId="budget"
                name="Budget IDL"
                fill="#a78bfa"
                radius={[3, 3, 0, 0]}
                barSize={12}
              />

              {/* 2. APS Demand Stacked Bar: stackId="aps" */}
              <Bar
                yAxisId="left"
                dataKey="apsDemandDL"
                stackId="aps"
                name="APS Demand DL"
                fill="#ffb86b"
                barSize={12}
              />
              <Bar
                yAxisId="left"
                dataKey="apsDemandIDL"
                stackId="aps"
                name="APS Demand IDL"
                fill="#fb923c"
                radius={[3, 3, 0, 0]}
                barSize={12}
              />

              {/* 3. HR Paid Actual Stacked Bar: stackId="hr" */}
              <Bar
                yAxisId="left"
                dataKey="hrActualDL"
                stackId="hr"
                name="HR Paid DL"
                fill="#0284c7"
                barSize={12}
              />
              <Bar
                yAxisId="left"
                dataKey="hrActualIDL"
                stackId="hr"
                name="HR Paid IDL"
                fill="#5de6ff"
                radius={[3, 3, 0, 0]}
                barSize={12}
              />

              {/* Line 1: Budget Manpower Hit-rate (Secondary Axis) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="budgetHitRate"
                name="Budget Manpower Hit-rate"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 3.5, fill: '#f59e0b', stroke: '#131316', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* Line 2: Manpower Utilization (Secondary Axis) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="manpowerUtilization"
                name="Manpower Utilization"
                stroke="#4edea3"
                strokeWidth={3}
                dot={{ r: 3.5, fill: '#4edea3', stroke: '#131316', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#4edea3', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* 2b. Plant Summary Matrix (Option 2 in Annual Manpower 資訊) */}
      {(activeAnnualTab === 'matrix' || activeAnnualTab === 'both') && renderPlantSummaryMatrix()}

      {/* 3. Visual Chart 2: Cost Center Department Variance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="font-['Inter'] text-base font-semibold text-[#e5e1e6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb86b]">precision_manufacturing</span>
                Functional Analysis Trend
              </h4>
            </div>
            {/* Direct Detailed Process Indicator */}
            <div className="flex items-center gap-1.5 bg-[#a78bfa]/15 px-3 py-1.5 rounded-lg border border-[#a78bfa]/30 text-xs font-['JetBrains_Mono'] text-[#a78bfa] font-bold self-start sm:self-auto shadow-sm">
              <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
              <span>Detailed Process (DL+IDL)</span>
            </div>
          </div>

          <div className="w-full h-[290px] bg-[#131316]/60 border border-[#524437]/30 rounded-lg p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#524437" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="#d7c3b2"
                  tick={{ fill: '#d7c3b2', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                />
                <YAxis
                  stroke="#d7c3b2"
                  tick={{ fill: '#d7c3b2', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip content={<CostCenterCustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }} />
                {/* 1. Yearly Budget */}
                <Bar dataKey="yearlyBudget" name={`Yearly Budget (${monthLabel})`} fill="#a78bfa" radius={[3, 3, 0, 0]} />
                {/* 2. APS Demand Manpower */}
                <Bar dataKey="apsDemand" name="APS Demand Manpower" fill="#ffb86b" radius={[3, 3, 0, 0]} />
                {/* 3. HR Paid Manpower */}
                <Bar dataKey="hrActual" name="HR Paid Manpower" fill="#5de6ff" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Center Variance Analysis Matrix */}
        <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="font-['Inter'] text-base font-semibold text-[#e5e1e6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb86b]">troubleshoot</span>
                Functional Analysis Detail
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#a78bfa] font-['JetBrains_Mono'] bg-[#a78bfa]/10 px-2 py-0.5 rounded border border-[#a78bfa]/20 font-bold">
                  ● Yearly Budget
                </span>
                <span className="text-[10px] text-[#ffb86b] font-['JetBrains_Mono'] bg-[#ffb86b]/10 px-2 py-0.5 rounded border border-[#ffb86b]/20 font-bold">
                  ● APS Demand
                </span>
                <span className="text-[10px] text-[#5de6ff] font-['JetBrains_Mono'] bg-[#5de6ff]/10 px-2 py-0.5 rounded border border-[#5de6ff]/20 font-bold">
                  ● HR Paid Manpower
                </span>
              </div>
            </div>
            <div className="space-y-2.5 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
              {activeChartData.map((row) => {
                const diag = (row as any).diagnosis || analyzeCostCenterVariance(row.yearlyBudget, row.apsDemand, row.hrActual, row.name);
                return (
                  <div
                    key={row.id || row.name}
                    className="bg-[#131316] p-3 rounded-lg border border-[#524437]/40 flex items-center justify-between gap-3 text-xs hover:border-[#524437] transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#e5e1e6] flex flex-wrap items-center gap-1.5">
                        <span>{row.fullName || row.name}</span>
                        {row.costCenters && row.costCenters.length > 0 && (
                          <span className="text-[10px] text-[#a78bfa] font-['JetBrains_Mono']">
                            [{row.costCenters.join(', ')}]
                          </span>
                        )}
                        <span
                          className="text-[10px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded border font-semibold ml-1"
                          style={{
                            color: diag.driverColor,
                            backgroundColor: `${diag.driverColor}15`,
                            borderColor: `${diag.driverColor}40`,
                          }}
                        >
                          {diag.varianceCategory}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#d7c3b2]/80 mt-1 flex flex-wrap items-center gap-2 font-['JetBrains_Mono']">
                        <span className="text-[#a78bfa] font-semibold">
                          1. Budget: {row.yearlyBudget.toLocaleString()} HC
                        </span>
                        <span className="text-[#d7c3b2]/40">•</span>
                        <span className="text-[#ffb86b]">
                          2. Demand: {row.apsDemand.toLocaleString()} HC
                        </span>
                        <span className="text-[#d7c3b2]/40">•</span>
                        <span className="text-[#5de6ff]">
                          3. Paid: {row.hrActual.toLocaleString()} HC
                        </span>
                        <span className="text-[#d7c3b2]/40">•</span>
                        <span className="text-[#ffb86b] bg-[#ffb86b]/10 px-1 py-0.2 rounded border border-[#ffb86b]/20 font-bold">
                          Hit Rate: {row.hitRate}%
                        </span>
                      </div>
                      <div className="text-[11px] mt-1.5 flex items-center gap-1.5 font-['JetBrains_Mono']">
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: diag.driverColor }}
                        />
                        <span
                          className="font-medium"
                          style={{ color: diag.driverColor }}
                        >
                          {row.actionPlan || diag.analysisSummary}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-['JetBrains_Mono'] pl-3 border-l border-[#524437]/20 flex flex-col items-end gap-1">
                      <div
                        className="text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap"
                        style={{
                          color: diag.driverColor,
                          backgroundColor: `${diag.driverColor}18`,
                          borderColor: `${diag.driverColor}50`,
                        }}
                      >
                        Primary Driver: {diag.driverName}
                      </div>
                      <div className="text-[10px] text-[#d7c3b2]/75 space-y-0.5 text-right">
                        <div>
                          Budget Gap:{' '}
                          <span
                            className="font-semibold"
                            style={{ color: diag.budgetGap > 0 ? '#ffb86b' : '#a78bfa' }}
                          >
                            {diag.budgetGap > 0 ? `+${diag.budgetGap}` : diag.budgetGap} HC
                          </span>
                        </div>
                        <div>
                          Demand vs Paid:{' '}
                          <span
                            className="font-semibold"
                            style={{ color: diag.hrDemandGap < 0 ? '#5de6ff' : '#4edea3' }}
                          >
                            {diag.hrDemandGap > 0 ? `+${diag.hrDemandGap}` : diag.hrDemandGap} HC
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
