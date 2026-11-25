import { SiteData, MonthlyApsPlan, CostCenterPayrollWeekly } from '../types';

export type HrProcessType =
  | 'SMT'
  | 'PCA'
  | 'System Assembly'
  | 'Quality'
  | 'Troubleshooting'
  | 'Warehouse'
  | 'Other Support';

export interface HrDepartmentCatalogEntry {
  deptCode: string;
  label: string;
  department: string;
  processType: HrProcessType;
  /** Weight relative to the department's 1.00 baseline */
  weight: number;
  /** Whether included in default plant Department Code assignment */
  isDefault?: boolean;
  attendanceRate: string;
}

export interface HrDatabaseRecord {
  deptCode: string;
  label: string;
  department: string;
  processType: HrProcessType;
  plantId: string;
  plantName: string;
  month: number;
  budgetDL: number;
  budgetIDL: number;
  budgetTotal: number;
  w1DL: number;
  w2DL: number;
  w3DL: number;
  w4DL: number;
  monthEndDL: number;
  monthEndIDL: number;
  monthEndTotal: number;
  attendanceRate: string;
  source: 'HR_DB_MASTER' | 'HR_DB_CUSTOM_MATCH';
}

export interface HrDatabaseQueryTotals {
  budgetDL: number;
  budgetIDL: number;
  budgetTotal: number;
  w1DL: number;
  w2DL: number;
  w3DL: number;
  w4DL: number;
  monthEndDL: number;
  monthEndIDL: number;
  monthEndTotal: number;
  apsDemandDL: number;
  varianceDL: number;
  activeDeptCodes: string[];
}

export interface HrDatabaseQueryResult {
  departmentRows: CostCenterPayrollWeekly[];
  matchedRecords: HrDatabaseRecord[];
  catalogRecords: HrDatabaseRecord[];
  totals: HrDatabaseQueryTotals;
}

// Monthly Budget Seasonality Factors reflecting manufacturing capacity ramp, working days, and HR budgeting targets
export const MONTHLY_BUDGET_FACTORS: Record<number, number> = {
  1: 0.94,
  2: 0.88,
  3: 0.96,
  4: 0.99,
  5: 1.01,
  6: 1.04,
  7: 1.06,
  8: 1.10,
  9: 1.07,
  10: 1.11,
  11: 1.06,
  12: 1.01,
};

