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

const SMT_MONTH_FACTORS: Record<number, number> = {
  1: 0.95, 2: 0.88, 3: 0.98, 4: 1.0, 5: 1.02, 6: 1.04, 7: 1.06, 8: 1.0, 9: 1.01, 10: 1.05, 11: 1.02, 12: 0.97,
};

function normalizeLineCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isRackLineName(name: string): boolean {
  const norm = name.toUpperCase().trim();
  return norm.startsWith('R') || norm.startsWith('TR') || norm.includes('RACK');
}

function getEffectiveMonthConfig(site: SiteData, planningMonth: number) {
  const monthEntry = site.monthlyDepartmentData?.[planningMonth];
  const snap = monthEntry?.snapshot;

  return {
    smtLines: snap?.smtLines ?? site.smtLines ?? [],
    pcaLines: snap?.pcaLines ?? site.pcaLines ?? [],
    cpuAssemblyLines: snap?.cpuAssemblyLines ?? site.cpuAssemblyLines ?? [],
    rackAssemblyLines: snap?.rackAssemblyLines ?? site.rackAssemblyLines ?? [],
    smtOfflineDL: snap?.smtOfflineDL ?? site.smtOfflineDL ?? 0,
    pcaOfflineDL: snap?.pcaOfflineDL ?? site.pcaOfflineDL ?? 0,
    assemblyOfflineDL: snap?.assemblyOfflineDL ?? site.assemblyOfflineDL ?? 0,
    smtOfflineShift:
      typeof (snap?.smtOfflineShift ?? site.smtOfflineShift) === 'number'
        ? (snap?.smtOfflineShift ?? site.smtOfflineShift)!
        : 2,
    pcaOfflineShift:
      typeof (snap?.pcaOfflineShift ?? site.pcaOfflineShift) === 'number'
        ? (snap?.pcaOfflineShift ?? site.pcaOfflineShift)!
        : 2,
    assemblyOfflineShift:
      typeof (snap?.assemblyOfflineShift ?? site.assemblyOfflineShift) === 'number'
        ? (snap?.assemblyOfflineShift ?? site.assemblyOfflineShift)!
        : 2,
    smtIdl: snap?.smtIdl ?? site.smtIdl ?? 0,
    pcaIdl: snap?.pcaIdl ?? site.pcaIdl ?? 0,
    assemblyIdl: snap?.assemblyIdl ?? site.assemblyIdl ?? 0,
    qc: snap?.qualityControl ?? site.qualityControl,
    ts: snap?.troubleShooting ?? site.troubleShooting,
    wh: snap?.warehouse ?? site.warehouse,
    os: snap?.otherSupport ?? site.otherSupport,
    monthEntry,
  };
}

function resolveSupportManpower(cfg: ReturnType<typeof getEffectiveMonthConfig>) {
  const { qc, ts, wh, os } = cfg;

  const qcDL =
    qc?.items && qc.items.length > 0
      ? qc.items.reduce(
          (acc, it) => acc + (Number(it.dl) || 0) * (typeof it.shift === 'number' ? it.shift : 1),
          0
        )
      : (qc?.pqcDL || 0) + (qc?.oqcStandardDL || qc?.oqcDL || 0);

  const qcIDL =
    qc?.items && qc.items.length > 0
      ? qc.items.reduce((acc, it) => acc + (Number(it.idl) || 0), 0)
      : (qc?.pqcIDL !== undefined
          ? qc.pqcIDL
          : (qc?.pqcDayShift || 0) + (qc?.pqcNightShift || 0)) +
        (qc?.oqcIndirectIDL || qc?.oqcIDL || 0);

  const tsDL =
    ts?.items && ts.items.length > 0
      ? ts.items.reduce(
          (acc, it) => acc + (Number(it.dl) || 0) * (typeof it.shift === 'number' ? it.shift : 1),
          0
        )
      : (ts?.dlEntry || 0);

  const tsIDL =
    ts?.items && ts.items.length > 0
      ? ts.items.reduce((acc, it) => acc + (Number(it.idl) || 0), 0)
      : (ts?.idlEntry || 0);

  const whDL =
    wh?.items && wh.items.length > 0
      ? wh.items.reduce(
          (acc, it) => acc + (Number(it.dl) || 0) * (typeof it.shift === 'number' ? it.shift : 1),
          0
        )
      : (wh?.logisticsDL || 0);

  const whIDL =
    wh?.items && wh.items.length > 0
      ? wh.items.reduce((acc, it) => acc + (Number(it.idl) || 0), 0)
      : (wh?.adminIDL || 0);

  const otherSupportDL =
    os?.items && os.items.length > 0
      ? os.items.reduce(
          (acc, it) => acc + (Number(it.dl) || 0) * (typeof it.shift === 'number' ? it.shift : 1),
          0
        )
      : (os?.dl || 0);

  const otherIDL =
    os?.items && os.items.length > 0
      ? os.items.reduce((acc, it) => acc + (Number(it.idl) || 0), 0)
      : (os?.generalIDL || 0);

  return {
    qcDL,
    qcIDL,
    tsDL,
    tsIDL,
    whDL,
    whIDL,
    otherSupportDL,
    otherIDL,
  };
}

