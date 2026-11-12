import { SiteData, TimePeriod } from '../types';

export interface CalculatedMetrics {
  totalDL: number;
  totalIDL: number;
  totalOnlineDL: number;
  totalOfflineDL: number;
  idlRatio: string;
  ratioPercent: number;
  netGap: number;
  hasDeficit: boolean;
  // Manufacturing Segment
  manufacturingDlSum: number;
  manufacturingOnlineDlSum: number;
  manufacturingOfflineDlSum: number;
  smtDlSum: number;
  smtOnlineDlSum: number;
  smtOfflineDlSum: number;
  pcaDlSum: number;
  pcaOnlineDlSum: number;
  pcaOfflineDlSum: number;
  cpuAssyDlSum: number;
  cpuOnlineDlSum: number;
  cpuOfflineDlSum: number;
  // Other Support Segments
  qcDlSum: number;
  tsDlSum: number;
  whDlSum: number;
}

export function calculateSiteMetrics(site: SiteData, timePeriod: TimePeriod): CalculatedMetrics {
  const multiplier = timePeriod === 'QUARTERLY' ? 3 : 1;

  // SMT DL (Online = Std DL * Shift count; Offline is independent)
  const smtOnlineDlRaw = (site.smtLines || []).reduce((acc, l) => {
    const shiftCount = typeof l.shift === 'number' ? l.shift : (l.shift === 'Night' ? 2 : 1);
    return acc + (l.onlineStdDL || 0) * shiftCount;
  }, 0);
  const smtOfflineDlRaw = site.smtOfflineDL ?? (site.smtLines || []).reduce((acc, l) => acc + (l.offlineDL || 0), 0);
  const smtDlSumRaw = smtOnlineDlRaw + smtOfflineDlRaw;

  // PCA DL (Online = FA*FA_Shift + TEST*TEST_Shift + PACK*PACK_Shift; Offline is independent)
  const pcaOnlineDlRaw = (site.pcaLines || []).reduce((acc, l) => {
    const faShifts = typeof l.faShift === 'number' ? l.faShift : (typeof l.shift === 'number' ? l.shift : 1);
    const testShifts = typeof l.testShift === 'number' ? l.testShift : (typeof l.shift === 'number' ? l.shift : 1);
    const packShifts = typeof l.packingShift === 'number' ? l.packingShift : (typeof l.shift === 'number' ? l.shift : 1);
    const lineOnline =
      (l.faStdDL || 0) * faShifts +
      (l.testStdDL || 0) * testShifts +
      (l.packingStdDL || 0) * packShifts;
    return acc + lineOnline;
  }, 0);
  const pcaOfflineDlRaw = site.pcaOfflineDL ?? (site.pcaLines || []).reduce((acc, l) => acc + (l.offlineDL || 0), 0);
  const pcaDlSumRaw = pcaOnlineDlRaw + pcaOfflineDlRaw;

  // System Assembly DL: CPU組裝 + Rack組裝 (Online = ASSY*ASSY_Shift + TEST*TEST_Shift + PACK*PACK_Shift; Offline is independent)
  const cpuAssyOnlineDlRaw = (site.cpuAssemblyLines || []).reduce((acc, l) => {
    const assyShifts = typeof l.assyShift === 'number' ? l.assyShift : (typeof l.shift === 'number' ? l.shift : 1);
    const testShifts = typeof l.testShift === 'number' ? l.testShift : (typeof l.shift === 'number' ? l.shift : 1);
    const packShifts = typeof l.packShift === 'number' ? l.packShift : (typeof l.shift === 'number' ? l.shift : 1);
    const lineOnline =
      (l.assyDL || 0) * assyShifts +
      (l.testDL || 0) * testShifts +
      (l.packDL || 0) * packShifts;
    return acc + lineOnline;
  }, 0);

  const rackAssyOnlineDlRaw = (site.rackAssemblyLines || []).reduce((acc, l) => {
    const assyShifts = typeof l.assyShift === 'number' ? l.assyShift : (typeof l.shift === 'number' ? l.shift : 1);
    const testShifts = typeof l.testShift === 'number' ? l.testShift : (typeof l.shift === 'number' ? l.shift : 1);
    const packShifts = typeof l.packShift === 'number' ? l.packShift : (typeof l.shift === 'number' ? l.shift : 1);
    const lineOnline =
      (l.assyDL || 0) * assyShifts +
      (l.testDL || 0) * testShifts +
      (l.packDL || 0) * packShifts;
    return acc + lineOnline;
  }, 0);

  const totalAssyOnlineDlRaw = cpuAssyOnlineDlRaw + rackAssyOnlineDlRaw;
  const cpuOfflineDlRaw = site.assemblyOfflineDL ?? (site.cpuAssemblyLines || []).reduce((acc, l) => acc + (l.offlineDL || 0), 0);
  const cpuAssyDlSumRaw = totalAssyOnlineDlRaw + cpuOfflineDlRaw;

  // Manufacturing Segment Total
  const manufacturingOnlineDlRaw = smtOnlineDlRaw + pcaOnlineDlRaw + totalAssyOnlineDlRaw;
  const manufacturingOfflineDlRaw = smtOfflineDlRaw + pcaOfflineDlRaw + cpuOfflineDlRaw;
  const manufacturingDlSumRaw = smtDlSumRaw + pcaDlSumRaw + cpuAssyDlSumRaw;

  // Quality Control DL & IDL
  const pqcDlRaw = site.qualityControl?.pqcDL || 0;
  const pqcIdlRaw =
    site.qualityControl?.pqcIDL !== undefined
      ? site.qualityControl.pqcIDL
      : (site.qualityControl?.pqcDayShift || 0) + (site.qualityControl?.pqcNightShift || 0);
  const qcDlSumRaw = pqcDlRaw + (site.qualityControl?.oqcStandardDL || 0);
  const qcIdlSum = pqcIdlRaw + (site.qualityControl?.oqcIndirectIDL || 0);

  // Trouble Shooting
  const tsDlRaw = site.troubleShooting?.dlEntry || 0;
  const tsIdl = site.troubleShooting?.idlEntry || 0;

  // Warehouse
  const whDlRaw = site.warehouse?.logisticsDL || 0;
  const whIdl = site.warehouse?.adminIDL || 0;

  // Other Support
  const osDlRaw = site.otherSupport?.dl || 0;
  const osIdl = site.otherSupport?.generalIDL || 0;

  // Total DL Calculation
  const rawDL = manufacturingDlSumRaw + qcDlSumRaw + tsDlRaw + whDlRaw + osDlRaw;
  const totalDL = Math.round(rawDL * multiplier);

  // Total IDL Calculation
  const rawIDL =
    (site.smtIdl || 0) +
    (site.pcaIdl || 0) +
    (site.assemblyIdl || 0) +
    qcIdlSum +
    tsIdl +
    whIdl +
    osIdl;
  const totalIDL = Math.round(rawIDL * multiplier);

  // Ratio Calculation (e.g. 1 : 4.1 IDL to DL)
  const ratioVal = totalIDL > 0 ? (totalDL / totalIDL).toFixed(1) : '0.0';
  const idlRatio = `1:${ratioVal}`;

  // Percentage for progress bar
  const ratioPercent = Math.min(100, Math.max(10, Math.round((totalIDL / (totalDL + totalIDL || 1)) * 100)));

  // Net Capacity Gap (Target Capacity from HR or APS)
  const targetCapacity = Math.round((site.actualHrDL || 1228) * multiplier);
  const netGap = targetCapacity - totalDL;
  const hasDeficit = netGap < 0;

  const totalOnlineDL = Math.round(manufacturingOnlineDlRaw * multiplier);
  const totalOfflineDL = Math.round((manufacturingOfflineDlRaw + qcDlSumRaw + tsDlRaw + whDlRaw) * multiplier);

  return {
    totalDL,
    totalIDL,
    totalOnlineDL,
    totalOfflineDL,
    idlRatio,
    ratioPercent,
    netGap,
    hasDeficit,
    // Manufacturing
    manufacturingDlSum: manufacturingDlSumRaw * multiplier,
    manufacturingOnlineDlSum: manufacturingOnlineDlRaw * multiplier,
    manufacturingOfflineDlSum: manufacturingOfflineDlRaw * multiplier,
    smtDlSum: smtDlSumRaw * multiplier,
    smtOnlineDlSum: smtOnlineDlRaw * multiplier,
    smtOfflineDlSum: smtOfflineDlRaw * multiplier,
    pcaDlSum: pcaDlSumRaw * multiplier,
    pcaOnlineDlSum: pcaOnlineDlRaw * multiplier,
    pcaOfflineDlSum: pcaOfflineDlRaw * multiplier,
    cpuAssyDlSum: cpuAssyDlSumRaw * multiplier,
    cpuOnlineDlSum: cpuAssyOnlineDlRaw * multiplier,
    cpuOfflineDlSum: cpuOfflineDlRaw * multiplier,
    // Other
    qcDlSum: qcDlSumRaw * multiplier,
    tsDlSum: tsDlRaw * multiplier,
    whDlSum: whDlRaw * multiplier,
  };
}

