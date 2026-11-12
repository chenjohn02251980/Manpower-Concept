import { SiteData, MonthlyApsPlan, DailyLineSchedule, CostCenterPayrollWeekly } from '../types';
import { parseCostCenters } from '../components/CostCenterMultiPicker';
import { AUGUST_SMT_LINE_SUMMARIES } from '../data/apsSmtPcaSchedule';
import {
  APS_MASTER_MONTHS,
  AUGUST_2026_DATES,
  AUGUST_APS_ORDERS,
  AUGUST_LINE_SUMMARIES,
  ApsAugustOrder,
  ApsLineSummary,
  ApsOrderItem,
  ApsLineSummaryItem,
  getDatesForMonth,
  getLineSummariesForMonth,
  getOrdersForMonth,
} from '../data/apsMasterSchedule';

export {
  APS_MASTER_MONTHS,
  AUGUST_2026_DATES,
  AUGUST_APS_ORDERS,
  AUGUST_LINE_SUMMARIES,
  getDatesForMonth,
  getLineSummariesForMonth,
  getOrdersForMonth,
};
export type { ApsAugustOrder, ApsLineSummary, ApsOrderItem, ApsLineSummaryItem };

export function getNextMonthPeriod(year: number, month: number): { targetYear: number; targetMonth: number } {
  if (month === 12) {
    return { targetYear: year + 1, targetMonth: 1 };
  }
  return { targetYear: year, targetMonth: month + 1 };
}

// Master IE Standard DL lookup for APS Lines
export function getMonthlyApsVolumes(
  site: SiteData,
  month: number
): {
  smtVolume: number;
  cpuVolume: number;
  rackVolume: number;
  systemVolume: number;
  smtLinesCount: number;
  cpuLinesCount: number;
  rackLinesCount: number;
} {
  // 1. All System Assembly Lines for the requested month from Master Schedule
  const allLines = getLineSummariesForMonth(month);

  // Distinguish CPU Assembly lines from Rack Assembly lines
  const rackLines = allLines.filter((l) => {
    const name = (l.line || '').toUpperCase().trim();
    return name.startsWith('R') || name.startsWith('TR') || name.includes('RACK');
  });
  const cpuLines = allLines.filter((l) => {
    const name = (l.line || '').toUpperCase().trim();
    return !name.startsWith('R') && !name.startsWith('TR') && !name.includes('RACK');
  });

  const baseCpuPlan = cpuLines.reduce((sum, l) => sum + (l.totalPlanQty || 0), 0) || 12592;
  const baseRackPlan = rackLines.reduce((sum, l) => sum + (l.totalPlanQty || 0), 0) || 66;
  const baseSystemPlan = baseCpuPlan + baseRackPlan;

  // 2. SMT Lines from Master SMT Schedule (August baseline has 239,587 pcs)
  const baseSmtPlan = AUGUST_SMT_LINE_SUMMARIES.reduce((sum, l) => sum + (l.totalPlanQty || 0), 0);

  // Seasonality factor for SMT based on month
  const smtMonthFactors: Record<number, number> = {
    1: 0.95, 2: 0.88, 3: 0.98, 4: 1.0, 5: 1.02, 6: 1.04, 7: 1.06, 8: 1.0, 9: 1.01, 10: 1.05, 11: 1.02, 12: 0.97
  };
  const factor = smtMonthFactors[month] ?? 1.0;
  const monthAdjustedSmt = month === 8 ? baseSmtPlan : Math.round(baseSmtPlan * factor);

  // If consolidated overall or TAO (where APS schedule is grounded)
  if (!site || site.id === 'overall' || site.id === 'tao' || site.code === 'TAO') {
    return {
      smtVolume: monthAdjustedSmt,
      cpuVolume: baseCpuPlan,
      rackVolume: baseRackPlan,
      systemVolume: baseSystemPlan,
      smtLinesCount: AUGUST_SMT_LINE_SUMMARIES.length || 12,
      cpuLinesCount: cpuLines.length || 6,
      rackLinesCount: rackLines.length || 2,
    };
  }

  // If other plant (ITE, KS, VN), scale proportionally by site's line count
  const taoSmtLinesCount = 4;
  const siteSmtCount = (site.smtLines || []).length || 1;
  const smtScale = siteSmtCount / taoSmtLinesCount;

  const taoCpuLinesCount = 3;
  const siteCpuCount = (site.cpuAssemblyLines || []).length || 1;
  const cpuScale = siteCpuCount / taoCpuLinesCount;

  const taoRackLinesCount = 2;
  const siteRackCount = (site.rackAssemblyLines || []).length || 1;
  const rackScale = siteRackCount / taoRackLinesCount;

  const cpuVolume = Math.round(baseCpuPlan * cpuScale);
  const rackVolume = Math.max(1, Math.round(baseRackPlan * rackScale));

  return {
    smtVolume: Math.round(monthAdjustedSmt * smtScale),
    cpuVolume,
    rackVolume,
    systemVolume: cpuVolume + rackVolume,
    smtLinesCount: siteSmtCount,
    cpuLinesCount: siteCpuCount,
    rackLinesCount: siteRackCount,
  };
}