export const HR_DEPARTMENT_CATALOG: HrDepartmentCatalogEntry[] = [
  // SMT
  { deptCode: 'DEPT-SMT-7101', label: 'SMT MB Line Group A', department: 'SMT', processType: 'SMT', weight: 0.92, attendanceRate: '98.4%' },
  { deptCode: 'DEPT-SMT-7102', label: 'SMT MB Line Group B', department: 'SMT', processType: 'SMT', weight: 1.00, isDefault: true, attendanceRate: '98.6%' },
  { deptCode: 'DEPT-SMT-7105', label: 'SMT Small-card Cell', department: 'SMT', processType: 'SMT', weight: 0.42, attendanceRate: '97.9%' },
  { deptCode: 'DEPT-SMT-7109', label: 'SMT Prototype & NPI', department: 'SMT', processType: 'SMT', weight: 0.25, attendanceRate: '99.1%' },

  // PCA
  { deptCode: 'DEPT-PCA-7101', label: 'PCA FA Test Cell A', department: 'PCA', processType: 'PCA', weight: 0.85, attendanceRate: '96.5%' },
  { deptCode: 'DEPT-PCA-7105', label: 'PCA Board Functional Test', department: 'PCA', processType: 'PCA', weight: 1.00, isDefault: true, attendanceRate: '96.8%' },
  { deptCode: 'DEPT-PCA-7108', label: 'PCA Small-Card Packing', department: 'PCA', processType: 'PCA', weight: 0.48, attendanceRate: '97.3%' },
  { deptCode: 'DEPT-PCA-7112', label: 'PCA ICT & Burn-in Cell', department: 'PCA', processType: 'PCA', weight: 0.55, attendanceRate: '97.0%' },

  // System Assembly
  { deptCode: 'DEPT-SYS-7110', label: 'System Assembly Main Line', department: 'System Assembly', processType: 'System Assembly', weight: 1.00, isDefault: true, attendanceRate: '97.2%' },
  { deptCode: 'DEPT-SYS-7115', label: 'Server Integration & Test', department: 'System Assembly', processType: 'System Assembly', weight: 0.65, attendanceRate: '97.6%' },
  { deptCode: 'DEPT-SYS-7120', label: 'Chassis Final Packaging', department: 'System Assembly', processType: 'System Assembly', weight: 0.38, attendanceRate: '98.1%' },
  { deptCode: 'DEPT-SYS-7125', label: 'Rack & Stack Custom Config', department: 'System Assembly', processType: 'System Assembly', weight: 0.52, attendanceRate: '96.9%' },

  // Quality Control
  { deptCode: 'DEPT-QC-7201', label: 'PQC Line Audit Team', department: 'Quality Control', processType: 'Quality', weight: 0.50, isDefault: true, attendanceRate: '99.1%' },
  { deptCode: 'DEPT-QC-7202', label: 'SQC Sampling & Reliability', department: 'Quality Control', processType: 'Quality', weight: 0.35, attendanceRate: '99.3%' },
  { deptCode: 'DEPT-QC-7205', label: 'In-Process Quality Inspection', department: 'Quality Control', processType: 'Quality', weight: 0.45, attendanceRate: '98.8%' },
  { deptCode: 'DEPT-QC-7210', label: 'OQC Outgoing Inspection', department: 'Quality Control', processType: 'Quality', weight: 0.50, isDefault: true, attendanceRate: '99.0%' },
  { deptCode: 'DEPT-QC-7215', label: 'Finished Goods QA & Audit', department: 'Quality Control', processType: 'Quality', weight: 0.40, attendanceRate: '98.9%' },
  { deptCode: 'DEPT-QC-7220', label: 'Customer Quality Assurance (CQA)', department: 'Quality Control', processType: 'Quality', weight: 0.30, attendanceRate: '99.4%' },
  { deptCode: 'DEPT-QC-7225', label: 'IQC Incoming Inspection & Lab', department: 'Quality Control', processType: 'Quality', weight: 0.38, attendanceRate: '98.7%' },

  // Trouble Shooting
  { deptCode: 'DEPT-TS-7301', label: 'Trouble Shooting Debug Lab', department: 'Troubleshooting', processType: 'Troubleshooting', weight: 1.00, isDefault: true, attendanceRate: '97.5%' },
  { deptCode: 'DEPT-TS-7302', label: 'BGA & Board Repair Cell', department: 'Troubleshooting', processType: 'Troubleshooting', weight: 0.60, attendanceRate: '97.2%' },
  { deptCode: 'DEPT-TS-7305', label: 'Failure Analysis (FA) & RMA', department: 'Troubleshooting', processType: 'Troubleshooting', weight: 0.50, attendanceRate: '98.0%' },
  { deptCode: 'DEPT-TS-7308', label: 'Test Diagnostic & Fixture Lab', department: 'Troubleshooting', processType: 'Troubleshooting', weight: 0.40, attendanceRate: '98.3%' },

  // Warehouse
  { deptCode: 'DEPT-WH-7401', label: 'Raw Materials & Receiving Hub', department: 'Warehouse Logistics', processType: 'Warehouse', weight: 1.00, isDefault: true, attendanceRate: '98.0%' },
  { deptCode: 'DEPT-WH-7402', label: 'WIP Inventory & Internal Logistics', department: 'Warehouse Logistics', processType: 'Warehouse', weight: 0.65, attendanceRate: '97.8%' },
  { deptCode: 'DEPT-WH-7405', label: 'Finished Goods & Shipping Center', department: 'Warehouse Logistics', processType: 'Warehouse', weight: 0.70, attendanceRate: '98.4%' },
  { deptCode: 'DEPT-WH-7408', label: 'Customs & Bonded Warehouse', department: 'Warehouse Logistics', processType: 'Warehouse', weight: 0.35, attendanceRate: '98.9%' },

  // Other Support
  { deptCode: 'DEPT-OTH-7501', label: 'Plant Facility & Cleanroom Ops', department: 'Other Support', processType: 'Other Support', weight: 1.00, isDefault: true, attendanceRate: '99.0%' },
  { deptCode: 'DEPT-OTH-7502', label: 'EHS & Industrial Safety Dept', department: 'Other Support', processType: 'Other Support', weight: 0.45, attendanceRate: '99.5%' },
  { deptCode: 'DEPT-OTH-7505', label: 'General Administration & Affairs', department: 'Other Support', processType: 'Other Support', weight: 0.60, attendanceRate: '99.2%' },
  { deptCode: 'DEPT-OTH-7508', label: 'Plant Security & Facilities', department: 'Other Support', processType: 'Other Support', weight: 0.50, attendanceRate: '99.4%' },
];

export const DEFAULT_DEPT_CODES_BY_PROCESS: Record<HrProcessType, string[]> = {
  SMT: ['DEPT-SMT-7102'],
  PCA: ['DEPT-PCA-7105'],
  'System Assembly': ['DEPT-SYS-7110'],
  Quality: ['DEPT-QC-7201', 'DEPT-QC-7210'],
  Troubleshooting: ['DEPT-TS-7301'],
  Warehouse: ['DEPT-WH-7401'],
  'Other Support': ['DEPT-OTH-7501'],
};