function computeSmtPcaScheduleBaseline(planningMonth: number) {
  const mFactor = SMT_MONTH_FACTORS[planningMonth] ?? 1.0;

  // Collect all active production dates in the August SMT/PCA schedule
  const activeDatesSet = new Set<string>();
  for (const pair of AUGUST_SMT_LINE_SUMMARIES) {
    for (const [dt, d] of Object.entries(pair.daily)) {
      if ((d.shifts || 0) > 0) {
        activeDatesSet.add(dt);
      }
    }
  }
  const activeDates = Array.from(activeDatesSet);
  const activeDays = activeDates.length || 22;

  let totalFloorShifts = 0;
  let totalLineShifts = 0;
  const lineShiftSums: Record<string, number> = {};

  for (const pair of AUGUST_SMT_LINE_SUMMARIES) {
    lineShiftSums[pair.smtLine] = 0;
  }

  for (const dt of activeDates) {
    let hasDay = false;
    let hasNight = false;
    for (const pair of AUGUST_SMT_LINE_SUMMARIES) {
      const d = pair.daily[dt];
      if (d && d.shifts > 0) {
        if (d.hasDay) hasDay = true;
        if (d.hasNight) hasNight = true;
        totalLineShifts += d.shifts;
        lineShiftSums[pair.smtLine] += d.shifts;
      }
    }
    totalFloorShifts += (hasDay ? 1 : 0) + (hasNight ? 1 : 0);
  }

  const avgFloorShifts = Math.min(2, (totalFloorShifts / activeDays) * mFactor);
  const avgLineShifts = (totalLineShifts / activeDays) * mFactor;

  return {
    activeDates,
    activeDays,
    mFactor,
    avgFloorShifts,
    avgLineShifts,
    lineShiftSums,
  };
}

function computeAssyScheduleBaseline(planningMonth: number) {
  const mFactor = SMT_MONTH_FACTORS[planningMonth] ?? 1.0;
  // Months 1..8 have direct master schedules; Months 9..12 project from latest full-month baseline (Month 7)
  const hasDirectMonth = Boolean(APS_MASTER_MONTHS[planningMonth]);
  const masterMonth = hasDirectMonth ? planningMonth : 7;
  const scale = hasDirectMonth ? 1.0 : mFactor / (SMT_MONTH_FACTORS[7] || 1.06);
  const masterData = APS_MASTER_MONTHS[masterMonth] || APS_MASTER_MONTHS[8];

  const activeDatesSet = new Set<string>();
  for (const l of masterData.lines) {
    for (const [dt, d] of Object.entries(l.daily)) {
      if ((d.shiftsActive || 0) > 0 || (d.totalQty || 0) > 0) {
        activeDatesSet.add(dt);
      }
    }
  }
  const activeDates = Array.from(activeDatesSet);
  const activeDays = activeDates.length || masterData.workingDays || 22;

  let totalFloorShifts = 0;
  let cpuLineShifts = 0;
  let rackLineShifts = 0;
  let cpuLinesCount = 0;
  let rackLinesCount = 0;

  for (const l of masterData.lines) {
    if (isRackLineName(l.line)) rackLinesCount++;
    else cpuLinesCount++;
  }

  for (const dt of activeDates) {
    let hasDay = false;
    let hasNight = false;
    for (const l of masterData.lines) {
      const d = l.daily[dt];
      const sh = d?.shiftsActive || (d?.totalQty > 0 ? 1 : 0);
      if (sh > 0) {
        if (d?.hasDay) hasDay = true;
        if (d?.hasNight) hasNight = true;
        if (isRackLineName(l.line)) rackLineShifts += sh;
        else cpuLineShifts += sh;
      }
    }
    totalFloorShifts += (hasDay ? 1 : 0) + (hasNight ? 1 : 0);
  }

  const avgFloorShifts = Math.min(2, (totalFloorShifts / activeDays) * scale);
  const avgCpuLineShifts = (cpuLineShifts / activeDays) * scale;
  const avgRackLineShifts = (rackLineShifts / activeDays) * scale;

  return {
    masterLines: masterData.lines,
    activeDates,
    activeDays,
    scale,
    avgFloorShifts,
    avgCpuLineShifts,
    avgRackLineShifts,
    cpuLinesCount: cpuLinesCount || 6,
    rackLinesCount: rackLinesCount || 2,
  };
}