export function getLineIeStandardDL(site: SiteData, lineName: string): number {
  const normName = lineName.toUpperCase().trim();
  // Check CPU assembly lines
  const match = (site.cpuAssemblyLines || []).find((l) => {
    const lNorm = l.name.toUpperCase();
    return lNorm.includes(normName) || normName.includes(lNorm);
  });
  if (match) {
    return (match.assyDL || 0) + (match.testDL || 0) + (match.packDL || 0);
  }
  // Check Rack assembly lines
  const rackMatch = (site.rackAssemblyLines || []).find((l) => {
    const lNorm = l.name.toUpperCase();
    return lNorm.includes(normName) || normName.includes(lNorm);
  });
  if (rackMatch) {
    return (rackMatch.assyDL || 0) + (rackMatch.testDL || 0) + (rackMatch.packDL || 0);
  }
  // Default fallbacks based on industrial standards from August APS
  if (normName.includes('C32')) return 32;
  if (normName.includes('C22')) return 30;
  if (normName.includes('C21')) return 30;
  if (normName.includes('C31')) return 38;
  if (normName.includes('TC11')) return 34;
  if (normName.includes('TR11')) return 26;
  if (normName.includes('C33')) return 32;
  if (normName.includes('R01')) return 24;
  return 30; // standard fallback
}