export function getHrPresetsForProcess(processType: HrProcessType): Array<{ code: string; label: string }> {
  return HR_DEPARTMENT_CATALOG
    .filter((item) => item.processType === processType)
    .map((item) => ({ code: item.deptCode, label: item.label }));
}

export function normalizeDepartmentCode(code: string): string {
  const trimmed = code.trim().toUpperCase();
  if (/^CC-(SMT|PCA|SYS|QC|TS|WH|OTH)-/.test(trimmed)) {
    return trimmed.replace(/^CC-/, 'DEPT-');
  }
  return trimmed;
}

export function parseDepartmentCodes(val?: string | string[]): string[] {
  if (!val) return [];
  const raw = Array.isArray(val) ? val : String(val).split(',');
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const trimmed = String(item || '').trim();
    if (!trimmed) continue;
    const norm = normalizeDepartmentCode(trimmed);
    if (!seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}

export function getSiteDepartmentCodes(site: SiteData, processType: HrProcessType): string[] {
  switch (processType) {
    case 'SMT':
      return site.smtCostCenter !== undefined
        ? parseDepartmentCodes(site.smtCostCenter)
        : DEFAULT_DEPT_CODES_BY_PROCESS.SMT;
    case 'PCA':
      return site.pcaCostCenter !== undefined
        ? parseDepartmentCodes(site.pcaCostCenter)
        : DEFAULT_DEPT_CODES_BY_PROCESS.PCA;
    case 'System Assembly':
      return site.assemblyCostCenter !== undefined
        ? parseDepartmentCodes(site.assemblyCostCenter)
        : DEFAULT_DEPT_CODES_BY_PROCESS['System Assembly'];
    case 'Quality': {
      if (site.qualityControl?.costCenter !== undefined) {
        return parseDepartmentCodes(site.qualityControl.costCenter);
      }
      const combined = [
        ...parseDepartmentCodes(site.qualityControl?.pqcCostCenter),
        ...parseDepartmentCodes(site.qualityControl?.oqcCostCenter),
      ];
      return combined.length > 0
        ? Array.from(new Set(combined))
        : DEFAULT_DEPT_CODES_BY_PROCESS.Quality;
    }
    case 'Troubleshooting':
      return site.troubleShooting?.costCenter !== undefined
        ? parseDepartmentCodes(site.troubleShooting.costCenter)
        : DEFAULT_DEPT_CODES_BY_PROCESS.Troubleshooting;
    case 'Warehouse':
      return site.warehouse?.costCenter !== undefined
        ? parseDepartmentCodes(site.warehouse.costCenter)
        : DEFAULT_DEPT_CODES_BY_PROCESS.Warehouse;
    case 'Other Support':
      return site.otherSupport?.costCenter !== undefined
        ? parseDepartmentCodes(site.otherSupport.costCenter)
        : DEFAULT_DEPT_CODES_BY_PROCESS['Other Support'];
  }
}

export function getBaseMonthlyBudgetManpower(
  site: SiteData,
  month: number
): {
  total: number;
  dl: number;
  idl: number;
  annualAverage: number;
  factor: number;
} {
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
  const annualBaseIDL =
    site.yearlyBudgetIDL !== undefined
      ? site.yearlyBudgetIDL
      : Math.max(0, annualBaseTotal - annualBaseDL);

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

export function computePlantGapActionPlan(
  site: SiteData,
  process: HrProcessType,
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

    if (process === 'Warehouse' || process === 'Other Support') {
      const g1 = Math.round(varianceDL * 0.7);
      const g2 = varianceDL - g1;
      return g2 !== 0
        ? `${prefix}TP15 (${sign}${g1} DL), TP08 (${sign}${g2} DL)`
        : `${prefix}TP15 (${sign}${g1} DL)`;
    }
  }

  if (site.id === 'overall') {
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

  return `${prefix}${site.name} (${sign}${varianceDL} DL)`;
}

function hashCustomCodeWeight(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) % 1000;
  }
  return 0.25 + (hash % 35) / 100; // deterministic 0.25 .. 0.59
}

function splitExactIntegers(total: number, weights: number[]): number[] {
  const sumW = weights.reduce((s, w) => s + w, 0) || 1;
  const raw = weights.map((w) => (total * w) / sumW);
  const floored = raw.map((v) => Math.floor(v));
  let remainder = total - floored.reduce((s, v) => s + v, 0);
  const indicesByFraction = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < indicesByFraction.length && remainder > 0; k++) {
    floored[indicesByFraction[k].i] += 1;
    remainder--;
  }
  return floored;
}

