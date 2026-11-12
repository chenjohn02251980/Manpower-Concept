export type ShiftNumber = 0 | 1 | 2 | 3 | 4;
export type ShiftType = 'Day' | 'Night'; // Kept for backward compatibility
export type SubCategory = 'MB' | 'SC';
export type TimePeriod = 'MONTHLY' | 'QUARTERLY';
export type ViewTab = 'overview' | 'aps_demand' | 'hr_actual' | 'ie_forecast' | 'global_feedback';
export type IeStandardSubTab = 'historical_trend' | 'five_functions';
export type AnnualManpowerTab = 'trend' | 'matrix' | 'both';

export interface SmtLine {
  id: string;
  name: string;
  shift: ShiftNumber;
  category: SubCategory;
  onlineStdDL: number;
  offlineDL?: number; // legacy optional
}

export interface PcaLine {
  id: string;
  name: string;
  shift?: ShiftNumber; // legacy optional
  category: SubCategory;
  faStdDL: number;
  faShift: ShiftNumber;
  testStdDL: number;
  testShift: ShiftNumber;
  packingStdDL: number;
  packingShift: ShiftNumber;
  offlineDL?: number; // legacy optional
}

export interface CpuAssemblyLine {
  id: string;
  name: string;
  shift?: ShiftNumber; // legacy optional
  assyDL: number;
  assyShift: ShiftNumber;
  testDL: number;
  testShift: ShiftNumber;
  packDL: number;
  packShift: ShiftNumber;
  offlineDL?: number; // legacy optional
}

export type AssemblyLine = CpuAssemblyLine;
export type RackAssemblyLine = CpuAssemblyLine;

export interface QualityControlItem {
  id: string;
  name: string;
  dl: number;
  idl: number;
}

export interface QualityControlData {
  costCenter?: string | string[];
  pqcCostCenter?: string | string[];
  oqcCostCenter?: string | string[];
  pqcDL?: number;
  pqcIDL?: number;
  pqcDayShift?: number;
  pqcNightShift?: number;
  oqcStandardDL: number;
  oqcIndirectIDL: number;
  oqcDL?: number;
  oqcIDL?: number;
  items?: QualityControlItem[];
}

export interface TroubleshootingItem {
  id: string;
  name: string;
  dl: number;
  idl: number;
}

export interface TroubleShootingData {
  costCenter?: string | string[];
  dlEntry: number;
  idlEntry: number;
  items?: TroubleshootingItem[];
}

export interface WarehouseItem {
  id: string;
  name: string;
  dl: number;
  idl: number;
}

export interface WarehouseData {
  costCenter?: string | string[];
  logisticsDL: number;
  adminIDL: number;
  items?: WarehouseItem[];
}

export interface OtherSupportItem {
  id: string;
  name: string;
  dl: number;
  idl: number;
}

export interface OtherSupportData {
  costCenter?: string | string[];
  dl?: number;
  generalIDL: number;
  dlNA?: string;
  items?: OtherSupportItem[];
}

export interface MonthDepartmentSnapshot {
  smtOfflineDL: number;
  pcaOfflineDL: number;
  assemblyOfflineDL: number;
  smtIdl: number;
  pcaIdl: number;
  assemblyIdl: number;
  smtLines: SmtLine[];
  pcaLines: PcaLine[];
  cpuAssemblyLines: CpuAssemblyLine[];
  rackAssemblyLines?: CpuAssemblyLine[];
  qualityControl: QualityControlData;
  troubleShooting: TroubleShootingData;
  warehouse: WarehouseData;
  otherSupport: OtherSupportData;
}

export interface MonthDepartmentManpower {
  month: number;
  monthName: string;
  // 5 Major Departments DL & IDL
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
  // Totals
  totalDL: number;
  totalIDL: number;
  totalHeadcount: number;
  dlRatio: string;
  // Snapshot for detailed line & station level maintenance
  snapshot: MonthDepartmentSnapshot;
  note?: string;
  isModified?: boolean;
}