export function generateMonthlyApsPlan(
  site: SiteData,
  planningYear: number,
  planningMonth: number
): MonthlyApsPlan {
  const { targetYear, targetMonth } = getNextMonthPeriod(planningYear, planningMonth);

  const lines: DailyLineSchedule[] = [];

  // 1. SMT Lines
  (site.smtLines || []).forEach((line) => {
    const shiftCount = typeof line.shift === 'number' ? line.shift : 2;
    const stdDL = line.onlineStdDL || 0;
    lines.push({
      lineId: line.id,
      lineName: line.name,
      process: 'SMT',
      category: line.category,
      ieStdDLPerShift: stdDL,
      dailyShifts: shiftCount,
      dailyRequiredDL: stdDL * shiftCount,
      shiftDetails: `${shiftCount} shifts/day (${
        shiftCount === 0
          ? 'Offline'
          : shiftCount === 1
          ? 'Day Shift'
          : shiftCount === 2
          ? 'Day & Night Shifts'
          : shiftCount === 3
          ? '3 Continuous Shifts'
          : '4 Shifts / 24-7'
      })`,
      daysActiveInMonth: shiftCount > 0 ? 22 : 0,
    });
  });

  // 2. PCA Lines
  (site.pcaLines || []).forEach((line) => {
    const shiftCount = typeof line.faShift === 'number' ? line.faShift : (typeof line.shift === 'number' ? line.shift : 2);
    const stdDL = (line.faStdDL || 0) + (line.testStdDL || 0) + (line.packingStdDL || 0);
    lines.push({
      lineId: line.id,
      lineName: line.name,
      process: 'PCA',
      category: line.category,
      ieStdDLPerShift: stdDL,
      dailyShifts: shiftCount,
      dailyRequiredDL: stdDL * shiftCount,
      shiftDetails: `${shiftCount} shifts/day (FA + Test + Pack)`,
      daysActiveInMonth: shiftCount > 0 ? 22 : 0,
    });
  });

  // 3. System Assembly Lines (CPU組裝 + Rack組裝)
  (site.cpuAssemblyLines || []).forEach((line) => {
    const shiftCount = typeof line.assyShift === 'number' ? line.assyShift : (typeof line.shift === 'number' ? line.shift : 2);
    const stdDL = (line.assyDL || 0) + (line.testDL || 0) + (line.packDL || 0);
    lines.push({
      lineId: line.id,
      lineName: line.name,
      process: 'System Assembly',
      ieStdDLPerShift: stdDL,
      dailyShifts: shiftCount,
      dailyRequiredDL: stdDL * shiftCount,
      shiftDetails: `${shiftCount} shifts/day (Assembly + Test + Pack)`,
      daysActiveInMonth: shiftCount > 0 ? 22 : 0,
    });
  });

  (site.rackAssemblyLines || []).forEach((line) => {
    const shiftCount = typeof line.assyShift === 'number' ? line.assyShift : (typeof line.shift === 'number' ? line.shift : 2);
    const stdDL = (line.assyDL || 0) + (line.testDL || 0) + (line.packDL || 0);
    lines.push({
      lineId: line.id,
      lineName: line.name,
      process: 'System Assembly',
      ieStdDLPerShift: stdDL,
      dailyShifts: shiftCount,
      dailyRequiredDL: stdDL * shiftCount,
      shiftDetails: `${shiftCount} shifts/day (Assembly + Test + Pack)`,
      daysActiveInMonth: shiftCount > 0 ? 22 : 0,
    });
  });

  const smtOnlineDL = lines
    .filter((l) => l.process === 'SMT')
    .reduce((sum, l) => sum + l.dailyRequiredDL, 0);

  const pcaOnlineDL = lines
    .filter((l) => l.process === 'PCA')
    .reduce((sum, l) => sum + l.dailyRequiredDL, 0);

  const assemblyOnlineDL = lines
    .filter((l) => l.process === 'System Assembly')
    .reduce((sum, l) => sum + l.dailyRequiredDL, 0);

  const totalOnlineDL = smtOnlineDL + pcaOnlineDL + assemblyOnlineDL;

  const totalOfflineDL =
    (site.smtOfflineDL || 0) + (site.pcaOfflineDL || 0) + (site.assemblyOfflineDL || 0);

  const totalSupportDL =
    (site.qualityControl?.pqcDL || 0) +
    (site.qualityControl?.oqcStandardDL || 0) +
    (site.troubleShooting?.dlEntry || 0) +
    (site.warehouse?.logisticsDL || 0) +
    (site.otherSupport?.dl || 0);

  const totalApsDemandDL = totalOnlineDL + totalOfflineDL + totalSupportDL;

  // Fixed IDL from IE Standard configuration (Constant across capacity changes)
  const monthData = site.monthlyDepartmentData?.[planningMonth];
  const mfgIDL =
    monthData?.mfgIDL ??
    ((site.smtIdl || 0) + (site.pcaIdl || 0) + (site.assemblyIdl || 0));

  const supportIDL =
    (monthData?.qcIDL ?? ((site.qualityControl?.pqcIDL || 0) + (site.qualityControl?.oqcIndirectIDL || 0))) +
    (monthData?.tsIDL ?? (site.troubleShooting?.idlEntry || 0)) +
    (monthData?.whIDL ?? (site.warehouse?.adminIDL || 0)) +
    (monthData?.otherIDL ?? (site.otherSupport?.generalIDL || 0));

  const fixedIDL = monthData?.totalIDL ?? (mfgIDL + supportIDL);
  const totalDemandHeadcount = totalApsDemandDL + fixedIDL;

  return {
    planningYear,
    planningMonth,
    targetYear,
    targetMonth,
    cycleWeek: 'W3 Update (Published 3rd Week Monthly)',
    workingDays: 22,
    lines,
    smtOnlineDL,
    pcaOnlineDL,
    assemblyOnlineDL,
    totalOnlineDL,
    totalOfflineDL,
    totalSupportDL,
    totalApsDemandDL,
    fixedIDL,
    mfgIDL,
    supportIDL,
    totalDemandHeadcount,
  };
}