function resolveDeptBaseSplit(site: SiteData, apsPlan: MonthlyApsPlan, month: number) {
  const baseBudget = getBaseMonthlyBudgetManpower(site, month);

  const smtApsDL = apsPlan.smtOnlineDL + (apsPlan.smtOfflineDL ?? site.smtOfflineDL ?? 0);
  const pcaApsDL = apsPlan.pcaOnlineDL + (apsPlan.pcaOfflineDL ?? site.pcaOfflineDL ?? 0);
  const sysApsDL = apsPlan.assemblyOnlineDL + (apsPlan.assemblyOfflineDL ?? site.assemblyOfflineDL ?? 0);
  const qcApsDL = apsPlan.qcDL ?? ((site.qualityControl?.pqcDL || 0) + (site.qualityControl?.oqcStandardDL || 0));
  const tsApsDL = apsPlan.tsDL ?? (site.troubleShooting?.dlEntry || 0);
  const whApsDL = apsPlan.whDL ?? (site.warehouse?.logisticsDL || 0);
  const osApsDL = apsPlan.otherSupportDL ?? (site.otherSupport?.dl || 0);

  const qcItems = site.qualityControl?.items;
  const qcIDL =
    qcItems && qcItems.length > 0
      ? qcItems.reduce((s, it) => s + (Number(it.idl) || 0), 0)
      : (site.qualityControl?.pqcIDL !== undefined
          ? site.qualityControl.pqcIDL
          : (site.qualityControl?.pqcDayShift || 0) + (site.qualityControl?.pqcNightShift || 0)) +
        (site.qualityControl?.oqcIndirectIDL || 0);

  const tsItems = site.troubleShooting?.items;
  const tsIDL =
    tsItems && tsItems.length > 0
      ? tsItems.reduce((s, it) => s + (Number(it.idl) || 0), 0)
      : site.troubleShooting?.idlEntry || 0;

  const whItems = site.warehouse?.items;
  const whIDL =
    whItems && whItems.length > 0
      ? whItems.reduce((s, it) => s + (Number(it.idl) || 0), 0)
      : site.warehouse?.adminIDL || 0;

  const osItems = site.otherSupport?.items;
  const osIDL =
    osItems && osItems.length > 0
      ? osItems.reduce((s, it) => s + (Number(it.idl) || 0), 0)
      : site.otherSupport?.generalIDL || 0;

  const smtIDL = site.smtIdl || 0;
  const pcaIDL = site.pcaIdl || 0;
  const sysIDL = site.assemblyIdl || 0;

  const processes: HrProcessType[] = [
    'SMT',
    'PCA',
    'System Assembly',
    'Quality',
    'Troubleshooting',
    'Warehouse',
    'Other Support',
  ];

  const apsDLMap: Record<HrProcessType, number> = {
    SMT: smtApsDL,
    PCA: pcaApsDL,
    'System Assembly': sysApsDL,
    Quality: qcApsDL,
    Troubleshooting: tsApsDL,
    Warehouse: whApsDL,
    'Other Support': osApsDL,
  };

  const ieIDLMap: Record<HrProcessType, number> = {
    SMT: smtIDL,
    PCA: pcaIDL,
    'System Assembly': sysIDL,
    Quality: qcIDL,
    Troubleshooting: tsIDL,
    Warehouse: whIDL,
    'Other Support': osIDL,
  };

  // Exact integer allocation of base Monthly Budget DL & IDL across departments
  const budgetDLList = splitExactIntegers(
    baseBudget.dl,
    processes.map((p) => apsDLMap[p])
  );
  const budgetIDLList = splitExactIntegers(
    baseBudget.idl,
    processes.map((p) => ieIDLMap[p])
  );

  // Paid DL baseline normalized to site.actualHrDL
  const rawPaidWeights = [
    Math.round(smtApsDL * 1.02),
    Math.round(pcaApsDL * 0.97),
    Math.round(sysApsDL * 0.98),
    qcApsDL,
    tsApsDL,
    whApsDL > 0 ? Math.max(0, whApsDL + 1) : 0,
    osApsDL,
  ];
  const targetPaidDL = site.actualHrDL && site.actualHrDL > 0
    ? site.actualHrDL
    : rawPaidWeights.reduce((s, v) => s + v, 0);
  const paidDLList = splitExactIntegers(targetPaidDL, rawPaidWeights);

  // Paid IDL baseline normalized to site.actualHrIDL (or fixedIDL)
  const rawIdlSum = processes.reduce((s, p) => s + ieIDLMap[p], 0);
  const targetPaidIDL =
    site.actualHrIDL !== undefined ? site.actualHrIDL : rawIdlSum;
  const paidIDLList = splitExactIntegers(
    targetPaidIDL,
    processes.map((p) => ieIDLMap[p])
  );

  const byProcess: Record<
    HrProcessType,
    {
      apsDL: number;
      budgetDL: number;
      budgetIDL: number;
      paidDL: number;
      paidIDL: number;
    }
  > = {} as any;

  processes.forEach((p, idx) => {
    byProcess[p] = {
      apsDL: apsDLMap[p],
      budgetDL: budgetDLList[idx],
      budgetIDL: budgetIDLList[idx],
      paidDL: paidDLList[idx],
      paidIDL: paidIDLList[idx],
    };
  });

  return { processes, byProcess };
}