export function generateMonthlyApsPlan(
  site: SiteData,
  planningYear: number,
  planningMonth: number
): MonthlyApsPlan {
  const { targetYear, targetMonth } = getNextMonthPeriod(planningYear, planningMonth);
  const cfg = getEffectiveMonthConfig(site, planningMonth);

  const isTaoPlant = site.id === 'tao' || site.code === 'TAO';

  const smtPcaBase = computeSmtPcaScheduleBaseline(planningMonth);
  const assyBase = computeAssyScheduleBaseline(planningMonth);

  const lines: DailyLineSchedule[] = [];

  // Calculate IE Capacities for this site
  const smtIeCapacityShifts = cfg.smtLines.reduce(
    (sum, l) => sum + (typeof l.shift === 'number' ? l.shift : 2),
    0
  );
  const pcaIeCapacityShifts = cfg.pcaLines.reduce(
    (sum, l) => sum + Math.max(l.faShift ?? 1, l.testShift ?? 1, l.packingShift ?? 1),
    0
  );
  let cpuIeCapacityShifts = cfg.cpuAssemblyLines.reduce(
    (sum, l) => sum + (typeof l.assyShift === 'number' ? l.assyShift : (typeof l.shift === 'number' ? l.shift : 2)),
    0
  );
  let rackIeCapacityShifts = cfg.rackAssemblyLines.reduce(
    (sum, l) => sum + (typeof l.assyShift === 'number' ? l.assyShift : (typeof l.shift === 'number' ? l.shift : 2)),
    0
  );

  // TAO baseline schedule operation ratios (for scaling non-TAO sites without individual APS tables)
  const taoSmtCapacityRef = 21; // S21..S73 IE capacity shifts
  const smtOpRate = Math.min(1, smtPcaBase.avgLineShifts / taoSmtCapacityRef);

  const cpuCapRef = Math.max(1, assyBase.cpuLinesCount * 2);
  const rackCapRef = Math.max(1, assyBase.rackLinesCount * 2);
  const cpuOpRate = Math.min(1, assyBase.avgCpuLineShifts / cpuCapRef);
  const rackOpRate = Math.min(1, assyBase.avgRackLineShifts / rackCapRef);

  let smtAvgActiveLineShifts = 0;
  let pcaAvgActiveLineShifts = 0;
  let cpuAvgActiveLineShifts = 0;
  let rackAvgActiveLineShifts = 0;

  let smtOnlineRaw = 0;
  let pcaOnlineRaw = 0;
  let assemblyOnlineRaw = 0;

  if (isTaoPlant) {
    // 1. SMT Lines — directly driven by APS daily SMT schedule × IE Standard DL
    const matchedSmtIds = new Set<string>();
    for (const pair of AUGUST_SMT_LINE_SUMMARIES) {
      const targetNorm = normalizeLineCode(pair.smtLine);
      const ieLine = cfg.smtLines.find((l) => {
        const lNorm = normalizeLineCode(l.name);
        return lNorm === targetNorm || lNorm.includes(targetNorm) || targetNorm.includes(lNorm);
      });
      if (ieLine) matchedSmtIds.add(ieLine.id);

      const ieShift = ieLine ? (typeof ieLine.shift === 'number' ? ieLine.shift : 2) : 2;
      const stdDL = ieLine ? ieLine.onlineStdDL || 0 : pair.smtStdDL;

      let sumDayDL = 0;
      let sumShifts = 0;
      let lineActiveDays = 0;

      for (const dt of smtPcaBase.activeDates) {
        const apsShifts = pair.daily[dt]?.shifts || 0;
        if (apsShifts > 0) {
          const effShifts = Math.min(apsShifts, ieShift);
          if (effShifts > 0) {
            lineActiveDays++;
            sumShifts += effShifts;
            sumDayDL += stdDL * effShifts;
          }
        }
      }

      const avgDailyShifts = (sumShifts / smtPcaBase.activeDays) * smtPcaBase.mFactor;
      const avgDailyDL = (sumDayDL / smtPcaBase.activeDays) * smtPcaBase.mFactor;
      smtAvgActiveLineShifts += avgDailyShifts;
      smtOnlineRaw += avgDailyDL;

      lines.push({
        lineId: ieLine?.id || `aps-smt-${pair.smtLine}`,
        lineName: ieLine?.name || `Line-${pair.smtLine}`,
        process: 'SMT',
        category: ieLine?.category || 'MB',
        ieStdDLPerShift: stdDL,
        dailyShifts: Number(avgDailyShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDailyDL),
        shiftDetails: `APS Avg ${avgDailyShifts.toFixed(2)} sh/day (${lineActiveDays}/${smtPcaBase.activeDays} active days)`,
        daysActiveInMonth: lineActiveDays,
      });
    }

    // Any extra custom SMT lines added by IE beyond S21..S73
    for (const ieLine of cfg.smtLines) {
      if (matchedSmtIds.has(ieLine.id)) continue;
      const ieShift = typeof ieLine.shift === 'number' ? ieLine.shift : 2;
      const avgDailyShifts = ieShift * smtOpRate;
      const avgDailyDL = (ieLine.onlineStdDL || 0) * avgDailyShifts;
      smtAvgActiveLineShifts += avgDailyShifts;
      smtOnlineRaw += avgDailyDL;
      lines.push({
        lineId: ieLine.id,
        lineName: ieLine.name,
        process: 'SMT',
        category: ieLine.category,
        ieStdDLPerShift: ieLine.onlineStdDL || 0,
        dailyShifts: Number(avgDailyShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDailyDL),
        shiftDetails: `APS Ratio ${avgDailyShifts.toFixed(2)} sh/day`,
        daysActiveInMonth: avgDailyShifts > 0 ? smtPcaBase.activeDays : 0,
      });
    }

    // 2. PCA Lines — continuous with SMT schedule × station-level IE Standard DL (FA + Test + Pack)
    const matchedPcaIds = new Set<string>();
    for (const pair of AUGUST_SMT_LINE_SUMMARIES) {
      const targetNorm = normalizeLineCode(pair.pcaLine);
      const ieLine = cfg.pcaLines.find((l) => {
        const lNorm = normalizeLineCode(l.name);
        return lNorm === targetNorm || lNorm.includes(targetNorm) || targetNorm.includes(lNorm);
      });
      if (ieLine) matchedPcaIds.add(ieLine.id);

      const faShift = ieLine ? (typeof ieLine.faShift === 'number' ? ieLine.faShift : 2) : 2;
      const testShift = ieLine ? (typeof ieLine.testShift === 'number' ? ieLine.testShift : 2) : 2;
      const packShift = ieLine ? (typeof ieLine.packingShift === 'number' ? ieLine.packingShift : 2) : 2;

      const faDL = ieLine ? ieLine.faStdDL || 0 : Math.round(pair.pcaStdDL * 0.45);
      const testDL = ieLine ? ieLine.testStdDL || 0 : Math.round(pair.pcaStdDL * 0.35);
      const packDL = ieLine ? ieLine.packingStdDL || 0 : Math.max(0, pair.pcaStdDL - faDL - testDL);

      let sumDayDL = 0;
      let sumShifts = 0;
      let lineActiveDays = 0;

      for (const dt of smtPcaBase.activeDates) {
        const apsShifts = pair.daily[dt]?.shifts || 0;
        if (apsShifts > 0) {
          const lineMaxShift = Math.max(faShift, testShift, packShift);
          const effShifts = Math.min(apsShifts, lineMaxShift);
          if (effShifts > 0) {
            lineActiveDays++;
            sumShifts += effShifts;
            sumDayDL +=
              faDL * Math.min(apsShifts, faShift) +
              testDL * Math.min(apsShifts, testShift) +
              packDL * Math.min(apsShifts, packShift);
          }
        }
      }

      const avgDailyShifts = (sumShifts / smtPcaBase.activeDays) * smtPcaBase.mFactor;
      const avgDailyDL = (sumDayDL / smtPcaBase.activeDays) * smtPcaBase.mFactor;
      pcaAvgActiveLineShifts += avgDailyShifts;
      pcaOnlineRaw += avgDailyDL;

      const effStdPerShift = avgDailyShifts > 0 ? avgDailyDL / avgDailyShifts : faDL + testDL + packDL;

      lines.push({
        lineId: ieLine?.id || `aps-pca-${pair.pcaLine}`,
        lineName: ieLine?.name || `Line-${pair.pcaLine}`,
        process: 'PCA',
        category: ieLine?.category || 'MB',
        ieStdDLPerShift: Math.round(effStdPerShift * 10) / 10,
        dailyShifts: Number(avgDailyShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDailyDL),
        shiftDetails: `APS Continuous ${avgDailyShifts.toFixed(2)} sh/day (FA+Test+Pack)`,
        daysActiveInMonth: lineActiveDays,
      });
    }

    for (const ieLine of cfg.pcaLines) {
      if (matchedPcaIds.has(ieLine.id)) continue;
      const faSh = (ieLine.faShift ?? 2) * smtOpRate;
      const testSh = (ieLine.testShift ?? 2) * smtOpRate;
      const packSh = (ieLine.packingShift ?? 2) * smtOpRate;
      const avgDailyDL =
        (ieLine.faStdDL || 0) * faSh +
        (ieLine.testStdDL || 0) * testSh +
        (ieLine.packingStdDL || 0) * packSh;
      const avgShifts = Math.max(faSh, testSh, packSh);
      pcaAvgActiveLineShifts += avgShifts;
      pcaOnlineRaw += avgDailyDL;
      lines.push({
        lineId: ieLine.id,
        lineName: ieLine.name,
        process: 'PCA',
        category: ieLine.category,
        ieStdDLPerShift: (ieLine.faStdDL || 0) + (ieLine.testStdDL || 0) + (ieLine.packingStdDL || 0),
        dailyShifts: Number(avgShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDailyDL),
        shiftDetails: `APS Ratio ${avgShifts.toFixed(2)} sh/day`,
        daysActiveInMonth: avgShifts > 0 ? smtPcaBase.activeDays : 0,
      });
    }

    // 3. System Assembly Lines (CPU + RACK) — directly driven by APS_MASTER_MONTHS daily schedule
    const allIeAssyLines = [...cfg.cpuAssemblyLines, ...cfg.rackAssemblyLines];
    const matchedAssyIds = new Set<string>();

    for (const masterLine of assyBase.masterLines) {
      const mNorm = masterLine.line.toUpperCase().trim();
      const isRack = isRackLineName(masterLine.line);
      const ieLine = allIeAssyLines.find((l) => {
        const lNorm = l.name.toUpperCase();
        return lNorm.includes(mNorm) || mNorm.includes(lNorm);
      });
      if (ieLine) matchedAssyIds.add(ieLine.id);

      if (!ieLine) {
        if (isRack) rackIeCapacityShifts += 2;
        else cpuIeCapacityShifts += 2;
      }

      let sumDayDL = 0;
      let sumShifts = 0;
      let lineActiveDays = 0;

      for (const dt of assyBase.activeDates) {
        const d = masterLine.daily[dt];
        const apsShifts = d?.shiftsActive || (d?.totalQty > 0 ? 1 : 0);
        if (apsShifts > 0) {
          if (ieLine) {
            const assySh = typeof ieLine.assyShift === 'number' ? ieLine.assyShift : 2;
            const testSh = typeof ieLine.testShift === 'number' ? ieLine.testShift : 2;
            const packSh = typeof ieLine.packShift === 'number' ? ieLine.packShift : 1;
            const lineMaxSh = Math.max(assySh, testSh, packSh);
            const effShifts = Math.min(apsShifts, lineMaxSh);
            if (effShifts > 0) {
              lineActiveDays++;
              sumShifts += effShifts;
              sumDayDL +=
                (ieLine.assyDL || 0) * Math.min(apsShifts, assySh) +
                (ieLine.testDL || 0) * Math.min(apsShifts, testSh) +
                (ieLine.packDL || 0) * Math.min(apsShifts, packSh);
            }
          } else {
            lineActiveDays++;
            sumShifts += apsShifts;
            sumDayDL += getLineIeStandardDL(site, masterLine.line) * apsShifts;
          }
        }
      }

      const avgDailyShifts = (sumShifts / assyBase.activeDays) * assyBase.scale;
      const avgDailyDL = (sumDayDL / assyBase.activeDays) * assyBase.scale;
      if (isRack) rackAvgActiveLineShifts += avgDailyShifts;
      else cpuAvgActiveLineShifts += avgDailyShifts;
      assemblyOnlineRaw += avgDailyDL;

      const fallbackStd = ieLine
        ? (ieLine.assyDL || 0) + (ieLine.testDL || 0) + (ieLine.packDL || 0)
        : getLineIeStandardDL(site, masterLine.line);
      const effStdPerShift = avgDailyShifts > 0 ? avgDailyDL / avgDailyShifts : fallbackStd;

      lines.push({
        lineId: ieLine?.id || `aps-assy-${masterLine.line}`,
        lineName: ieLine?.name || `Line-${masterLine.line}`,
        process: 'System Assembly',
        ieStdDLPerShift: Math.round(effStdPerShift * 10) / 10,
        dailyShifts: Number(avgDailyShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDailyDL),
        shiftDetails: `APS Avg ${avgDailyShifts.toFixed(2)} sh/day (${lineActiveDays}/${assyBase.activeDays} active days)`,
        daysActiveInMonth: lineActiveDays,
      });
    }

    // Also include unmatched IE assembly lines (only if IE added custom lines not in APS master)
    for (const ieLine of allIeAssyLines) {
      if (matchedAssyIds.has(ieLine.id)) continue;
      // R02 in TAO is an unscheduled standby line unless scheduled in APS
      const isStandbyR02 = normalizeLineCode(ieLine.name).includes('R02');
      if (isStandbyR02) {
        lines.push({
          lineId: ieLine.id,
          lineName: ieLine.name,
          process: 'System Assembly',
          ieStdDLPerShift: (ieLine.assyDL || 0) + (ieLine.testDL || 0) + (ieLine.packDL || 0),
          dailyShifts: 0,
          dailyRequiredDL: 0,
          shiftDetails: 'Not scheduled in APS daily plan (0 sh/day)',
          daysActiveInMonth: 0,
        });
      }
    }
  } else {
    // Non-TAO individual plants: apply APS schedule shift operation rates to each plant's IE lines & stations
    for (const line of cfg.smtLines) {
      const ieShift = typeof line.shift === 'number' ? line.shift : 2;
      const avgShifts = ieShift * smtOpRate;
      const avgDL = (line.onlineStdDL || 0) * avgShifts;
      smtAvgActiveLineShifts += avgShifts;
      smtOnlineRaw += avgDL;
      lines.push({
        lineId: line.id,
        lineName: line.name,
        process: 'SMT',
        category: line.category,
        ieStdDLPerShift: line.onlineStdDL || 0,
        dailyShifts: Number(avgShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDL),
        shiftDetails: `APS Ratio ${avgShifts.toFixed(2)} sh/day`,
        daysActiveInMonth: avgShifts > 0 ? smtPcaBase.activeDays : 0,
      });
    }

    for (const line of cfg.pcaLines) {
      const faShift = typeof line.faShift === 'number' ? line.faShift : (typeof line.shift === 'number' ? line.shift : 2);
      const testShift = typeof line.testShift === 'number' ? line.testShift : (typeof line.shift === 'number' ? line.shift : 2);
      const packShift = typeof line.packingShift === 'number' ? line.packingShift : (typeof line.shift === 'number' ? line.shift : 2);

      const avgDL =
        (line.faStdDL || 0) * faShift * smtOpRate +
        (line.testStdDL || 0) * testShift * smtOpRate +
        (line.packingStdDL || 0) * packShift * smtOpRate;
      const avgShifts = Math.max(faShift, testShift, packShift) * smtOpRate;
      pcaAvgActiveLineShifts += avgShifts;
      pcaOnlineRaw += avgDL;

      const stdSum = (line.faStdDL || 0) + (line.testStdDL || 0) + (line.packingStdDL || 0);
      lines.push({
        lineId: line.id,
        lineName: line.name,
        process: 'PCA',
        category: line.category,
        ieStdDLPerShift: stdSum,
        dailyShifts: Number(avgShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDL),
        shiftDetails: `APS Ratio ${avgShifts.toFixed(2)} sh/day (FA+Test+Pack)`,
        daysActiveInMonth: avgShifts > 0 ? smtPcaBase.activeDays : 0,
      });
    }

    for (const line of cfg.cpuAssemblyLines) {
      const assyShift = typeof line.assyShift === 'number' ? line.assyShift : (typeof line.shift === 'number' ? line.shift : 2);
      const testShift = typeof line.testShift === 'number' ? line.testShift : (typeof line.shift === 'number' ? line.shift : 2);
      const packShift = typeof line.packShift === 'number' ? line.packShift : (typeof line.shift === 'number' ? line.shift : 1);

      const avgDL =
        (line.assyDL || 0) * assyShift * cpuOpRate +
        (line.testDL || 0) * testShift * cpuOpRate +
        (line.packDL || 0) * packShift * cpuOpRate;
      const avgShifts = assyShift * cpuOpRate;
      cpuAvgActiveLineShifts += avgShifts;
      assemblyOnlineRaw += avgDL;

      lines.push({
        lineId: line.id,
        lineName: line.name,
        process: 'System Assembly',
        ieStdDLPerShift: (line.assyDL || 0) + (line.testDL || 0) + (line.packDL || 0),
        dailyShifts: Number(avgShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDL),
        shiftDetails: `APS Ratio ${avgShifts.toFixed(2)} sh/day (Assy+Test+Pack)`,
        daysActiveInMonth: avgShifts > 0 ? assyBase.activeDays : 0,
      });
    }

    for (const line of cfg.rackAssemblyLines) {
      const assyShift = typeof line.assyShift === 'number' ? line.assyShift : (typeof line.shift === 'number' ? line.shift : 2);
      const testShift = typeof line.testShift === 'number' ? line.testShift : (typeof line.shift === 'number' ? line.shift : 2);
      const packShift = typeof line.packShift === 'number' ? line.packShift : (typeof line.shift === 'number' ? line.shift : 1);

      const avgDL =
        (line.assyDL || 0) * assyShift * rackOpRate +
        (line.testDL || 0) * testShift * rackOpRate +
        (line.packDL || 0) * packShift * rackOpRate;
      const avgShifts = assyShift * rackOpRate;
      rackAvgActiveLineShifts += avgShifts;
      assemblyOnlineRaw += avgDL;

      lines.push({
        lineId: line.id,
        lineName: line.name,
        process: 'System Assembly',
        ieStdDLPerShift: (line.assyDL || 0) + (line.testDL || 0) + (line.packDL || 0),
        dailyShifts: Number(avgShifts.toFixed(2)),
        dailyRequiredDL: Math.round(avgDL),
        shiftDetails: `APS Ratio ${avgShifts.toFixed(2)} sh/day (Assy+Test+Pack)`,
        daysActiveInMonth: avgShifts > 0 ? assyBase.activeDays : 0,
      });
    }
  }

  const smtOnlineDL = Math.round(smtOnlineRaw);
  const pcaOnlineDL = Math.round(pcaOnlineRaw);
  const assemblyOnlineDL = Math.round(assemblyOnlineRaw);
  const totalOnlineDL = smtOnlineDL + pcaOnlineDL + assemblyOnlineDL;

  // 4. Manufacturing Offline DL:
  //    (Offline DL / Offline Shift) = Avg Offline DL per shift
  //    Scheduled Offline DL = Avg Offline DL per shift × Scheduled Daily Avg Active Floor Shifts
  const smtOfflinePerShift = cfg.smtOfflineShift > 0 ? cfg.smtOfflineDL / cfg.smtOfflineShift : 0;
  const pcaOfflinePerShift = cfg.pcaOfflineShift > 0 ? cfg.pcaOfflineDL / cfg.pcaOfflineShift : 0;
  const assyOfflinePerShift = cfg.assemblyOfflineShift > 0 ? cfg.assemblyOfflineDL / cfg.assemblyOfflineShift : 0;

  const smtScheduledOfflineDL = Math.round(
    (cfg.smtOfflineShift > 0 ? smtOfflinePerShift * smtPcaBase.avgFloorShifts : 0)
  );
  const pcaScheduledOfflineDL = Math.round(
    (cfg.pcaOfflineShift > 0 ? pcaOfflinePerShift * smtPcaBase.avgFloorShifts : 0)
  );
  const assyScheduledOfflineDL = Math.round(
    (cfg.assemblyOfflineShift > 0 ? assyOfflinePerShift * assyBase.avgFloorShifts : 0)
  );

  const totalOfflineDL = smtScheduledOfflineDL + pcaScheduledOfflineDL + assyScheduledOfflineDL;

  // 5. Quality & Support Departments DL & IDL
  const support = resolveSupportManpower(cfg);
  const totalSupportDL =
    support.qcDL + support.tsDL + support.whDL + support.otherSupportDL;

  const totalApsDemandDL = totalOnlineDL + totalOfflineDL + totalSupportDL;

  // 6. Manufacturing & Support IDL
  const mfgIDL = cfg.smtIdl + cfg.pcaIdl + cfg.assemblyIdl;
  const supportIDL =
    support.qcIDL + support.tsIDL + support.whIDL + support.otherIDL;
  const fixedIDL = mfgIDL + supportIDL;
  const totalDemandHeadcount = totalApsDemandDL + fixedIDL;

  return {
    planningYear,
    planningMonth,
    targetYear,
    targetMonth,
    cycleWeek: 'W3 Update (Published 3rd Week Monthly)',
    workingDays: assyBase.activeDays,
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
    smtOfflineDL: smtScheduledOfflineDL,
    pcaOfflineDL: pcaScheduledOfflineDL,
    assemblyOfflineDL: assyScheduledOfflineDL,
    qcDL: support.qcDL,
    tsDL: support.tsDL,
    whDL: support.whDL,
    otherSupportDL: support.otherSupportDL,
    scheduleStats: {
      smtActiveDays: smtPcaBase.activeDays,
      smtAvgFloorShifts: smtPcaBase.avgFloorShifts,
      smtAvgActiveLineShifts,
      smtIeCapacityShifts,
      pcaAvgActiveLineShifts,
      pcaIeCapacityShifts,
      assyActiveDays: assyBase.activeDays,
      assyAvgFloorShifts: assyBase.avgFloorShifts,
      cpuAvgActiveLineShifts,
      cpuIeCapacityShifts,
      rackAvgActiveLineShifts,
      rackIeCapacityShifts,
    },
  };
}