export function computePlantGapActionPlan(
  site: SiteData,
  process: 'SMT' | 'PCA' | 'System Assembly' | 'Quality' | 'Troubleshooting' | 'Warehouse',
  varianceDL: number
): string {
  if (varianceDL === 0) {
    if (site.id === 'tao' || (site.plants && site.plants.length > 0)) {
      if (process === 'SMT' || process === 'PCA') return 'Plant capacity balanced: TP05 / TP08 (No Gap)';
      if (process === 'System Assembly') return 'Plant capacity balanced: TP08 / TP15 / TP16 (No Gap)';
      return 'Plant capacity balanced: TP08 / TP15 (No Gap)';
    }
    return `Plant capacity balanced: ${site.name} (No Gap)`;
  }

  const isDeficit = varianceDL < 0;
  const prefix = isDeficit ? 'Deficit Plants: ' : 'Surplus Plants: ';
  const sign = isDeficit ? '' : '+';

  // TAO or sites with sub-plants TP05, TP08, TP15, TP16
  if (site.id === 'tao' || (site.plants && site.plants.length > 0)) {
    if (process === 'System Assembly') {
      if (Math.abs(varianceDL) <= 4) {
        const g1 = Math.round(varianceDL * 0.5);
        const g2 = varianceDL - g1;
        return `${prefix}TP08 (${sign}${g1} DL), TP15 (${sign}${g2} DL)`;
      } else {
        const g1 = Math.round(varianceDL * 0.45);
        const g2 = Math.round(varianceDL * 0.35);
        const g3 = varianceDL - g1 - g2;
        return `${prefix}TP08 (${sign}${g1} DL), TP15 (${sign}${g2} DL), TP16 (${sign}${g3} DL)`;
      }
    }

    if (process === 'SMT' || process === 'PCA') {
      const g1 = Math.round(varianceDL * 0.6);
      const g2 = varianceDL - g1;
      return `${prefix}TP05 (${sign}${g1} DL), TP08 (${sign}${g2} DL)`;
    }

    if (process === 'Quality' || process === 'Troubleshooting') {
      const g1 = Math.round(varianceDL * 0.6);
      const g2 = varianceDL - g1;
      return g2 !== 0
        ? `${prefix}TP08 (${sign}${g1} DL), TP15 (${sign}${g2} DL)`
        : `${prefix}TP08 (${sign}${g1} DL)`;
    }

    if (process === 'Warehouse') {
      const g1 = Math.round(varianceDL * 0.7);
      const g2 = varianceDL - g1;
      return g2 !== 0
        ? `${prefix}TP15 (${sign}${g1} DL), TP08 (${sign}${g2} DL)`
        : `${prefix}TP15 (${sign}${g1} DL)`;
    }
  }

  if (site.id === 'overall') {
    // Top manufacturing sites contributing to enterprise gap
    if (process === 'System Assembly') {
      const g1 = Math.round(varianceDL * 0.4);
      const g2 = Math.round(varianceDL * 0.35);
      const g3 = varianceDL - g1 - g2;
      return `${prefix}TAO (${sign}${g1} DL), IME1 (${sign}${g2} DL), SQT (${sign}${g3} DL)`;
    }
    if (process === 'SMT' || process === 'PCA') {
      const g1 = Math.round(varianceDL * 0.55);
      const g2 = varianceDL - g1;
      return `${prefix}TAO (${sign}${g1} DL), IME1 (${sign}${g2} DL)`;
    }
    return `${prefix}TAO (${sign}${varianceDL} DL)`;
  }

  // Other individual sites
  return `${prefix}${site.name} (${sign}${varianceDL} DL)`;
}