function buildWeeklyRamp(monthEndDL: number, processType: HrProcessType): [number, number, number, number] {
  if (monthEndDL <= 0) return [0, 0, 0, 0];
  if (processType === 'SMT') {
    const d1 = Math.min(monthEndDL, Math.max(1, Math.round(monthEndDL * 0.025)));
    const d2 = Math.max(0, Math.round(d1 * 0.5));
    return [Math.max(0, monthEndDL - d1), Math.max(0, monthEndDL - d2), monthEndDL, monthEndDL + 1];
  }
  if (processType === 'PCA') {
    const d1 = Math.min(monthEndDL, Math.max(1, Math.round(monthEndDL * 0.02)));
    const d2 = Math.max(0, Math.round(d1 * 0.4));
    return [Math.max(0, monthEndDL - d1), Math.max(0, monthEndDL - d2), monthEndDL, monthEndDL];
  }
  if (processType === 'System Assembly') {
    const d1 = Math.min(monthEndDL, Math.max(1, Math.round(monthEndDL * 0.02)));
    const d2 = Math.max(0, Math.round(d1 * 0.5));
    return [Math.max(0, monthEndDL - d1), Math.max(0, monthEndDL - d2), Math.max(0, monthEndDL - 1), monthEndDL];
  }
  return [monthEndDL, monthEndDL, monthEndDL, monthEndDL];
}

function buildSiteCatalogRecords(
  site: SiteData,
  apsPlan: MonthlyApsPlan,
  month: number
): {
  catalogRecords: HrDatabaseRecord[];
  byCodeMap: Map<string, HrDatabaseRecord>;
  baseByProcess: ReturnType<typeof resolveDeptBaseSplit>['byProcess'];
} {
  const { processes, byProcess } = resolveDeptBaseSplit(site, apsPlan, month);
  const catalogRecords: HrDatabaseRecord[] = [];
  const byCodeMap = new Map<string, HrDatabaseRecord>();

  for (const processType of processes) {
    const base = byProcess[processType];
    const entries = HR_DEPARTMENT_CATALOG.filter((e) => e.processType === processType);
    const defaultEntries = entries.filter((e) => e.isDefault);
    const defaultWeights = defaultEntries.map((e) => e.weight);

    // Split exact integer baseline across default codes for this department
    const defaultBudgetDL = splitExactIntegers(base.budgetDL, defaultWeights);
    const defaultBudgetIDL = splitExactIntegers(base.budgetIDL, defaultWeights);
    const defaultPaidDL = splitExactIntegers(base.paidDL, defaultWeights);
    const defaultPaidIDL = splitExactIntegers(base.paidIDL, defaultWeights);

    let defaultIdx = 0;
    for (const entry of entries) {
      let budgetDL: number;
      let budgetIDL: number;
      let monthEndDL: number;
      let monthEndIDL: number;

      if (entry.isDefault) {
        budgetDL = defaultBudgetDL[defaultIdx];
        budgetIDL = defaultBudgetIDL[defaultIdx];
        monthEndDL = defaultPaidDL[defaultIdx];
        monthEndIDL = defaultPaidIDL[defaultIdx];
        defaultIdx++;
      } else {
        budgetDL = Math.round(base.budgetDL * entry.weight);
        budgetIDL = Math.round(base.budgetIDL * entry.weight);
        monthEndDL = Math.round(base.paidDL * entry.weight);
        monthEndIDL = Math.round(base.paidIDL * entry.weight);
      }

      const [w1DL, w2DL, w3DL, w4DL] = buildWeeklyRamp(monthEndDL, processType);

      const rec: HrDatabaseRecord = {
        deptCode: entry.deptCode,
        label: entry.label,
        department: entry.department,
        processType: entry.processType,
        plantId: site.id,
        plantName: site.name,
        month,
        budgetDL,
        budgetIDL,
        budgetTotal: budgetDL + budgetIDL,
        w1DL,
        w2DL,
        w3DL,
        w4DL,
        monthEndDL,
        monthEndIDL,
        monthEndTotal: monthEndDL + monthEndIDL,
        attendanceRate: entry.attendanceRate,
        source: 'HR_DB_MASTER',
      };

      catalogRecords.push(rec);
      byCodeMap.set(rec.deptCode, rec);
    }
  }

  return { catalogRecords, byCodeMap, baseByProcess: byProcess };
}

