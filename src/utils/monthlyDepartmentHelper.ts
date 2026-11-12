import {
  SiteData,
  MonthDepartmentSnapshot,
  MonthDepartmentManpower,
  SmtLine,
  PcaLine,
  CpuAssemblyLine,
} from '../types';

export const MONTH_SEASONAL_FACTORS: Record<
  number,
  { name: string; dlFactor: number; idlFactor: number; note: string }
> = {
  1: { name: 'Jan', dlFactor: 0.95, idlFactor: 0.98, note: 'Pre-CNY inventory build' },
  2: { name: 'Feb', dlFactor: 0.88, idlFactor: 0.96, note: 'Lunar New Year fewer workdays' },
  3: { name: 'Mar', dlFactor: 0.98, idlFactor: 0.99, note: 'Post-holiday ramp-up' },
  4: { name: 'Apr', dlFactor: 1.0, idlFactor: 1.0, note: 'Q2 steady mass production' },
  5: { name: 'May', dlFactor: 1.02, idlFactor: 1.0, note: 'NPI new model introduction' },
  6: { name: 'Jun', dlFactor: 1.04, idlFactor: 1.01, note: 'Mid-year shipment push' },
  7: { name: 'Jul', dlFactor: 1.06, idlFactor: 1.02, note: 'Q3 peak season capacity release' },
  8: { name: 'Aug', dlFactor: 1.08, idlFactor: 1.03, note: 'Annual peak production' },
  9: { name: 'Sep', dlFactor: 1.0, idlFactor: 1.0, note: 'Baseline reference month' },
  10: { name: 'Oct', dlFactor: 1.03, idlFactor: 1.01, note: 'Q4 stable run rate' },
  11: { name: 'Nov', dlFactor: 1.01, idlFactor: 1.0, note: 'Year-end backlog preparation' },
  12: { name: 'Dec', dlFactor: 0.97, idlFactor: 0.99, note: 'Year-end inventory audit & balance' },
};

/**
 * Calculates DL & IDL for the 5 departments based on a detailed snapshot
 */