export function generateCostCenterPayrollData(
  site: SiteData,
  apsPlan: MonthlyApsPlan
): CostCenterPayrollWeekly[] {
  // SMT Process Cost Centers
  const smtCC = parseCostCenters(site.smtCostCenter);
  const smtApsDL = apsPlan.smtOnlineDL + (site.smtOfflineDL || 0);
  const rawSmtMonthEndDL = Math.round(smtApsDL * 1.02);

  // PCA Process Cost Centers
  const pcaCC = parseCostCenters(site.pcaCostCenter);
  const pcaApsDL = apsPlan.pcaOnlineDL + (site.pcaOfflineDL || 0);
  const rawPcaMonthEndDL = Math.round(pcaApsDL * 0.97);

  // System Assembly Process Cost Centers
  const sysCC = parseCostCenters(site.assemblyCostCenter);
  const sysApsDL = apsPlan.assemblyOnlineDL + (site.assemblyOfflineDL || 0);
  const rawSysMonthEndDL = Math.round(sysApsDL * 0.98);

  // Quality Control
  const qcCC = parseCostCenters(site.qualityControl?.oqcCostCenter);
  const qcApsDL = site.qualityControl?.oqcStandardDL || 0;
  const rawQcMonthEndDL = qcApsDL;

  // Trouble Shooting
  const tsCC = ['CC-TS-7301'];
  const tsApsDL = site.troubleShooting?.dlEntry || 0;
  const rawTsMonthEndDL = tsApsDL;

  // Warehouse Logistics
  const whCC = ['CC-WH-7401'];
  const whApsDL = site.warehouse?.logisticsDL || 0;
  const rawWhMonthEndDL = Math.max(0, whApsDL + 1);

  // Normalize department monthEndDL figures so their total matches site.actualHrDL exactly
  let smtMonthEndDL = rawSmtMonthEndDL;
  let pcaMonthEndDL = rawPcaMonthEndDL;
  let sysMonthEndDL = rawSysMonthEndDL;
  let qcMonthEndDL = rawQcMonthEndDL;
  let tsMonthEndDL = rawTsMonthEndDL;
  let whMonthEndDL = rawWhMonthEndDL;

  if (site.actualHrDL && site.actualHrDL > 0) {
    const rawTotal = smtMonthEndDL + pcaMonthEndDL + sysMonthEndDL + qcMonthEndDL + tsMonthEndDL + whMonthEndDL;
    if (rawTotal > 0) {
      const scale = site.actualHrDL / rawTotal;
      smtMonthEndDL = Math.round(smtMonthEndDL * scale);
      pcaMonthEndDL = Math.round(pcaMonthEndDL * scale);
      qcMonthEndDL = Math.round(qcMonthEndDL * scale);
      tsMonthEndDL = Math.round(tsMonthEndDL * scale);
      whMonthEndDL = Math.round(whMonthEndDL * scale);
      sysMonthEndDL = Math.max(0, site.actualHrDL - (smtMonthEndDL + pcaMonthEndDL + qcMonthEndDL + tsMonthEndDL + whMonthEndDL));
    }
  }

  const smtW1 = smtMonthEndDL - 4;
  const smtW2 = smtMonthEndDL - 2;
  const smtW3 = smtMonthEndDL;
  const smtW4 = smtMonthEndDL + 1;

  const pcaW1 = pcaMonthEndDL - 3;
  const pcaW2 = pcaMonthEndDL - 1;
  const pcaW3 = pcaMonthEndDL;
  const pcaW4 = pcaMonthEndDL;

  const sysW1 = sysMonthEndDL - 6;
  const sysW2 = sysMonthEndDL - 3;
  const sysW3 = sysMonthEndDL - 1;
  const sysW4 = sysMonthEndDL;

  const qcW1 = qcMonthEndDL;
  const qcW2 = qcMonthEndDL;
  const qcW3 = qcMonthEndDL;
  const qcW4 = qcMonthEndDL;

  const tsW1 = tsMonthEndDL;
  const tsW2 = tsMonthEndDL;
  const tsW3 = tsMonthEndDL;
  const tsW4 = tsMonthEndDL;

  const whW1 = whMonthEndDL;
  const whW2 = whMonthEndDL;
  const whW3 = whMonthEndDL;
  const whW4 = whMonthEndDL;

  const makeRow = (
    dept: string,
    process: 'SMT' | 'PCA' | 'System Assembly' | 'Quality' | 'Troubleshooting' | 'Warehouse',
    ccs: string[],
    w1: number,
    w2: number,
    w3: number,
    w4: number,
    monthEnd: number,
    apsDL: number,
    attendanceRate: string
  ): CostCenterPayrollWeekly => {
    const variance = monthEnd - apsDL;
    let status: 'SURPLUS' | 'BALANCED' | 'DEFICIT' = 'BALANCED';
    if (variance < 0) {
      status = 'DEFICIT';
    } else if (variance > 0) {
      status = 'SURPLUS';
    }
    const actionNeeded = computePlantGapActionPlan(site, process, variance);
    return {
      department: dept,
      processType: process,
      costCenters: ccs.length > 0 ? ccs : [`CC-${process.slice(0, 3).toUpperCase()}-DEFAULT`],
      w1DL: w1,
      w2DL: w2,
      w3DL: w3,
      w4DL: w4,
      monthEndDL: monthEnd,
      attendanceRate,
      apsDemandDL: apsDL,
      varianceDL: variance,
      status,
      actionNeeded,
    };
  };

  return [
    makeRow(
      'SMT',
      'SMT',
      smtCC,
      smtW1,
      smtW2,
      smtW3,
      smtW4,
      smtMonthEndDL,
      smtApsDL,
      '98.6%'
    ),
    makeRow(
      'PCA',
      'PCA',
      pcaCC,
      pcaW1,
      pcaW2,
      pcaW3,
      pcaW4,
      pcaMonthEndDL,
      pcaApsDL,
      '96.8%'
    ),
    makeRow(
      'System Assembly',
      'System Assembly',
      sysCC,
      sysW1,
      sysW2,
      sysW3,
      sysW4,
      sysMonthEndDL,
      sysApsDL,
      '97.2%'
    ),
    makeRow(
      'Quality Control',
      'Quality',
      qcCC,
      qcW1,
      qcW2,
      qcW3,
      qcW4,
      qcMonthEndDL,
      qcApsDL,
      '99.1%'
    ),
    makeRow(
      'Troubleshooting',
      'Troubleshooting',
      tsCC,
      tsW1,
      tsW2,
      tsW3,
      tsW4,
      tsMonthEndDL,
      tsApsDL,
      '97.5%'
    ),
    makeRow(
      'Warehouse Logistics',
      'Warehouse',
      whCC,
      whW1,
      whW2,
      whW3,
      whW4,
      whMonthEndDL,
      whApsDL,
      '98.0%'
    ),
  ];
}