function getOrCreateRecordForCode(
  code: string,
  processType: HrProcessType,
  site: SiteData,
  month: number,
  byCodeMap: Map<string, HrDatabaseRecord>,
  baseByProcess: ReturnType<typeof resolveDeptBaseSplit>['byProcess']
): HrDatabaseRecord {
  const norm = normalizeDepartmentCode(code);
  const existing = byCodeMap.get(norm);
  if (existing) return existing;

  const base = baseByProcess[processType];
  const w = hashCustomCodeWeight(norm);
  const budgetDL = Math.round(base.budgetDL * w);
  const budgetIDL = Math.round(base.budgetIDL * w);
  const monthEndDL = Math.round(base.paidDL * w);
  const monthEndIDL = Math.round(base.paidIDL * w);
  const [w1DL, w2DL, w3DL, w4DL] = buildWeeklyRamp(monthEndDL, processType);

  const deptNames: Record<HrProcessType, string> = {
    SMT: 'SMT',
    PCA: 'PCA',
    'System Assembly': 'System Assembly',
    Quality: 'Quality Control',
    Troubleshooting: 'Troubleshooting',
    Warehouse: 'Warehouse Logistics',
    'Other Support': 'Other Support',
  };

  return {
    deptCode: norm,
    label: `HR DB Custom Dept (${norm})`,
    department: deptNames[processType],
    processType,
    plantId: site.id,
    plantName: site.name,
    month,
    budgetDL,
    budgetIDL,
    budgetTotal: budgetDL + budgetIDL,
    w1DL,
    w2DL,
    w3DL,
    w4DL,
    monthEndDL,
    monthEndIDL,
    monthEndTotal: monthEndDL + monthEndIDL,
    attendanceRate: '98.0%',
    source: 'HR_DB_CUSTOM_MATCH',
  };
}