export function computeDepartmentTotalsFromSnapshot(snapshot: MonthDepartmentSnapshot): {
  mfgDL: number;
  mfgIDL: number;
  qcDL: number;
  qcIDL: number;
  tsDL: number;
  tsIDL: number;
  whDL: number;
  whIDL: number;
  otherDL: number;
  otherIDL: number;
  totalDL: number;
  totalIDL: number;
  totalHeadcount: number;
  dlRatio: string;
} {
  // 1. MANUFACTURING DL & IDL
  // SMT Online + Offline
  const smtOnlineDL = (snapshot.smtLines || []).reduce((acc, l) => {
    const shiftCount = typeof l.shift === 'number' ? l.shift : 1;
    return acc + (l.onlineStdDL || 0) * shiftCount;
  }, 0);
  const smtOfflineDL = snapshot.smtOfflineDL || 0;
  const smtTotalDL = smtOnlineDL + smtOfflineDL;

  // PCA Online + Offline
  const pcaOnlineDL = (snapshot.pcaLines || []).reduce((acc, l) => {
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
  const pcaOfflineDL = snapshot.pcaOfflineDL || 0;
  const pcaTotalDL = pcaOnlineDL + pcaOfflineDL;

  // Assembly Online (CPU組裝 + Rack組裝) + Offline
  const cpuAssyOnlineDL = (snapshot.cpuAssemblyLines || []).reduce((acc, l) => {
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
  const rackAssyOnlineDL = (snapshot.rackAssemblyLines || []).reduce((acc, l) => {
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
  const assyOfflineDL = snapshot.assemblyOfflineDL || 0;
  const assyTotalDL = assyOnlineDL + assyOfflineDL;

  const mfgDL = smtTotalDL + pcaTotalDL + assyTotalDL;
  const mfgIDL = (snapshot.smtIdl || 0) + (snapshot.pcaIdl || 0) + (snapshot.assemblyIdl || 0);

  // 2. QUALITY CONTROL DL & IDL
  let qcDL: number;
  let qcIDL: number;
  if (snapshot.qualityControl?.items && snapshot.qualityControl.items.length > 0) {
    qcDL = snapshot.qualityControl.items.reduce((acc, it) => acc + (Number(it.dl) || 0), 0);
    qcIDL = snapshot.qualityControl.items.reduce((acc, it) => acc + (Number(it.idl) || 0), 0);
  } else {
    const pqcDL = snapshot.qualityControl?.pqcDL || 0;
    const pqcIDL =
      snapshot.qualityControl?.pqcIDL !== undefined
        ? snapshot.qualityControl.pqcIDL
        : (snapshot.qualityControl?.pqcDayShift || 0) + (snapshot.qualityControl?.pqcNightShift || 0);
    qcDL = pqcDL + (snapshot.qualityControl?.oqcStandardDL || 0);
    qcIDL = pqcIDL + (snapshot.qualityControl?.oqcIndirectIDL || 0);
  }

  // 3. TROUBLE SHOOTING DL & IDL
  const tsDL = snapshot.troubleShooting?.dlEntry || 0;
  const tsIDL = snapshot.troubleShooting?.idlEntry || 0;

  // 4. WAREHOUSE DL & IDL
  const whDL = snapshot.warehouse?.logisticsDL || 0;
  const whIDL = snapshot.warehouse?.adminIDL || 0;

  // 5. OTHER SUPPORT DL & IDL
  const otherDL = snapshot.otherSupport?.dl || 0;
  const otherIDL = snapshot.otherSupport?.generalIDL || 0;

  // Grand Totals
  const totalDL = mfgDL + qcDL + tsDL + whDL + otherDL;
  const totalIDL = mfgIDL + qcIDL + tsIDL + whIDL + otherIDL;
  const totalHeadcount = totalDL + totalIDL;
  const ratioVal = totalIDL > 0 ? (totalDL / totalIDL).toFixed(1) : '0.0';
  const dlRatio = `${ratioVal} : 1`;

  return {
    mfgDL,
    mfgIDL,
    qcDL,
    qcIDL,
    tsDL,
    tsIDL,
    whDL,
    whIDL,
    otherDL,
    otherIDL,
    totalDL,
    totalIDL,
    totalHeadcount,
    dlRatio,
  };
}

/**
 * Creates a base snapshot clone from a site object
 */
export function extractSiteSnapshot(site: SiteData): MonthDepartmentSnapshot {
  return {
    smtOfflineDL: site.smtOfflineDL ?? 0,
    pcaOfflineDL: site.pcaOfflineDL ?? 0,
    assemblyOfflineDL: site.assemblyOfflineDL ?? 0,
    smtIdl: site.smtIdl ?? 0,
    pcaIdl: site.pcaIdl ?? 0,
    assemblyIdl: site.assemblyIdl ?? 0,
    smtLines: JSON.parse(JSON.stringify(site.smtLines || [])),
    pcaLines: JSON.parse(JSON.stringify(site.pcaLines || [])),
    cpuAssemblyLines: JSON.parse(JSON.stringify(site.cpuAssemblyLines || [])),
    rackAssemblyLines: JSON.parse(JSON.stringify(site.rackAssemblyLines || [])),
    qualityControl: {
      ...site.qualityControl,
      items: site.qualityControl?.items ? JSON.parse(JSON.stringify(site.qualityControl.items)) : undefined,
    },
    troubleShooting: { ...site.troubleShooting },
    warehouse: { ...site.warehouse },
    otherSupport: { ...site.otherSupport },
  };
}

/**
 * Scale a snapshot by seasonal factors
 */
function scaleSnapshot(base: MonthDepartmentSnapshot, factorDL: number, factorIDL: number): MonthDepartmentSnapshot {
  const scaledSmtLines: SmtLine[] = (base.smtLines || []).map((l) => ({
    ...l,
    onlineStdDL: Math.max(1, Math.round((l.onlineStdDL || 1) * factorDL)),
  }));

  const scaledPcaLines: PcaLine[] = (base.pcaLines || []).map((l) => ({
    ...l,
    faStdDL: Math.max(1, Math.round((l.faStdDL || 1) * factorDL)),
    testStdDL: Math.max(1, Math.round((l.testStdDL || 1) * factorDL)),
    packingStdDL: Math.max(1, Math.round((l.packingStdDL || 1) * factorDL)),
  }));

  const scaledCpuLines: CpuAssemblyLine[] = (base.cpuAssemblyLines || []).map((l) => ({
    ...l,
    assyDL: Math.max(1, Math.round((l.assyDL || 1) * factorDL)),
    testDL: Math.max(1, Math.round((l.testDL || 1) * factorDL)),
    packDL: Math.max(1, Math.round((l.packDL || 1) * factorDL)),
  }));

  const scaledRackLines: CpuAssemblyLine[] = (base.rackAssemblyLines || []).map((l) => ({
    ...l,
    assyDL: Math.max(1, Math.round((l.assyDL || 1) * factorDL)),
    testDL: Math.max(1, Math.round((l.testDL || 1) * factorDL)),
    packDL: Math.max(1, Math.round((l.packDL || 1) * factorDL)),
  }));

  return {
    smtOfflineDL: Math.round((base.smtOfflineDL || 0) * factorDL),
    pcaOfflineDL: Math.round((base.pcaOfflineDL || 0) * factorDL),
    assemblyOfflineDL: Math.round((base.assemblyOfflineDL || 0) * factorDL),
    smtIdl: Math.round((base.smtIdl || 0) * factorIDL),
    pcaIdl: Math.round((base.pcaIdl || 0) * factorIDL),
    assemblyIdl: Math.round((base.assemblyIdl || 0) * factorIDL),
    smtLines: scaledSmtLines,
    pcaLines: scaledPcaLines,
    cpuAssemblyLines: scaledCpuLines,
    rackAssemblyLines: scaledRackLines,
    qualityControl: {
      ...base.qualityControl,
      pqcDL: Math.round((base.qualityControl?.pqcDL || 0) * factorDL),
      pqcIDL: Math.round(
        (base.qualityControl?.pqcIDL !== undefined
          ? base.qualityControl.pqcIDL
          : (base.qualityControl?.pqcDayShift || 0) + (base.qualityControl?.pqcNightShift || 0)) * factorIDL
      ),
      oqcStandardDL: Math.round((base.qualityControl?.oqcStandardDL || 0) * factorDL),
      oqcIndirectIDL: Math.round((base.qualityControl?.oqcIndirectIDL || 0) * factorIDL),
      pqcDayShift: Math.round((base.qualityControl?.pqcDayShift || 0) * factorIDL),
      pqcNightShift: Math.round((base.qualityControl?.pqcNightShift || 0) * factorIDL),
      items: base.qualityControl?.items
        ? base.qualityControl.items.map((it) => ({
            ...it,
            dl: Math.max(0, Math.round((it.dl || 0) * factorDL)),
            idl: Math.max(0, Math.round((it.idl || 0) * factorIDL)),
          }))
        : undefined,
    },
    troubleShooting: {
      ...base.troubleShooting,
      dlEntry: Math.round((base.troubleShooting?.dlEntry || 0) * factorDL),
      idlEntry: Math.round((base.troubleShooting?.idlEntry || 0) * factorIDL),
      items: base.troubleShooting?.items
        ? base.troubleShooting.items.map((it) => ({
            ...it,
            dl: Math.max(0, Math.round((it.dl || 0) * factorDL)),
            idl: Math.max(0, Math.round((it.idl || 0) * factorIDL)),
          }))
        : undefined,
    },
    warehouse: {
      ...base.warehouse,
      logisticsDL: Math.round((base.warehouse?.logisticsDL || 0) * factorDL),
      adminIDL: Math.round((base.warehouse?.adminIDL || 0) * factorIDL),
      items: base.warehouse?.items
        ? base.warehouse.items.map((it) => ({
            ...it,
            dl: Math.max(0, Math.round((it.dl || 0) * factorDL)),
            idl: Math.max(0, Math.round((it.idl || 0) * factorIDL)),
          }))
        : undefined,
    },
    otherSupport: {
      ...base.otherSupport,
      dl: Math.round((base.otherSupport?.dl || 0) * factorDL),
      generalIDL: Math.round((base.otherSupport?.generalIDL || 0) * factorIDL),
      items: base.otherSupport?.items
        ? base.otherSupport.items.map((it) => ({
            ...it,
            dl: Math.max(0, Math.round((it.dl || 0) * factorDL)),
            idl: Math.max(0, Math.round((it.idl || 0) * factorIDL)),
          }))
        : undefined,
    },
  };
}

/**
 * Initializes or retrieves the complete 12 months department data dictionary for a site
 */
export function getOrInitSiteMonthlyData(site: SiteData): Record<number, MonthDepartmentManpower> {
  if (site.monthlyDepartmentData && Object.keys(site.monthlyDepartmentData).length >= 12) {
    return site.monthlyDepartmentData;
  }

  const baseSnapshot = extractSiteSnapshot(site);
  const result: Record<number, MonthDepartmentManpower> = {};

  for (let m = 1; m <= 12; m++) {
    if (site.monthlyDepartmentData && site.monthlyDepartmentData[m]) {
      result[m] = site.monthlyDepartmentData[m];
      continue;
    }

    const cfg = MONTH_SEASONAL_FACTORS[m] || {
      name: `M${m}`,
      dlFactor: 1.0,
      idlFactor: 1.0,
      note: 'Regular Monthly Plan',
    };

    const monthSnapshot =
      m === 9 ? JSON.parse(JSON.stringify(baseSnapshot)) : scaleSnapshot(baseSnapshot, cfg.dlFactor, cfg.idlFactor);

    const totals = computeDepartmentTotalsFromSnapshot(monthSnapshot);

    result[m] = {
      month: m,
      monthName: cfg.name,
      ...totals,
      snapshot: monthSnapshot,
      note: cfg.note,
      isModified: false,
    };
  }

  return result;
}

/**
 * Returns a new site object with the selected month's snapshot applied to top-level fields
 */
export function applyMonthSnapshotToSite(site: SiteData, month: number): SiteData {
  const monthlyData = getOrInitSiteMonthlyData(site);
  const monthEntry = monthlyData[month];
  if (!monthEntry || !monthEntry.snapshot) {
    return site;
  }

  const s = monthEntry.snapshot;
  return {
    ...site,
    monthlyDepartmentData: monthlyData,
    smtOfflineDL: s.smtOfflineDL,
    pcaOfflineDL: s.pcaOfflineDL,
    assemblyOfflineDL: s.assemblyOfflineDL,
    smtIdl: s.smtIdl,
    pcaIdl: s.pcaIdl,
    assemblyIdl: s.assemblyIdl,
    smtLines: JSON.parse(JSON.stringify(s.smtLines || [])),
    pcaLines: JSON.parse(JSON.stringify(s.pcaLines || [])),
    cpuAssemblyLines: JSON.parse(JSON.stringify(s.cpuAssemblyLines || [])),
    rackAssemblyLines: JSON.parse(JSON.stringify(s.rackAssemblyLines || [])),
    qualityControl: {
      ...s.qualityControl,
      items: s.qualityControl?.items ? JSON.parse(JSON.stringify(s.qualityControl.items)) : undefined,
    },
    troubleShooting: { ...s.troubleShooting },
    warehouse: { ...s.warehouse },
    otherSupport: { ...s.otherSupport },
  };
}

/**
 * Updates a specific month's data in the site, recalculating totals and synchronizing top-level fields if it is the current month
 */
export function updateSiteMonthData(
  site: SiteData,
  month: number,
  updatedSnapshot: MonthDepartmentSnapshot,
  currentSelectedMonth: number,
  note?: string
): SiteData {
  const monthlyData = { ...getOrInitSiteMonthlyData(site) };
  const totals = computeDepartmentTotalsFromSnapshot(updatedSnapshot);

  monthlyData[month] = {
    month,
    monthName: MONTH_SEASONAL_FACTORS[month]?.name || `M${month}`,
    ...totals,
    snapshot: updatedSnapshot,
    note: note ?? monthlyData[month]?.note ?? 'IE Monthly Maintenance Adjust',
    isModified: true,
  };

  let updatedSite: SiteData = {
    ...site,
    monthlyDepartmentData: monthlyData,
  };

  // If the edited month is the currently viewed month, also update top-level site fields
  if (month === currentSelectedMonth) {
    updatedSite = {
      ...updatedSite,
      smtOfflineDL: updatedSnapshot.smtOfflineDL,
      pcaOfflineDL: updatedSnapshot.pcaOfflineDL,
      assemblyOfflineDL: updatedSnapshot.assemblyOfflineDL,
      smtIdl: updatedSnapshot.smtIdl,
      pcaIdl: updatedSnapshot.pcaIdl,
      assemblyIdl: updatedSnapshot.assemblyIdl,
      smtLines: JSON.parse(JSON.stringify(updatedSnapshot.smtLines || [])),
      pcaLines: JSON.parse(JSON.stringify(updatedSnapshot.pcaLines || [])),
      cpuAssemblyLines: JSON.parse(JSON.stringify(updatedSnapshot.cpuAssemblyLines || [])),
      rackAssemblyLines: JSON.parse(JSON.stringify(updatedSnapshot.rackAssemblyLines || [])),
      qualityControl: {
        ...updatedSnapshot.qualityControl,
        items: updatedSnapshot.qualityControl?.items ? JSON.parse(JSON.stringify(updatedSnapshot.qualityControl.items)) : undefined,
      },
      troubleShooting: { ...updatedSnapshot.troubleShooting },
      warehouse: { ...updatedSnapshot.warehouse },
      otherSupport: { ...updatedSnapshot.otherSupport },
    };
  }

  return updatedSite;
}

/**
 * Fast direct adjustment of the 5 departments' DL and IDL numbers for a specific month
 */
export function directUpdateDepartmentManpower(
  site: SiteData,
  month: number,
  dept: 'mfg' | 'qc' | 'ts' | 'wh' | 'other',
  field: 'dl' | 'idl',
  value: number,
  currentSelectedMonth: number
): SiteData {
  const monthlyData = getOrInitSiteMonthlyData(site);
  const currentMonthData = monthlyData[month];
  if (!currentMonthData) return site;

  const snapshot = JSON.parse(JSON.stringify(currentMonthData.snapshot)) as MonthDepartmentSnapshot;
  const num = Math.max(0, Math.round(value));

  switch (dept) {
    case 'mfg':
      if (field === 'dl') {
        // Adjust offline DL to match difference
        const currentTotals = computeDepartmentTotalsFromSnapshot(snapshot);
        const diff = num - currentTotals.mfgDL;
        snapshot.assemblyOfflineDL = Math.max(0, (snapshot.assemblyOfflineDL || 0) + diff);
      } else {
        snapshot.assemblyIdl = num;
      }
      break;
    case 'qc':
      if (field === 'dl') {
        snapshot.qualityControl.oqcStandardDL = num;
        if (snapshot.qualityControl.items && snapshot.qualityControl.items.length > 0) {
          const currentTotal = snapshot.qualityControl.items.reduce((s, it) => s + (Number(it.dl) || 0), 0);
          const diff = num - currentTotal;
          snapshot.qualityControl.items[0].dl = Math.max(0, (Number(snapshot.qualityControl.items[0].dl) || 0) + diff);
        }
      } else {
        snapshot.qualityControl.oqcIndirectIDL = num;
        if (snapshot.qualityControl.items && snapshot.qualityControl.items.length > 0) {
          const currentTotal = snapshot.qualityControl.items.reduce((s, it) => s + (Number(it.idl) || 0), 0);
          const diff = num - currentTotal;
          snapshot.qualityControl.items[0].idl = Math.max(0, (Number(snapshot.qualityControl.items[0].idl) || 0) + diff);
        }
      }
      break;
    case 'ts':
      if (field === 'dl') {
        snapshot.troubleShooting.dlEntry = num;
      } else {
        snapshot.troubleShooting.idlEntry = num;
      }
      break;
    case 'wh':
      if (field === 'dl') {
        snapshot.warehouse.logisticsDL = num;
      } else {
        snapshot.warehouse.adminIDL = num;
      }
      break;
    case 'other':
      if (field === 'dl') {
        snapshot.otherSupport.dl = num;
      } else if (field === 'idl') {
        snapshot.otherSupport.generalIDL = num;
      }
      break;
  }

  return updateSiteMonthData(site, month, snapshot, currentSelectedMonth);
}

/**
 * Copies configuration from sourceMonth to targetMonth
 */
export function copyMonthData(
  site: SiteData,
  sourceMonth: number,
  targetMonth: number,
  currentSelectedMonth: number
): SiteData {
  const monthlyData = getOrInitSiteMonthlyData(site);
  const src = monthlyData[sourceMonth];
  if (!src) return site;

  const copiedSnapshot = JSON.parse(JSON.stringify(src.snapshot));
  return updateSiteMonthData(
    site,
    targetMonth,
    copiedSnapshot,
    currentSelectedMonth,
    `Copied and overwritten from Month ${sourceMonth}`
  );
}

/**
 * Synchronizes current month data across all 12 months
 */
export function syncCurrentMonthToAll(
  site: SiteData,
  sourceMonth: number,
  currentSelectedMonth: number
): SiteData {
  let updatedSite = site;
  const monthlyData = getOrInitSiteMonthlyData(site);
  const src = monthlyData[sourceMonth];
  if (!src) return site;

  for (let m = 1; m <= 12; m++) {
    if (m === sourceMonth) continue;
    const copiedSnapshot = JSON.parse(JSON.stringify(src.snapshot));
    updatedSite = updateSiteMonthData(
      updatedSite,
      m,
      copiedSnapshot,
      currentSelectedMonth,
      `Synchronized from Month ${sourceMonth} baseline across all months`
    );
  }

  return updatedSite;
}