export function getMonthDailyStats(
  site: SiteData,
  month: number,
  dateStr: string,
  plantFilter: string = 'ALL'
) {
  const normPlant = plantFilter.toUpperCase().trim();
  const monthSummaries = getLineSummariesForMonth(month);
  const monthOrders = getOrdersForMonth(month);

  const relevantLines = monthSummaries.filter((l) => {
    if (normPlant !== 'ALL') {
      return l.plant.toUpperCase() === normPlant;
    }
    return true;
  });

  const activeLinesOnDate = relevantLines.filter(
    (l) => (l.daily[dateStr]?.totalQty || 0) > 0
  );

  const totalDayQty = activeLinesOnDate.reduce(
    (sum, l) => sum + (l.daily[dateStr]?.totalQty || 0),
    0
  );

  const totalShiftsOnDate = activeLinesOnDate.reduce(
    (sum, l) => sum + (l.daily[dateStr]?.shiftsActive || 0),
    0
  );

  // DL calculation: for each active line on this date, Std DL * Shifts active
  const lineDetails = activeLinesOnDate.map((l) => {
    const stdDL = getLineIeStandardDL(site, l.line);
    const shifts = l.daily[dateStr]?.shiftsActive || 1;
    const dayQty = l.daily[dateStr]?.totalQty || 0;
    const dQty = l.daily[dateStr]?.dQty || 0;
    const nQty = l.daily[dateStr]?.nQty || 0;
    const requiredDL = stdDL * shifts;

    return {
      plant: l.plant,
      line: l.line,
      family: l.family,
      model: l.model,
      dayQty,
      dQty,
      nQty,
      shifts,
      hasDay: l.daily[dateStr]?.hasDay || false,
      hasNight: l.daily[dateStr]?.hasNight || false,
      stdDL,
      requiredDL,
    };
  });

  const totalDayDL = lineDetails.reduce((sum, l) => sum + l.requiredDL, 0);

  // Relevant orders on this date
  const ordersOnDate = monthOrders.filter((ord) => {
    if (normPlant !== 'ALL' && ord.plant.toUpperCase() !== normPlant) {
      return false;
    }
    const daySchedule = ord.dailySchedule[dateStr];
    return daySchedule && daySchedule.totalQty > 0;
  }).map((ord) => ({
    id: ord.id,
    plant: ord.plant,
    line: ord.line,
    model: ord.model,
    family: ord.family,
    mo: ord.mo,
    planQty: ord.dailySchedule[dateStr]?.totalQty || 0,
    dQty: ord.dailySchedule[dateStr]?.dQty || 0,
    nQty: ord.dailySchedule[dateStr]?.nQty || 0,
    shiftText: ord.dailySchedule[dateStr]?.dQty && ord.dailySchedule[dateStr]?.nQty
      ? 'D + N'
      : ord.dailySchedule[dateStr]?.dQty
      ? 'D (Day)'
      : 'N (Night)',
    uph: ord.uph,
    totalScheduledQty: ord.totalScheduledQty,
  }));

  return {
    date: dateStr,
    totalDayQty,
    totalShiftsOnDate,
    totalDayDL,
    activeLinesCount: activeLinesOnDate.length,
    lineDetails,
    ordersOnDate,
  };
}

export function getAugustDailyStats(site: SiteData, dateStr: string, plantFilter: string = 'ALL') {
  return getMonthDailyStats(site, 8, dateStr, plantFilter);
}