function querySinglePlantHrDatabase(
  site: SiteData,
  apsPlan: MonthlyApsPlan,
  month: number,
  filterDeptCodes?: string[]
): HrDatabaseQueryResult {
  const { catalogRecords, byCodeMap, baseByProcess } = buildSiteCatalogRecords(site, apsPlan, month);
  const filterSet =
    filterDeptCodes && filterDeptCodes.length > 0
      ? new Set(filterDeptCodes.map(normalizeDepartmentCode))
      : null;

  const deptConfigs: Array<{ processType: HrProcessType; department: string; defaultAttendance: string }> = [
    { processType: 'SMT', department: 'SMT', defaultAttendance: '98.6%' },
    { processType: 'PCA', department: 'PCA', defaultAttendance: '96.8%' },
    { processType: 'System Assembly', department: 'System Assembly', defaultAttendance: '97.2%' },
    { processType: 'Quality', department: 'Quality Control', defaultAttendance: '99.1%' },
    { processType: 'Troubleshooting', department: 'Troubleshooting', defaultAttendance: '97.5%' },
    { processType: 'Warehouse', department: 'Warehouse Logistics', defaultAttendance: '98.0%' },
    { processType: 'Other Support', department: 'Other Support', defaultAttendance: '99.0%' },
  ];

  const matchedRecords: HrDatabaseRecord[] = [];
  const departmentRows: CostCenterPayrollWeekly[] = [];

  for (const cfg of deptConfigs) {
    const assignedCodes = getSiteDepartmentCodes(site, cfg.processType);
    const activeCodes = filterSet
      ? assignedCodes.filter((c) => filterSet.has(c))
      : assignedCodes;

    const deptMatched = activeCodes.map((code) =>
      getOrCreateRecordForCode(code, cfg.processType, site, month, byCodeMap, baseByProcess)
    );
    matchedRecords.push(...deptMatched);

    const budgetDL = deptMatched.reduce((s, r) => s + r.budgetDL, 0);
    const budgetIDL = deptMatched.reduce((s, r) => s + r.budgetIDL, 0);
    const budgetTotal = budgetDL + budgetIDL;

    const w1DL = deptMatched.reduce((s, r) => s + r.w1DL, 0);
    const w2DL = deptMatched.reduce((s, r) => s + r.w2DL, 0);
    const w3DL = deptMatched.reduce((s, r) => s + r.w3DL, 0);
    const w4DL = deptMatched.reduce((s, r) => s + r.w4DL, 0);
    const monthEndDL = deptMatched.reduce((s, r) => s + r.monthEndDL, 0);
    const monthEndIDL = deptMatched.reduce((s, r) => s + r.monthEndIDL, 0);
    const monthEndTotal = monthEndDL + monthEndIDL;

    const apsDemandDL = baseByProcess[cfg.processType].apsDL;
    const varianceDL = monthEndDL - apsDemandDL;
    const status: 'SURPLUS' | 'BALANCED' | 'DEFICIT' =
      varianceDL < 0 ? 'DEFICIT' : varianceDL > 0 ? 'SURPLUS' : 'BALANCED';

    const attendanceRate =
      deptMatched.length > 0 ? deptMatched[0].attendanceRate : cfg.defaultAttendance;

    departmentRows.push({
      department: cfg.department,
      processType: cfg.processType,
      costCenters: activeCodes,
      deptCodes: activeCodes,
      budgetDL,
      budgetIDL,
      budgetTotal,
      w1DL,
      w2DL,
      w3DL,
      w4DL,
      monthEndDL,
      monthEndIDL,
      monthEndTotal,
      attendanceRate,
      apsDemandDL,
      varianceDL,
      status,
      actionNeeded: computePlantGapActionPlan(site, cfg.processType, varianceDL),
      matchedRecordCount: deptMatched.length,
    });
  }

  const totals: HrDatabaseQueryTotals = {
    budgetDL: departmentRows.reduce((s, r) => s + (r.budgetDL || 0), 0),
    budgetIDL: departmentRows.reduce((s, r) => s + (r.budgetIDL || 0), 0),
    budgetTotal: departmentRows.reduce((s, r) => s + (r.budgetTotal || 0), 0),
    w1DL: departmentRows.reduce((s, r) => s + r.w1DL, 0),
    w2DL: departmentRows.reduce((s, r) => s + r.w2DL, 0),
    w3DL: departmentRows.reduce((s, r) => s + r.w3DL, 0),
    w4DL: departmentRows.reduce((s, r) => s + r.w4DL, 0),
    monthEndDL: departmentRows.reduce((s, r) => s + r.monthEndDL, 0),
    monthEndIDL: departmentRows.reduce((s, r) => s + (r.monthEndIDL || 0), 0),
    monthEndTotal: departmentRows.reduce((s, r) => s + (r.monthEndTotal || 0), 0),
    apsDemandDL: departmentRows.reduce((s, r) => s + r.apsDemandDL, 0),
    varianceDL: departmentRows.reduce((s, r) => s + r.varianceDL, 0),
    activeDeptCodes: Array.from(new Set(departmentRows.flatMap((r) => r.deptCodes || []))),
  };

  return {
    departmentRows,
    matchedRecords,
    catalogRecords,
    totals,
  };
}