export function calculateOverallSite(sites: Record<string, SiteData>): SiteData {
  const siteList = Object.values(sites).filter((s) => s.id !== 'overall');

  // Sum numeric fields
  const targetDemandDL = siteList.reduce((sum, s) => sum + (s.targetDemandDL || 0), 0);
  const actualHrDL = siteList.reduce((sum, s) => sum + (s.actualHrDL || 0), 0);
  const actualHrIDL = siteList.reduce((sum, s) => sum + (s.actualHrIDL || 0), 0);
  const yearlyBudgetManpower = siteList.reduce((sum, s) => sum + (s.yearlyBudgetManpower || 0), 0);
  const yearlyBudgetDL = siteList.reduce((sum, s) => sum + (s.yearlyBudgetDL || 0), 0);
  const yearlyBudgetIDL = siteList.reduce((sum, s) => sum + (s.yearlyBudgetIDL || 0), 0);

  const smtOfflineDL = siteList.reduce((sum, s) => sum + (s.smtOfflineDL || 0), 0);
  const pcaOfflineDL = siteList.reduce((sum, s) => sum + (s.pcaOfflineDL || 0), 0);
  const assemblyOfflineDL = siteList.reduce((sum, s) => sum + (s.assemblyOfflineDL || 0), 0);

  const smtIdl = siteList.reduce((sum, s) => sum + (s.smtIdl || 0), 0);
  const pcaIdl = siteList.reduce((sum, s) => sum + (s.pcaIdl || 0), 0);
  const assemblyIdl = siteList.reduce((sum, s) => sum + (s.assemblyIdl || 0), 0);

  // Concat all lines with site identifiers
  const smtLines = siteList.flatMap((s) =>
    (s.smtLines || []).map((line) => ({
      ...line,
      id: `${s.id}-${line.id}`,
      name: `[${s.code}] ${line.name}`,
    }))
  );

  const pcaLines = siteList.flatMap((s) =>
    (s.pcaLines || []).map((line) => ({
      ...line,
      id: `${s.id}-${line.id}`,
      name: `[${s.code}] ${line.name}`,
    }))
  );

  const cpuAssemblyLines = siteList.flatMap((s) =>
    (s.cpuAssemblyLines || []).map((line) => ({
      ...line,
      id: `${s.id}-${line.id}`,
      name: `[${s.code}] ${line.name}`,
    }))
  );

  const rackAssemblyLines = siteList.flatMap((s) =>
    (s.rackAssemblyLines || []).map((line) => ({
      ...line,
      id: `${s.id}-${line.id}`,
      name: `[${s.code}] ${line.name}`,
    }))
  );

  // Quality Control
  const pqcDL = siteList.reduce((sum, s) => sum + (s.qualityControl?.pqcDL || 0), 0);
  const pqcIDL = siteList.reduce(
    (sum, s) =>
      sum +
      (s.qualityControl?.pqcIDL !== undefined
        ? s.qualityControl.pqcIDL
        : (s.qualityControl?.pqcDayShift || 0) + (s.qualityControl?.pqcNightShift || 0)),
    0
  );
  const pqcDayShift = siteList.reduce((sum, s) => sum + (s.qualityControl?.pqcDayShift || 0), 0);
  const pqcNightShift = siteList.reduce((sum, s) => sum + (s.qualityControl?.pqcNightShift || 0), 0);
  const oqcStandardDL = siteList.reduce((sum, s) => sum + (s.qualityControl?.oqcStandardDL || 0), 0);
  const oqcIndirectIDL = siteList.reduce((sum, s) => sum + (s.qualityControl?.oqcIndirectIDL || 0), 0);

  // Trouble Shooting
  const tsDl = siteList.reduce((sum, s) => sum + (s.troubleShooting?.dlEntry || 0), 0);
  const tsIdl = siteList.reduce((sum, s) => sum + (s.troubleShooting?.idlEntry || 0), 0);

  // Warehouse
  const whDl = siteList.reduce((sum, s) => sum + (s.warehouse?.logisticsDL || 0), 0);
  const whIdl = siteList.reduce((sum, s) => sum + (s.warehouse?.adminIDL || 0), 0);

  // Other Support
  const osDl = siteList.reduce((sum, s) => sum + (s.otherSupport?.dl || 0), 0);
  const osIdl = siteList.reduce((sum, s) => sum + (s.otherSupport?.generalIDL || 0), 0);

  // Distinct Cost Centers
  const parseCC = (val?: string | string[]): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    return String(val).split(',').map((s) => s.trim()).filter(Boolean);
  };

  const smtCostCenter = Array.from(new Set(siteList.flatMap((s) => parseCC(s.smtCostCenter))));
  const pcaCostCenter = Array.from(new Set(siteList.flatMap((s) => parseCC(s.pcaCostCenter))));
  const assemblyCostCenter = Array.from(new Set(siteList.flatMap((s) => parseCC(s.assemblyCostCenter))));

  const monthlyBudgets: Record<number, { total: number; dl: number; idl: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const factor = [0, 0.94, 0.88, 0.96, 0.99, 1.01, 1.04, 1.06, 1.10, 1.07, 1.11, 1.06, 1.01][m] || 1.0;
    const mTotal = Math.round(yearlyBudgetManpower * factor);
    const dlRatio = yearlyBudgetManpower > 0 ? yearlyBudgetDL / yearlyBudgetManpower : 0.953;
    const mDL = Math.round(mTotal * dlRatio);
    monthlyBudgets[m] = {
      total: mTotal,
      dl: mDL,
      idl: mTotal - mDL,
    };
  }

  return {
    id: 'overall',
    name: 'Overall',
    code: 'ALL',
    targetDemandDL,
    actualHrDL,
    actualHrIDL,
    yearlyBudgetManpower,
    yearlyBudgetDL,
    yearlyBudgetIDL,
    monthlyBudgets,
    smtOfflineDL,
    pcaOfflineDL,
    assemblyOfflineDL,
    smtIdl,
    pcaIdl,
    assemblyIdl,
    smtCostCenter: smtCostCenter.length > 0 ? smtCostCenter : 'CC-ALL-SMT',
    pcaCostCenter: pcaCostCenter.length > 0 ? pcaCostCenter : 'CC-ALL-PCA',
    assemblyCostCenter: assemblyCostCenter.length > 0 ? assemblyCostCenter : 'CC-ALL-SYS',
    smtLines,
    pcaLines,
    cpuAssemblyLines,
    rackAssemblyLines,
    qualityControl: {
      pqcCostCenter: 'CC-ALL-QC',
      oqcCostCenter: 'CC-ALL-OQC',
      pqcDL,
      pqcIDL,
      pqcDayShift,
      pqcNightShift,
      oqcStandardDL,
      oqcIndirectIDL,
    },
    troubleShooting: {
      dlEntry: tsDl,
      idlEntry: tsIdl,
    },
    warehouse: {
      logisticsDL: whDl,
      adminIDL: whIdl,
    },
    otherSupport: {
      dl: osDl,
      generalIDL: osIdl,
      dlNA: '-',
    },
  };
}