export function generateOverallApsPlan(
  sites: Record<string, SiteData>,
  planningYear: number,
  planningMonth: number
): MonthlyApsPlan {
  const { targetYear, targetMonth } = getNextMonthPeriod(planningYear, planningMonth);
  const isInternalSubPlant = (s: SiteData) =>
    s.id === 'tp08' ||
    s.id === 'tp15' ||
    s.id === 'tp16' ||
    s.code === 'TP08' ||
    s.code === 'TP15' ||
    s.code === 'TP16';

  const plantPlans = Object.values(sites)
    .filter((s) => s.id !== 'overall' && !isInternalSubPlant(s))
    .map((s) => ({
      site: s,
      plan: generateMonthlyApsPlan(s, planningYear, planningMonth),
    }));

  const smtOnlineDL = plantPlans.reduce((sum, p) => sum + p.plan.smtOnlineDL, 0);
  const pcaOnlineDL = plantPlans.reduce((sum, p) => sum + p.plan.pcaOnlineDL, 0);
  const assemblyOnlineDL = plantPlans.reduce((sum, p) => sum + p.plan.assemblyOnlineDL, 0);
  const totalOnlineDL = smtOnlineDL + pcaOnlineDL + assemblyOnlineDL;

  const smtOfflineDL = plantPlans.reduce((sum, p) => sum + (p.plan.smtOfflineDL || 0), 0);
  const pcaOfflineDL = plantPlans.reduce((sum, p) => sum + (p.plan.pcaOfflineDL || 0), 0);
  const assemblyOfflineDL = plantPlans.reduce((sum, p) => sum + (p.plan.assemblyOfflineDL || 0), 0);
  const totalOfflineDL = smtOfflineDL + pcaOfflineDL + assemblyOfflineDL;

  const qcDL = plantPlans.reduce((sum, p) => sum + (p.plan.qcDL || 0), 0);
  const tsDL = plantPlans.reduce((sum, p) => sum + (p.plan.tsDL || 0), 0);
  const whDL = plantPlans.reduce((sum, p) => sum + (p.plan.whDL || 0), 0);
  const otherSupportDL = plantPlans.reduce((sum, p) => sum + (p.plan.otherSupportDL || 0), 0);
  const totalSupportDL = qcDL + tsDL + whDL + otherSupportDL;

  const totalApsDemandDL = totalOnlineDL + totalOfflineDL + totalSupportDL;
  const mfgIDL = plantPlans.reduce((sum, p) => sum + p.plan.mfgIDL, 0);
  const supportIDL = plantPlans.reduce((sum, p) => sum + p.plan.supportIDL, 0);
  const fixedIDL = mfgIDL + supportIDL;
  const totalDemandHeadcount = totalApsDemandDL + fixedIDL;

  const lines: DailyLineSchedule[] = plantPlans.flatMap(({ site: s, plan }) =>
    plan.lines.map((l) => ({
      ...l,
      lineId: `${s.id}-${l.lineId}`,
      lineName: `[${s.code}] ${l.lineName}`,
    }))
  );

  const smtAvgActiveLineShifts = plantPlans.reduce((sum, p) => sum + (p.plan.scheduleStats?.smtAvgActiveLineShifts || 0), 0);
  const smtIeCapacityShifts = plantPlans.reduce((sum, p) => sum + (p.plan.scheduleStats?.smtIeCapacityShifts || 0), 0);
  const pcaAvgActiveLineShifts = plantPlans.reduce((sum, p) => sum + (p.plan.scheduleStats?.pcaAvgActiveLineShifts || 0), 0);
  const pcaIeCapacityShifts = plantPlans.reduce((sum, p) => sum + (p.plan.scheduleStats?.pcaIeCapacityShifts || 0), 0);
  const cpuAvgActiveLineShifts = plantPlans.reduce((sum, p) => sum + (p.plan.scheduleStats?.cpuAvgActiveLineShifts || 0), 0);
  const cpuIeCapacityShifts = plantPlans.reduce((sum, p) => sum + (p.plan.scheduleStats?.cpuIeCapacityShifts || 0), 0);
  const rackAvgActiveLineShifts = plantPlans.reduce((sum, p) => sum + (p.plan.scheduleStats?.rackAvgActiveLineShifts || 0), 0);
  const rackIeCapacityShifts = plantPlans.reduce((sum, p) => sum + (p.plan.scheduleStats?.rackIeCapacityShifts || 0), 0);

  const firstStats = plantPlans[0]?.plan.scheduleStats;

  return {
    planningYear,
    planningMonth,
    targetYear,
    targetMonth,
    cycleWeek: 'W3 Update (Published 3rd Week Monthly)',
    workingDays: firstStats?.assyActiveDays || 22,
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
    smtOfflineDL,
    pcaOfflineDL,
    assemblyOfflineDL,
    qcDL,
    tsDL,
    whDL,
    otherSupportDL,
    scheduleStats: {
      smtActiveDays: firstStats?.smtActiveDays || 22,
      smtAvgFloorShifts: firstStats?.smtAvgFloorShifts || 2,
      smtAvgActiveLineShifts,
      smtIeCapacityShifts,
      pcaAvgActiveLineShifts,
      pcaIeCapacityShifts,
      assyActiveDays: firstStats?.assyActiveDays || 22,
      assyAvgFloorShifts: firstStats?.assyAvgFloorShifts || 2,
      cpuAvgActiveLineShifts,
      cpuIeCapacityShifts,
      rackAvgActiveLineShifts,
      rackIeCapacityShifts,
    },
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
  const smtApsDL = apsPlan.smtOnlineDL + (apsPlan.smtOfflineDL ?? site.smtOfflineDL ?? 0);
  const rawSmtMonthEndDL = Math.round(smtApsDL * 1.02);

  // PCA Process Cost Centers
  const pcaCC = parseCostCenters(site.pcaCostCenter);
  const pcaApsDL = apsPlan.pcaOnlineDL + (apsPlan.pcaOfflineDL ?? site.pcaOfflineDL ?? 0);
  const rawPcaMonthEndDL = Math.round(pcaApsDL * 0.97);

  // System Assembly Process Cost Centers
  const sysCC = parseCostCenters(site.assemblyCostCenter);
  const sysApsDL = apsPlan.assemblyOnlineDL + (apsPlan.assemblyOfflineDL ?? site.assemblyOfflineDL ?? 0);
  const rawSysMonthEndDL = Math.round(sysApsDL * 0.98);

  // Quality Control
  const qcCC = parseCostCenters(site.qualityControl?.oqcCostCenter);
  const qcApsDL = apsPlan.qcDL ?? ((site.qualityControl?.pqcDL || 0) + (site.qualityControl?.oqcStandardDL || 0));
  const rawQcMonthEndDL = qcApsDL;

  // Trouble Shooting
  const tsCC = ['CC-TS-7301'];
  const tsApsDL = apsPlan.tsDL ?? (site.troubleShooting?.dlEntry || 0);
  const rawTsMonthEndDL = tsApsDL;

  // Warehouse Logistics
  const whCC = ['CC-WH-7401'];
  const whApsDL = apsPlan.whDL ?? (site.warehouse?.logisticsDL || 0);
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
  selectedMonth: number,
  allSites?: Record<string, SiteData>
) {
  const basePlan =
    site.id === 'overall' && allSites
      ? generateOverallApsPlan(allSites, selectedYear, selectedMonth)
      : generateMonthlyApsPlan(site, selectedYear, selectedMonth);
  const baseApsDL = basePlan.totalApsDemandDL;
  const baseHrDL = site.actualHrDL || baseApsDL;
  const baseApsIDL = basePlan.fixedIDL;
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