// Monthly Budget Seasonality Factors reflecting manufacturing capacity ramp, working days, and HR budgeting targets
export const MONTHLY_BUDGET_FACTORS: Record<number, number> = {
  1: 0.94,  // Jan: Post-holiday ramp-up (21 working days)
  2: 0.88,  // Feb: Lunar New Year holiday break (17 working days)
  3: 0.96,  // Mar: Post-LNY capacity restoration (22 working days)
  4: 0.99,  // Apr: Q2 steady baseline (21 working days)
  5: 1.01,  // May: Pre-summer ramp build (21 working days)
  6: 1.04,  // Jun: High run-rate manufacturing (22 working days)
  7: 1.06,  // Jul: Q3 volume ramp (23 working days)
  8: 1.10,  // Aug: Master peak production schedule (12,658 units, 8 lines, 18 shifts, 22 working days)
  9: 1.07,  // Sep: Sustained high run-rate (21 working days)
  10: 1.11, // Oct: Q4 release peak volume (22 working days)
  11: 1.06, // Nov: Year-end delivery push (21 working days)
  12: 1.01, // Dec: Year-end balancing & audit (22 working days)
};

export function getMonthlyBudgetManpower(site: SiteData, month: number): {
  total: number;
  dl: number;
  idl: number;
  annualAverage: number;
  factor: number;
} {
  // If site has explicit configured monthly budgets override
  if (site.monthlyBudgets && site.monthlyBudgets[month]) {
    const mb = site.monthlyBudgets[month];
    return {
      total: mb.total,
      dl: mb.dl,
      idl: mb.idl,
      annualAverage: site.yearlyBudgetManpower || mb.total,
      factor: 1.0,
    };
  }

  const annualBaseTotal = site.yearlyBudgetManpower || 1290;
  const annualBaseDL = site.yearlyBudgetDL || Math.round(annualBaseTotal * 0.953);
  const annualBaseIDL = site.yearlyBudgetIDL !== undefined ? site.yearlyBudgetIDL : Math.max(0, annualBaseTotal - annualBaseDL);

  const factor = MONTHLY_BUDGET_FACTORS[month] || 1.0;
  const total = Math.round(annualBaseTotal * factor);
  const dlRatio = annualBaseTotal > 0 ? annualBaseDL / annualBaseTotal : 0.953;
  const dl = Math.round(total * dlRatio);
  const idl = total - dl;

  return {
    total,
    dl,
    idl,
    annualAverage: annualBaseTotal,
    factor,
  };
}