export interface MonthlyBudgetDetail {
  total: number;
  dl: number;
  idl: number;
}

export interface SiteData {
  id: string;
  name: string;
  code: string;
  plants?: string[];
  plantNote?: string;
  targetDemandDL: number;
  actualHrDL: number;
  actualHrIDL?: number;
  // HR System Master Yearly Budget Manpower (Connected from HR System)
  yearlyBudgetManpower?: number;
  yearlyBudgetDL?: number;
  yearlyBudgetIDL?: number;
  monthlyBudgets?: Record<number, MonthlyBudgetDetail>;
  // Manufacturing Segment Independent Offline DL
  smtOfflineDL: number;
  pcaOfflineDL: number;
  assemblyOfflineDL: number;
  // Segment IDL
  smtIdl: number;
  pcaIdl: number;
  assemblyIdl: number;
  // Cost Center (HR System Integration - supports multiple cost centers)
  smtCostCenter?: string | string[];
  pcaCostCenter?: string | string[];
  assemblyCostCenter?: string | string[];
  // Manufacturing Segment Production Lines
  smtLines: SmtLine[];
  pcaLines: PcaLine[];
  cpuAssemblyLines: CpuAssemblyLine[];
  rackAssemblyLines?: CpuAssemblyLine[];
  // Other Support Segments
  qualityControl: QualityControlData;
  troubleShooting: TroubleShootingData;
  warehouse: WarehouseData;
  otherSupport: OtherSupportData;
  // Monthly Maintenance Data for 5 Major Departments (1 ~ 12 months)
  monthlyDepartmentData?: Record<number, MonthDepartmentManpower>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'warning' | 'info' | 'success';
  read: boolean;
}

export interface FeedbackItem {
  id: string;
  line: string;
  author: string;
  department: string;
  comment: string;
  suggestedChange: string;
  date: string;
  status: 'Approved' | 'Pending Review' | 'In Discussion';
}

export interface DailyLineSchedule {
  lineId: string;
  lineName: string;
  process: 'SMT' | 'PCA' | 'System Assembly';
  category?: SubCategory;
  ieStdDLPerShift: number; // Headcount per shift from IE STANDARD
  dailyShifts: number; // Scheduled active shifts per day (1, 2, 3)
  dailyRequiredDL: number; // dailyShifts * ieStdDLPerShift
  shiftDetails?: string; // e.g. "Day / Night (2 Shifts)"
  daysActiveInMonth: number;
}

export interface MonthlyApsPlan {
  planningYear: number;
  planningMonth: number; // 1 - 12 (Updated in Week 3 of current month)
  targetYear: number;
  targetMonth: number; // 1 - 12 (Target next-month demand projection)
  cycleWeek: string; // "W3 Update (Published in 3rd week)"
  workingDays: number;
  lines: DailyLineSchedule[];
  smtOnlineDL: number;
  pcaOnlineDL: number;
  assemblyOnlineDL: number;
  totalOnlineDL: number;
  totalOfflineDL: number;
  totalSupportDL: number;
  totalApsDemandDL: number;
  // Fixed IDL from IE Standard (constant, unchanged by capacity fluctuations)
  fixedIDL: number;
  mfgIDL: number;
  supportIDL: number;
  totalDemandHeadcount: number; // totalApsDemandDL + fixedIDL
}

export interface CostCenterPayrollWeekly {
  department: string;
  processType: 'SMT' | 'PCA' | 'System Assembly' | 'Quality' | 'Troubleshooting' | 'Warehouse';
  costCenters: string[];
  w1DL: number;
  w2DL: number;
  w3DL: number; // W3 snapshot
  w4DL: number;
  monthEndDL: number; // Month-end final paid direct labor
  attendanceRate: string;
  apsDemandDL: number;
  varianceDL: number; // monthEndDL - apsDemandDL
  status: 'SURPLUS' | 'BALANCED' | 'DEFICIT';
  actionNeeded: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: string;
  plantScope: string; // 'tao' | 'wks' | 'whb' | 'mex' | 'vnm' | 'all'
  plantName: string;
}