export function queryHrDatabaseBySite(
  site: SiteData,
  apsPlan: MonthlyApsPlan,
  month: number,
  allSites?: Record<string, SiteData>,
  perSiteApsPlans?: Record<string, MonthlyApsPlan>,
  filterDeptCodes?: string[]
): HrDatabaseQueryResult {
  if (site.id === 'overall' && allSites) {
    const individualSites = Object.values(allSites).filter((s) => s.id !== 'overall');
    if (individualSites.length > 0) {
      const perSiteResults = individualSites.map((s) =>
        querySinglePlantHrDatabase(
          s,
          perSiteApsPlans?.[s.id] || apsPlan,
          month,
          filterDeptCodes
        )
      );

      const processOrder: HrProcessType[] = [
        'SMT',
        'PCA',
        'System Assembly',
        'Quality',
        'Troubleshooting',
        'Warehouse',
        'Other Support',
      ];

      const departmentRows: CostCenterPayrollWeekly[] = processOrder.map((proc) => {
        const matchingRows = perSiteResults
          .map((res) => res.departmentRows.find((r) => r.processType === proc))
          .filter(Boolean) as CostCenterPayrollWeekly[];

        const first = matchingRows[0];
        const deptCodes = Array.from(new Set(matchingRows.flatMap((r) => r.deptCodes || r.costCenters)));
        const budgetDL = matchingRows.reduce((s, r) => s + (r.budgetDL || 0), 0);
        const budgetIDL = matchingRows.reduce((s, r) => s + (r.budgetIDL || 0), 0);
        const budgetTotal = budgetDL + budgetIDL;
        const w1DL = matchingRows.reduce((s, r) => s + r.w1DL, 0);
        const w2DL = matchingRows.reduce((s, r) => s + r.w2DL, 0);
        const w3DL = matchingRows.reduce((s, r) => s + r.w3DL, 0);
        const w4DL = matchingRows.reduce((s, r) => s + r.w4DL, 0);
        const monthEndDL = matchingRows.reduce((s, r) => s + r.monthEndDL, 0);
        const monthEndIDL = matchingRows.reduce((s, r) => s + (r.monthEndIDL || 0), 0);
        const monthEndTotal = monthEndDL + monthEndIDL;

        const apsDemandDL =
          proc === 'SMT'
            ? apsPlan.smtOnlineDL + (apsPlan.smtOfflineDL || 0)
            : proc === 'PCA'
            ? apsPlan.pcaOnlineDL + (apsPlan.pcaOfflineDL || 0)
            : proc === 'System Assembly'
            ? apsPlan.assemblyOnlineDL + (apsPlan.assemblyOfflineDL || 0)
            : proc === 'Quality'
            ? apsPlan.qcDL ?? 0
            : proc === 'Troubleshooting'
            ? apsPlan.tsDL ?? 0
            : proc === 'Warehouse'
            ? apsPlan.whDL ?? 0
            : apsPlan.otherSupportDL ?? 0;

        const varianceDL = monthEndDL - apsDemandDL;
        const status: 'SURPLUS' | 'BALANCED' | 'DEFICIT' =
          varianceDL < 0 ? 'DEFICIT' : varianceDL > 0 ? 'SURPLUS' : 'BALANCED';

        return {
          department: first?.department || proc,
          processType: proc,
          costCenters: deptCodes,
          deptCodes,
          budgetDL,
          budgetIDL,
          budgetTotal,
          w1DL,
          w2DL,
          w3DL,
          w4DL,
          monthEndDL,
          monthEndIDL,
          monthEndTotal,
          attendanceRate: first?.attendanceRate || '98.0%',
          apsDemandDL,
          varianceDL,
          status,
          actionNeeded: computePlantGapActionPlan(site, proc, varianceDL),
          matchedRecordCount: matchingRows.reduce((s, r) => s + (r.matchedRecordCount || 0), 0),
        };
      });

      // Aggregate matchedRecords by deptCode across plants for Overall HR DB preview
      const aggMap = new Map<string, HrDatabaseRecord>();
      for (const res of perSiteResults) {
        for (const rec of res.matchedRecords) {
          const prev = aggMap.get(rec.deptCode);
          if (!prev) {
            aggMap.set(rec.deptCode, { ...rec, plantId: 'overall', plantName: 'All Plants' });
          } else {
            aggMap.set(rec.deptCode, {
              ...prev,
              budgetDL: prev.budgetDL + rec.budgetDL,
              budgetIDL: prev.budgetIDL + rec.budgetIDL,
              budgetTotal: prev.budgetTotal + rec.budgetTotal,
              w1DL: prev.w1DL + rec.w1DL,
              w2DL: prev.w2DL + rec.w2DL,
              w3DL: prev.w3DL + rec.w3DL,
              w4DL: prev.w4DL + rec.w4DL,
              monthEndDL: prev.monthEndDL + rec.monthEndDL,
              monthEndIDL: prev.monthEndIDL + rec.monthEndIDL,
              monthEndTotal: prev.monthEndTotal + rec.monthEndTotal,
            });
          }
        }
      }

      const totals: HrDatabaseQueryTotals = {
        budgetDL: departmentRows.reduce((s, r) => s + (r.budgetDL || 0), 0),
        budgetIDL: departmentRows.reduce((s, r) => s + (r.budgetIDL || 0), 0),
        budgetTotal: departmentRows.reduce((s, r) => s + (r.budgetTotal || 0), 0),
        w1DL: departmentRows.reduce((s, r) => s + r.w1DL, 0),
        w2DL: departmentRows.reduce((s, r) => s + r.w2DL, 0),
        w3DL: departmentRows.reduce((s, r) => s + r.w3DL, 0),
        w4DL: departmentRows.reduce((s, r) => s + r.w4DL, 0),
        monthEndDL: departmentRows.reduce((s, r) => s + r.monthEndDL, 0),
        monthEndIDL: departmentRows.reduce((s, r) => s + (r.monthEndIDL || 0), 0),
        monthEndTotal: departmentRows.reduce((s, r) => s + (r.monthEndTotal || 0), 0),
        apsDemandDL: departmentRows.reduce((s, r) => s + r.apsDemandDL, 0),
        varianceDL: departmentRows.reduce((s, r) => s + r.varianceDL, 0),
        activeDeptCodes: Array.from(new Set(departmentRows.flatMap((r) => r.deptCodes || []))),
      };

      return {
        departmentRows,
        matchedRecords: Array.from(aggMap.values()),
        catalogRecords: Array.from(aggMap.values()),
        totals,
      };
    }
  }

  return querySinglePlantHrDatabase(site, apsPlan, month, filterDeptCodes);
}