export function generate12MonthTrend(
  site: SiteData,
  selectedYear: number,
  selectedMonth: number
) {
  const basePlan = generateMonthlyApsPlan(site, selectedYear, selectedMonth);
  const baseApsDL = basePlan.totalApsDemandDL;
  const baseHrDL = site.actualHrDL || baseApsDL;

  // Base IDL for site (Quality Control, Troubleshooting, Warehouse, Other Support & segment IDLs)
  const qcIdlSum =
    (site.qualityControl?.pqcIDL !== undefined
      ? site.qualityControl.pqcIDL
      : (site.qualityControl?.pqcDayShift || 0) + (site.qualityControl?.pqcNightShift || 0)) +
    (site.qualityControl?.oqcIndirectIDL || 0);
  const tsIdl = site.troubleShooting?.idlEntry || 0;
  const whIdl = site.warehouse?.adminIDL || 0;
  const osIdl = site.otherSupport?.generalIDL || 0;
  const baseApsIDL =
    (site.smtIdl || 0) +
    (site.pcaIdl || 0) +
    (site.assemblyIdl || 0) +
    qcIdlSum +
    tsIdl +
    whIdl +
    osIdl;
  const baseHrIDL = site.actualHrIDL !== undefined ? site.actualHrIDL : baseApsIDL;

  // Real operational monthly variations based on master APS production plan schedule (Jan - Aug 2026 CPU Assembly)
  const monthlySeasonality = [
    { m: 1, name: 'Jan', apsFactor: 0.92, hrFactor: 0.94, activeLines: 7, totalShifts: 14, planUnits: 9840, workingDays: 21, isHistorical: true },
    { m: 2, name: 'Feb', apsFactor: 0.86, hrFactor: 0.88, activeLines: 6, totalShifts: 12, planUnits: 7920, workingDays: 17, isHistorical: true },
    { m: 3, name: 'Mar', apsFactor: 0.96, hrFactor: 0.95, activeLines: 8, totalShifts: 16, planUnits: 10650, workingDays: 22, isHistorical: true },
    { m: 4, name: 'Apr', apsFactor: 1.0, hrFactor: 0.98, activeLines: 8, totalShifts: 16, planUnits: 11200, workingDays: 21, isHistorical: true },
    { m: 5, name: 'May', apsFactor: 1.02, hrFactor: 1.0, activeLines: 8, totalShifts: 17, planUnits: 11850, workingDays: 21, isHistorical: true },
    { m: 6, name: 'Jun', apsFactor: 1.05, hrFactor: 1.03, activeLines: 8, totalShifts: 18, planUnits: 12180, workingDays: 22, isHistorical: true },
    { m: 7, name: 'Jul', apsFactor: 1.08, hrFactor: 1.04, activeLines: 8, totalShifts: 18, planUnits: 12460, workingDays: 23, isHistorical: true },
    // Month 8: Real August APS Production Schedule Data (12,658 units, 8 lines, 193 MOs)
    { m: 8, name: 'Aug', apsFactor: 1.12, hrFactor: 1.07, activeLines: 8, totalShifts: 18, planUnits: 12658, workingDays: 22, isHistorical: true },
    { m: 9, name: 'Sep', apsFactor: 1.1, hrFactor: 1.08, activeLines: 8, totalShifts: 17, planUnits: 12300, workingDays: 21, isHistorical: false },
    { m: 10, name: 'Oct', apsFactor: 1.14, hrFactor: 1.1, activeLines: 9, totalShifts: 19, planUnits: 13100, workingDays: 22, isHistorical: false },
    { m: 11, name: 'Nov', apsFactor: 1.09, hrFactor: 1.08, activeLines: 8, totalShifts: 17, planUnits: 12000, workingDays: 21, isHistorical: false },
    { m: 12, name: 'Dec', apsFactor: 1.04, hrFactor: 1.05, activeLines: 8, totalShifts: 16, planUnits: 11500, workingDays: 22, isHistorical: false },
  ];

  return monthlySeasonality.map((item) => {
    const isSelected = item.m === selectedMonth;
    const apsDemandDL = isSelected ? baseApsDL : Math.round(baseApsDL * item.apsFactor);
    const apsDemandIDL = isSelected ? baseApsIDL : Math.round(baseApsIDL * (1 + (item.apsFactor - 1) * 0.3));
    const totalApsDemand = apsDemandDL + apsDemandIDL;

    const hrActualDL = isSelected ? baseHrDL : Math.round(baseHrDL * item.hrFactor);
    const hrActualIDL = isSelected ? baseHrIDL : Math.round(baseHrIDL * (1 + (item.hrFactor - 1) * 0.3));
    const totalHrActual = hrActualDL + hrActualIDL;

    const varianceGap = totalHrActual - totalApsDemand;
    const dlVarianceGap = hrActualDL - apsDemandDL;
    const idlVarianceGap = hrActualIDL - apsDemandIDL;
    const fulfillmentRate = Math.round((totalHrActual / (totalApsDemand || 1)) * 100);

    // Monthly-specific Yearly Budget Manpower target
    const budgetInfo = getMonthlyBudgetManpower(site, item.m);
    const yearlyBudget = budgetInfo.total;
    const yearlyBudgetDL = budgetInfo.dl;
    const yearlyBudgetIDL = budgetInfo.idl;
    const budgetHitRate = Math.round((totalApsDemand / (yearlyBudget || 1)) * 100);
    const budgetVarianceGap = totalApsDemand - yearlyBudget;
    const manpowerUtilization = Math.round((totalApsDemand / (totalHrActual || 1)) * 100);

    return {
      month: item.m,
      monthName: item.name,
      apsDemandDL,
      apsDemandIDL,
      totalApsDemand,
      hrActualDL,
      hrActualIDL,
      totalHrActual,
      varianceGap,
      dlVarianceGap,
      idlVarianceGap,
      fulfillmentRate,
      isSelected,
      activeLines: item.activeLines,
      totalShifts: item.totalShifts,
      planUnits: item.planUnits,
      workingDays: item.workingDays,
      isHistoricalAps: item.isHistorical,
      yearlyBudget,
      yearlyBudgetDL,
      yearlyBudgetIDL,
      budgetHitRate,
      budgetVarianceGap,
      manpowerUtilization,
    };
  });
}

// Re-export SMT & PCA Continuity data and helpers
export {
  AUGUST_SMT_ORDERS,
  AUGUST_SMT_LINE_SUMMARIES,
  SMT_PAIRS_CONFIG,
  getAugustSmtLineSummaries,
} from '../data/apsSmtPcaSchedule';
export type { SmtPcaOrder, SmtLineSummary } from '../data/apsSmtPcaSchedule';
