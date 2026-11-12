import React, { useState, useEffect } from 'react';
import { SiteData, SmtLine, PcaLine, CpuAssemblyLine, RackAssemblyLine, QualityControlItem, WarehouseItem, TroubleshootingItem, OtherSupportItem, SubCategory, ShiftNumber, CurrentUser, IeStandardSubTab } from '../types';
import { CostCenterMultiPicker, CostCenterPreset } from './CostCenterMultiPicker';
import { IEHistoricalManpowerOverview } from './IEHistoricalManpowerOverview';
import { FiveDepartmentMonthlyMaintenance } from './FiveDepartmentMonthlyMaintenance';
import { extractSiteSnapshot, updateSiteMonthData } from '../utils/monthlyDepartmentHelper';

const SMT_HR_PRESETS: CostCenterPreset[] = [
  { code: 'CC-SMT-7101', label: 'SMT MB Line Group A' },
  { code: 'CC-SMT-7102', label: 'SMT MB Line Group B' },
  { code: 'CC-SMT-7105', label: 'SMT Small-card Cell' },
  { code: 'CC-SMT-7109', label: 'SMT Prototype & NPI' },
];

const PCA_HR_PRESETS: CostCenterPreset[] = [
  { code: 'CC-PCA-7101', label: 'PCA FA Test Cell A' },
  { code: 'CC-PCA-7105', label: 'PCA Board Functional Test' },
  { code: 'CC-PCA-7108', label: 'PCA Small-Card Packing' },
  { code: 'CC-PCA-7112', label: 'PCA ICT & Burn-in Cell' },
];

const ASSEMBLY_HR_PRESETS: CostCenterPreset[] = [
  { code: 'CC-SYS-7110', label: 'System Assembly Main Line' },
  { code: 'CC-SYS-7115', label: 'Server Integration & Test' },
  { code: 'CC-SYS-7120', label: 'Chassis Final Packaging' },
  { code: 'CC-SYS-7125', label: 'Rack & Stack Custom Config' },
];

const QC_HR_PRESETS: CostCenterPreset[] = [
  { code: 'CC-QC-7201', label: 'PQC Line Audit Team' },
  { code: 'CC-QC-7202', label: 'SQC Sampling & Reliability' },
  { code: 'CC-QC-7205', label: 'In-Process Quality Inspection' },
  { code: 'CC-QC-7210', label: 'OQC Outgoing Inspection' },
  { code: 'CC-QC-7215', label: 'Finished Goods QA & Audit' },
  { code: 'CC-QC-7220', label: 'Customer Quality Assurance (CQA)' },
  { code: 'CC-QC-7225', label: 'IQC Incoming Inspection & Lab' },
];

const PQC_HR_PRESETS = QC_HR_PRESETS;
const OQC_HR_PRESETS = QC_HR_PRESETS;

const TROUBLESHOOTING_HR_PRESETS: CostCenterPreset[] = [
  { code: 'CC-TS-7301', label: 'Trouble Shooting Debug Lab' },
  { code: 'CC-TS-7302', label: 'BGA & Board Repair Cell' },
  { code: 'CC-TS-7305', label: 'Failure Analysis (FA) & RMA' },
  { code: 'CC-TS-7308', label: 'Test Diagnostic & Fixture Lab' },
];

const WAREHOUSE_HR_PRESETS: CostCenterPreset[] = [
  { code: 'CC-WH-7401', label: 'Raw Materials & Receiving Hub' },
  { code: 'CC-WH-7402', label: 'WIP Inventory & Internal Logistics' },
  { code: 'CC-WH-7405', label: 'Finished Goods & Shipping Center' },
  { code: 'CC-WH-7408', label: 'Customs & Bonded Warehouse' },
];

const OTHER_SUPPORT_HR_PRESETS: CostCenterPreset[] = [
  { code: 'CC-OTH-7501', label: 'Plant Facility & Cleanroom Ops' },
  { code: 'CC-OTH-7502', label: 'EHS & Industrial Safety Dept' },
  { code: 'CC-OTH-7505', label: 'General Administration & Affairs' },
  { code: 'CC-OTH-7508', label: 'Plant Security & Facilities' },
];

interface IEForecastViewProps {
  site: SiteData;
  onUpdateSite: (updatedSite: SiteData) => void;
  selectedMonth?: number;
  selectedYear?: number;
  onChangeMonth?: (month: number) => void;
  onChangeYear?: (year: number) => void;
  currentUser?: CurrentUser;
  onSwitchUser?: (user: CurrentUser) => void;
  availableUsers?: CurrentUser[];
  subTab?: IeStandardSubTab;
  onSubTabChange?: (tab: IeStandardSubTab) => void;
}

export const IEForecastView: React.FC<IEForecastViewProps> = ({
  site,
  onUpdateSite: parentOnUpdateSite,
  selectedMonth = 9,
  selectedYear = 2026,
  onChangeMonth,
  onChangeYear,
  currentUser,
  onSwitchUser,
  availableUsers,
  subTab,
  onSubTabChange,
}) => {
  // Permission logic:
  // 1. "overall" consolidated view is read-only.
  // 2. Only the IE belonging to this plant (or Global IE Admin) has permission to edit manpower, lines, and shifts.
  const isOverallConsolidation = site.id === 'overall';
  const hasEditPermission =
    !isOverallConsolidation &&
    (!currentUser ||
      currentUser.plantScope === 'all' ||
      currentUser.plantScope === site.id ||
      currentUser.plantScope === site.code?.toLowerCase());

  // Wrapper that synchronizes any deep-dive edits into the active month's snapshot
  const onUpdateSite = (updatedSite: SiteData) => {
    if (!hasEditPermission) {
      alert(
        `[Insufficient Permissions] You are currently logged in as [${currentUser?.name || 'Unknown'}] with permissions to maintain [${currentUser?.plantName || ''}] plant data, not [${site.name}] plant!`
      );
      return;
    }
    const snap = extractSiteSnapshot(updatedSite);
    const withMonthly = updateSiteMonthData(updatedSite, selectedMonth, snap, selectedMonth);
    parentOnUpdateSite(withMonthly);
  };
  const [smtCategoryFilter, setSmtCategoryFilter] = useState<SubCategory>('MB');
  const [pcaCategoryFilter, setPcaCategoryFilter] = useState<SubCategory>('MB');
  const [assemblyCategoryFilter, setAssemblyCategoryFilter] = useState<'CPU' | 'RACK'>('CPU');

  const [mfgOpen, setMfgOpen] = useState(true);
  const [smtOpen, setSmtOpen] = useState(true);
  const [pcaOpen, setPcaOpen] = useState(true);
  const [assyOpen, setAssyOpen] = useState(true);
  const [qcOpen, setQcOpen] = useState(true);
  const [baselineOpen, setBaselineOpen] = useState(true);
  const [tsOpen, setTsOpen] = useState(true);
  const [whOpen, setWhOpen] = useState(true);
  const [otherSupportOpen, setOtherSupportOpen] = useState(true);

  // Consolidated Master Block Category Navigation Tab
  type DepartmentCategoryTab = 'all' | 'mfg' | 'qc' | 'ts' | 'wh' | 'other';
  const [activeDeptTab, setActiveDeptTab] = useState<DepartmentCategoryTab>('all');

  // IE Standard Top-Level Menu Selection: 1. Historical Manpower Trend (Left) vs 2. 5 Functions & Configuration (Right)
  type IeStandardViewMode = 'historical_trend' | 'five_functions' | 'all';
  const [ieStandardViewMode, setIeStandardViewMode] = useState<IeStandardViewMode>(() => {
    if (subTab) return subTab;
    try {
      const saved = localStorage.getItem('ie_standard_view_mode');
      if (saved === 'historical_trend' || saved === 'five_functions' || saved === 'all') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'historical_trend';
  });

  // Keep internal state in sync whenever subTab prop changes (e.g. clicked from left sidebar)
  useEffect(() => {
    if (subTab) {
      setIeStandardViewMode(subTab);
    }
  }, [subTab]);

  const handleSetIeStandardViewMode = (mode: IeStandardViewMode) => {
    setIeStandardViewMode(mode);
    try {
      localStorage.setItem('ie_standard_view_mode', mode);
    } catch {
      // ignore
    }
    if (mode === 'historical_trend' || mode === 'five_functions') {
      onSubTabChange?.(mode);
    }
  };

  // Subtotal calculations for SMT
  const smtOnlineDL = (site.smtLines || []).reduce((acc, l) => {
    const shiftCount = typeof l.shift === 'number' ? l.shift : 1;
    return acc + (l.onlineStdDL || 0) * shiftCount;
  }, 0);
  const smtOfflineDL = site.smtOfflineDL || 0;
  const smtTotalDL = smtOnlineDL + smtOfflineDL;

  // Subtotal calculations for PCA
  const pcaOnlineDL = (site.pcaLines || []).reduce((acc, l) => {
    const faShifts = typeof l.faShift === 'number' ? l.faShift : 1;
    const testShifts = typeof l.testShift === 'number' ? l.testShift : 1;
    const packShifts = typeof l.packingShift === 'number' ? l.packingShift : 1;
    return acc + (l.faStdDL || 0) * faShifts + (l.testStdDL || 0) * testShifts + (l.packingStdDL || 0) * packShifts;
  }, 0);
  const pcaOfflineDL = site.pcaOfflineDL || 0;
  const pcaTotalDL = pcaOnlineDL + pcaOfflineDL;

  // Subtotal calculations for System Assembly (CPU Assembly + Rack Assembly)
  const cpuAssyOnlineDL = (site.cpuAssemblyLines || []).reduce((acc, l) => {
    const assyShifts = typeof l.assyShift === 'number' ? l.assyShift : 1;
    const testShifts = typeof l.testShift === 'number' ? l.testShift : 1;
    const packShifts = typeof l.packShift === 'number' ? l.packShift : 1;
    return acc + (l.assyDL || 0) * assyShifts + (l.testDL || 0) * testShifts + (l.packDL || 0) * packShifts;
  }, 0);

  const rackAssyOnlineDL = (site.rackAssemblyLines || []).reduce((acc, l) => {
    const assyShifts = typeof l.assyShift === 'number' ? l.assyShift : 1;
    const testShifts = typeof l.testShift === 'number' ? l.testShift : 1;
    const packShifts = typeof l.packShift === 'number' ? l.packShift : 1;
    return acc + (l.assyDL || 0) * assyShifts + (l.testDL || 0) * testShifts + (l.packDL || 0) * packShifts;
  }, 0);

  const assyOnlineDL = cpuAssyOnlineDL + rackAssyOnlineDL;
  const assyOfflineDL = site.assemblyOfflineDL || 0;
  const assyTotalDL = assyOnlineDL + assyOfflineDL;

  // Total Manufacturing DL & IDL
  const totalMfgOnlineDL = smtOnlineDL + pcaOnlineDL + assyOnlineDL;
  const totalMfgOfflineDL = smtOfflineDL + pcaOfflineDL + assyOfflineDL;
  const totalMfgDL = smtTotalDL + pcaTotalDL + assyTotalDL;
  const totalMfgIDL = (site.smtIdl || 0) + (site.pcaIdl || 0) + (site.assemblyIdl || 0);

  // QC Subtotals
  const qcTotalDL = (site.qualityControl.items && site.qualityControl.items.length > 0)
    ? site.qualityControl.items.reduce((acc, it) => acc + (Number(it.dl) || 0), 0)
    : (site.qualityControl.pqcDL || 0) + (site.qualityControl.oqcStandardDL || site.qualityControl.oqcDL || 0);
  const qcTotalIDL = (site.qualityControl.items && site.qualityControl.items.length > 0)
    ? site.qualityControl.items.reduce((acc, it) => acc + (Number(it.idl) || 0), 0)
    : (site.qualityControl.pqcIDL !== undefined
        ? site.qualityControl.pqcIDL
        : (site.qualityControl.pqcDayShift || 0) + (site.qualityControl.pqcNightShift || 0)) +
      (site.qualityControl.oqcIndirectIDL || site.qualityControl.oqcIDL || 0);

  // Support Subtotals
  const tsTotalDL = site.troubleShooting.dlEntry || 0;
  const tsTotalIDL = site.troubleShooting.idlEntry || 0;
  const whTotalDL = site.warehouse.logisticsDL || 0;
  const whTotalIDL = site.warehouse.adminIDL || 0;
  const otherTotalDL = site.otherSupport.dl ?? 0;
  const otherTotalIDL = site.otherSupport.generalIDL || 0;

  // Full Plant Grand Totals
  const plantGrandTotalDL = totalMfgDL + qcTotalDL + tsTotalDL + whTotalDL + otherTotalDL;
  const plantGrandTotalIDL = totalMfgIDL + qcTotalIDL + tsTotalIDL + whTotalIDL + otherTotalIDL;
  const plantGrandTotal = plantGrandTotalDL + plantGrandTotalIDL;

  const handleScrollToSegment = (segId: string) => {
    handleSetIeStandardViewMode('five_functions');
    if (segId === 'segment-manufacturing') setActiveDeptTab('mfg');
    else if (segId === 'segment-quality-control') {
      setActiveDeptTab('qc');
      setQcOpen(true);
    }
    else if (segId === 'segment-troubleshooting') {
      setActiveDeptTab('ts');
      setTsOpen(true);
    }
    else if (segId === 'segment-warehouse') {
      setActiveDeptTab('wh');
      setWhOpen(true);
    }
    else if (segId === 'segment-othersupport') {
      setActiveDeptTab('other');
      setOtherSupportOpen(true);
    }
    else setActiveDeptTab('all');

    setTimeout(() => {
      const el = document.getElementById(segId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  // Handlers for SMT
  const handleSmtOfflineChange = (val: number) => {
    onUpdateSite({ ...site, smtOfflineDL: val });
  };

  const handleSmtIdlChange = (val: number) => {
    onUpdateSite({ ...site, smtIdl: val });
  };

  const handleSmtCostCenterChange = (val: string[]) => {
    onUpdateSite({ ...site, smtCostCenter: val });
  };

  const handleAddSmtLine = () => {
    const newLine: SmtLine = {
      id: `smt-${Date.now()}`,
      name: `Line-S${String(site.smtLines.length + 1).padStart(2, '0')}`,
      shift: 2,
      category: smtCategoryFilter,
      onlineStdDL: 12,
    };
    onUpdateSite({ ...site, smtLines: [...site.smtLines, newLine] });
  };

  const handleUpdateSmtLine = (id: string, field: keyof SmtLine, value: any) => {
    const updated = site.smtLines.map((line) =>
      line.id === id ? { ...line, [field]: value } : line
    );
    onUpdateSite({ ...site, smtLines: updated });
  };

  const handleDeleteSmtLine = (id: string) => {
    onUpdateSite({ ...site, smtLines: site.smtLines.filter((l) => l.id !== id) });
  };

  // Handlers for PCA
  const handlePcaOfflineChange = (val: number) => {
    onUpdateSite({ ...site, pcaOfflineDL: val });
  };

  const handlePcaIdlChange = (val: number) => {
    onUpdateSite({ ...site, pcaIdl: val });
  };

  const handlePcaCostCenterChange = (val: string[]) => {
    onUpdateSite({ ...site, pcaCostCenter: val });
  };

  const handleAddPcaLine = () => {
    const newLine: PcaLine = {
      id: `pca-${Date.now()}`,
      name: `PCA-P${String(site.pcaLines.length + 1).padStart(2, '0')}`,
      category: pcaCategoryFilter,
      faStdDL: 8,
      faShift: 2,
      testStdDL: 4,
      testShift: 2,
      packingStdDL: 2,
      packingShift: 1,
    };
    onUpdateSite({ ...site, pcaLines: [...site.pcaLines, newLine] });
  };

  const handleUpdatePcaLine = (id: string, field: keyof PcaLine, value: any) => {
    const updated = site.pcaLines.map((line) =>
      line.id === id ? { ...line, [field]: value } : line
    );
    onUpdateSite({ ...site, pcaLines: updated });
  };

  const handleDeletePcaLine = (id: string) => {
    onUpdateSite({ ...site, pcaLines: site.pcaLines.filter((l) => l.id !== id) });
  };

  // Handlers for CPU Assembly
  const handleAssemblyOfflineChange = (val: number) => {
    onUpdateSite({ ...site, assemblyOfflineDL: val });
  };

  const handleAssemblyIdlChange = (val: number) => {
    onUpdateSite({ ...site, assemblyIdl: val });
  };

  const handleAssemblyCostCenterChange = (val: string[]) => {
    onUpdateSite({ ...site, assemblyCostCenter: val });
  };

  const handleAddCpuAssemblyLine = () => {
    const newLine: CpuAssemblyLine = {
      id: `cpu-${Date.now()}`,
      name: `CPU-L${String((site.cpuAssemblyLines || []).length + 1).padStart(2, '0')}`,
      assyDL: 24,
      assyShift: 2,
      testDL: 8,
      testShift: 2,
      packDL: 4,
      packShift: 1,
    };
    onUpdateSite({
      ...site,
      cpuAssemblyLines: [...(site.cpuAssemblyLines || []), newLine],
    });
  };

  const handleUpdateCpuAssemblyLine = (id: string, field: keyof CpuAssemblyLine, value: any) => {
    const updated = (site.cpuAssemblyLines || []).map((line) =>
      line.id === id ? { ...line, [field]: value } : line
    );
    onUpdateSite({ ...site, cpuAssemblyLines: updated });
  };

  const handleDeleteCpuAssemblyLine = (id: string) => {
    onUpdateSite({
      ...site,
      cpuAssemblyLines: (site.cpuAssemblyLines || []).filter((l) => l.id !== id),
    });
  };

  // Handlers for Rack Assembly
  const handleAddRackAssemblyLine = () => {
    const newLine: RackAssemblyLine = {
      id: `rack-${Date.now()}`,
      name: `RACK-L${String((site.rackAssemblyLines || []).length + 1).padStart(2, '0')}`,
      assyDL: 20,
      assyShift: 2,
      testDL: 8,
      testShift: 2,
      packDL: 4,
      packShift: 1,
    };
    onUpdateSite({
      ...site,
      rackAssemblyLines: [...(site.rackAssemblyLines || []), newLine],
    });
  };

  const handleUpdateRackAssemblyLine = (id: string, field: keyof RackAssemblyLine, value: any) => {
    const updated = (site.rackAssemblyLines || []).map((line) =>
      line.id === id ? { ...line, [field]: value } : line
    );
    onUpdateSite({ ...site, rackAssemblyLines: updated });
  };

  const handleDeleteRackAssemblyLine = (id: string) => {
    onUpdateSite({
      ...site,
      rackAssemblyLines: (site.rackAssemblyLines || []).filter((l) => l.id !== id),
    });
  };

  // Backward compatibility alias
  const handleAddAssemblyLine = handleAddCpuAssemblyLine;
  const handleUpdateAssemblyLine = handleUpdateCpuAssemblyLine;
  const handleDeleteAssemblyLine = handleDeleteCpuAssemblyLine;

  // Quality Control Items Resolution & Handlers
  const defaultQcItems: QualityControlItem[] = React.useMemo(() => {
    const pqcDL = site.qualityControl.pqcDL || 0;
    const pqcIDL =
      site.qualityControl.pqcIDL !== undefined
        ? site.qualityControl.pqcIDL
        : (site.qualityControl.pqcDayShift || 0) + (site.qualityControl.pqcNightShift || 0);
    const oqcDL = site.qualityControl.oqcStandardDL || site.qualityControl.oqcDL || 0;
    const oqcIDL = site.qualityControl.oqcIndirectIDL || site.qualityControl.oqcIDL || 0;

    return [
      {
        id: 'qc-item-1',
        name: 'PQC / SQC Process Audit (製程品質檢驗)',
        dl: pqcDL,
        idl: pqcIDL,
      },
      {
        id: 'qc-item-2',
        name: 'OQC Outgoing Inspection (出貨檢驗/抽檢)',
        dl: oqcDL,
        idl: oqcIDL,
      },
      {
        id: 'qc-item-3',
        name: 'IQC Incoming Inspection (進料檢驗/原物料品管)',
        dl: 0,
        idl: 0,
      },
      {
        id: 'qc-item-4',
        name: 'Reliability & ORT Lab (信賴性與可靠度實驗室)',
        dl: 0,
        idl: 0,
      },
    ];
  }, [
    site.qualityControl.pqcDL,
    site.qualityControl.pqcIDL,
    site.qualityControl.pqcDayShift,
    site.qualityControl.pqcNightShift,
    site.qualityControl.oqcStandardDL,
    site.qualityControl.oqcIndirectIDL,
    site.qualityControl.oqcDL,
    site.qualityControl.oqcIDL,
  ]);

  const qcItems: QualityControlItem[] = (site.qualityControl.items && site.qualityControl.items.length > 0)
    ? site.qualityControl.items
    : defaultQcItems;

  const handleAddQcItem = () => {
    setQcOpen(true);
    const currentItems = qcItems;
    const newItem: QualityControlItem = {
      id: `qc-${Date.now()}`,
      name: `QC Station ${currentItems.length + 1}`,
      dl: 4,
      idl: 1,
    };
    const updated = [...currentItems, newItem];
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      qualityControl: {
        ...site.qualityControl,
        items: updated,
        pqcDL: updated[0] ? Number(updated[0].dl) || 0 : 0,
        pqcIDL: updated[0] ? Number(updated[0].idl) || 0 : 0,
        oqcStandardDL: updated.slice(1).reduce((s, it) => s + (Number(it.dl) || 0), 0),
        oqcIndirectIDL: updated.slice(1).reduce((s, it) => s + (Number(it.idl) || 0), 0),
        oqcDL: newTotalDL,
        oqcIDL: newTotalIDL,
      },
    });
  };

  const handleUpdateQcItem = (id: string, field: keyof QualityControlItem, value: any) => {
    const currentItems = qcItems;
    const updated = currentItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'name' ? value : Math.max(0, Number(value) || 0),
        };
      }
      return item;
    });
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      qualityControl: {
        ...site.qualityControl,
        items: updated,
        pqcDL: updated[0] ? Number(updated[0].dl) || 0 : 0,
        pqcIDL: updated[0] ? Number(updated[0].idl) || 0 : 0,
        oqcStandardDL: updated.slice(1).reduce((s, it) => s + (Number(it.dl) || 0), 0),
        oqcIndirectIDL: updated.slice(1).reduce((s, it) => s + (Number(it.idl) || 0), 0),
        oqcDL: newTotalDL,
        oqcIDL: newTotalIDL,
      },
    });
  };

  const handleDeleteQcItem = (id: string) => {
    const currentItems = qcItems;
    const updated = currentItems.filter((item) => item.id !== id);
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      qualityControl: {
        ...site.qualityControl,
        items: updated,
        pqcDL: updated[0] ? Number(updated[0].dl) || 0 : 0,
        pqcIDL: updated[0] ? Number(updated[0].idl) || 0 : 0,
        oqcStandardDL: updated.slice(1).reduce((s, it) => s + (Number(it.dl) || 0), 0),
        oqcIndirectIDL: updated.slice(1).reduce((s, it) => s + (Number(it.idl) || 0), 0),
        oqcDL: newTotalDL,
        oqcIDL: newTotalIDL,
      },
    });
  };

  // Warehouse Items Resolution & Handlers
  const defaultWarehouseItems: WarehouseItem[] = React.useMemo(() => [
    {
      id: 'wh-item-1',
      name: 'Material Logistics (收發料/倉管)',
      dl: site.warehouse.logisticsDL || 0,
      idl: 0,
    },
    {
      id: 'wh-item-2',
      name: 'Inventory Control (物控/帳務)',
      dl: 0,
      idl: site.warehouse.adminIDL || 0,
    },
  ], [site.warehouse.logisticsDL, site.warehouse.adminIDL]);

  const warehouseItems: WarehouseItem[] = (site.warehouse.items && site.warehouse.items.length > 0)
    ? site.warehouse.items
    : defaultWarehouseItems;

  const handleAddWarehouseItem = () => {
    setWhOpen(true);
    const currentItems = warehouseItems;
    const newItem: WarehouseItem = {
      id: `wh-${Date.now()}`,
      name: `Warehouse Function ${currentItems.length + 1}`,
      dl: 4,
      idl: 1,
    };
    const updated = [...currentItems, newItem];
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      warehouse: {
        ...site.warehouse,
        items: updated,
        logisticsDL: newTotalDL,
        adminIDL: newTotalIDL,
      },
    });
  };

  const handleUpdateWarehouseItem = (id: string, field: keyof WarehouseItem, value: any) => {
    const currentItems = warehouseItems;
    const updated = currentItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'name' ? value : Math.max(0, Number(value) || 0),
        };
      }
      return item;
    });
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      warehouse: {
        ...site.warehouse,
        items: updated,
        logisticsDL: newTotalDL,
        adminIDL: newTotalIDL,
      },
    });
  };

  const handleDeleteWarehouseItem = (id: string) => {
    const currentItems = warehouseItems;
    const updated = currentItems.filter((item) => item.id !== id);
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      warehouse: {
        ...site.warehouse,
        items: updated,
        logisticsDL: newTotalDL,
        adminIDL: newTotalIDL,
      },
    });
  };

  // Trouble Shooting Items Resolution & Handlers
  const defaultTroubleshootingItems: TroubleshootingItem[] = React.useMemo(() => [
    {
      id: 'ts-item-1',
      name: 'Debug & Failure Analysis (Debug/FA)',
      dl: site.troubleShooting.dlEntry || 0,
      idl: 0,
    },
    {
      id: 'ts-item-2',
      name: 'BGA & Board Repair Cell (維修站/RMA)',
      dl: 0,
      idl: site.troubleShooting.idlEntry || 0,
    },
  ], [site.troubleShooting.dlEntry, site.troubleShooting.idlEntry]);

  const troubleshootingItems: TroubleshootingItem[] = (site.troubleShooting.items && site.troubleShooting.items.length > 0)
    ? site.troubleShooting.items
    : defaultTroubleshootingItems;

  const handleAddTroubleshootingItem = () => {
    setTsOpen(true);
    const currentItems = troubleshootingItems;
    const newItem: TroubleshootingItem = {
      id: `ts-${Date.now()}`,
      name: `Trouble Shooting Station ${currentItems.length + 1}`,
      dl: 4,
      idl: 1,
    };
    const updated = [...currentItems, newItem];
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      troubleShooting: {
        ...site.troubleShooting,
        items: updated,
        dlEntry: newTotalDL,
        idlEntry: newTotalIDL,
      },
    });
  };

  const handleUpdateTroubleshootingItem = (id: string, field: keyof TroubleshootingItem, value: any) => {
    const currentItems = troubleshootingItems;
    const updated = currentItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'name' ? value : Math.max(0, Number(value) || 0),
        };
      }
      return item;
    });
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      troubleShooting: {
        ...site.troubleShooting,
        items: updated,
        dlEntry: newTotalDL,
        idlEntry: newTotalIDL,
      },
    });
  };

  const handleDeleteTroubleshootingItem = (id: string) => {
    const currentItems = troubleshootingItems;
    const updated = currentItems.filter((item) => item.id !== id);
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      troubleShooting: {
        ...site.troubleShooting,
        items: updated,
        dlEntry: newTotalDL,
        idlEntry: newTotalIDL,
      },
    });
  };

  // Other Support Items Resolution & Handlers
  const defaultOtherSupportItems: OtherSupportItem[] = React.useMemo(() => [
    {
      id: 'oth-item-1',
      name: 'Plant Facility & Cleanroom Ops (廠務設施)',
      dl: site.otherSupport.dl ?? 0,
      idl: 0,
    },
    {
      id: 'oth-item-2',
      name: 'General Administration & Affairs (總務與廠區行政)',
      dl: 0,
      idl: site.otherSupport.generalIDL || 0,
    },
  ], [site.otherSupport.dl, site.otherSupport.generalIDL]);

  const otherSupportItems: OtherSupportItem[] = (site.otherSupport.items && site.otherSupport.items.length > 0)
    ? site.otherSupport.items
    : defaultOtherSupportItems;

  const handleAddOtherSupportItem = () => {
    setOtherSupportOpen(true);
    const currentItems = otherSupportItems;
    const newItem: OtherSupportItem = {
      id: `oth-${Date.now()}`,
      name: `Other Support Function ${currentItems.length + 1}`,
      dl: 2,
      idl: 2,
    };
    const updated = [...currentItems, newItem];
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      otherSupport: {
        ...site.otherSupport,
        items: updated,
        dl: newTotalDL,
        generalIDL: newTotalIDL,
      },
    });
  };

  const handleUpdateOtherSupportItem = (id: string, field: keyof OtherSupportItem, value: any) => {
    const currentItems = otherSupportItems;
    const updated = currentItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'name' ? value : Math.max(0, Number(value) || 0),
        };
      }
      return item;
    });
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      otherSupport: {
        ...site.otherSupport,
        items: updated,
        dl: newTotalDL,
        generalIDL: newTotalIDL,
      },
    });
  };

  const handleDeleteOtherSupportItem = (id: string) => {
    const currentItems = otherSupportItems;
    const updated = currentItems.filter((item) => item.id !== id);
    const newTotalDL = updated.reduce((sum, item) => sum + (Number(item.dl) || 0), 0);
    const newTotalIDL = updated.reduce((sum, item) => sum + (Number(item.idl) || 0), 0);
    onUpdateSite({
      ...site,
      otherSupport: {
        ...site.otherSupport,
        items: updated,
        dl: newTotalDL,
        generalIDL: newTotalIDL,
      },
    });
  };

  // Filtered lists
  const filteredSmtLines = (site.smtLines || []).filter((l) => l.category === smtCategoryFilter);
  const filteredPcaLines = (site.pcaLines || []).filter((l) => l.category === pcaCategoryFilter);

  return (
    <div className="space-y-6 pb-8">
      {/* ========================================================================= */}
      {/* 1. Historical Manpower Trend (Selected from Left Sidebar)                 */}
      {/* ========================================================================= */}
      {(ieStandardViewMode === 'historical_trend' || ieStandardViewMode === 'all') && (
        <IEHistoricalManpowerOverview site={site} onScrollToSegment={handleScrollToSegment} />
      )}

      {/* ========================================================================= */}
      {/* 2. 5 Functions & Configuration (Selected from Left Sidebar)               */}
      {/* ========================================================================= */}
      {(ieStandardViewMode === 'five_functions' || ieStandardViewMode === 'all') && (
        <div
          id="master-department-block"
          className="bg-[#1C1D22] border-2 border-[#ffb86b]/40 rounded-2xl overflow-hidden shadow-2xl space-y-0"
        >
        {/* Master Block Grand Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2c221a] via-[#1f1e24] to-[#1C1D22] border-b border-[#524437]/70">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ffb86b]/20 border border-[#ffb86b]/60 flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[#ffb86b] text-2xl">
                  domain
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#38bdf8] text-[#082f49] font-black text-[10px] rounded uppercase font-['JetBrains_Mono'] tracking-wider">
                    2. Right Menu
                  </span>
                  <span className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/70">
                    {site.name} ({site.code}) • {selectedYear} / Month {selectedMonth}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSetIeStandardViewMode('historical_trend')}
                    className="ml-1 px-2 py-0.5 bg-[#141518] hover:bg-[#202127] border border-[#ffb86b]/40 hover:border-[#ffb86b] text-[#ffb86b] rounded text-[11px] font-['JetBrains_Mono'] flex items-center gap-1 transition-all"
                    title="Switch to 1. Historical Manpower Trend"
                  >
                    <span className="material-symbols-outlined text-xs">arrow_back</span>
                    <span>1. Historical Trend</span>
                  </button>
                </div>
                <h3 className="font-['Inter'] text-lg sm:text-xl font-bold text-[#e5e1e6] mt-0.5">
                  Function Configuration
                </h3>
              </div>
            </div>

            {/* Full Plant Overview KPI Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="px-3 py-1.5 bg-[#131316] rounded-lg border border-[#524437]/50 flex items-center gap-1.5" title="Manufacturing Online DL - Links to APS Demand (scales with line shifts)">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70">Online DL:</span>
                <span className="text-xs font-['JetBrains_Mono'] font-bold text-[#e5e1e6]">
                  {totalMfgOnlineDL} DL
                </span>
              </div>
              <div className="px-3 py-1.5 bg-[#131316] rounded-lg border border-[#524437]/50 flex items-center gap-1.5" title="Total Plant Offline DL - Links to APS Demand (scales with production capacity)">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70">Offline DL:</span>
                <span className="text-xs font-['JetBrains_Mono'] font-bold text-[#ffb86b]">
                  {totalMfgOfflineDL + qcTotalDL + tsTotalDL + whTotalDL + otherTotalDL} DL
                </span>
              </div>
              <div className="px-3.5 py-1.5 bg-[#ffb86b]/15 rounded-lg border border-[#ffb86b]/40 flex items-center gap-2" title="Total Plant Direct Labor (DL) - Capacity Variable in APS Demand">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#ffb86b] font-medium">TOTAL DL:</span>
                <span className="text-sm font-['JetBrains_Mono'] font-extrabold text-[#ffb86b]">
                  {plantGrandTotalDL} DL
                </span>
              </div>
              <div className="px-3 py-1.5 bg-[#131316] rounded-lg border border-[#5de6ff]/30 flex items-center gap-2" title="Total Plant Indirect Labor (IDL) - Fixed Standard in APS Demand (Constant)">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#5de6ff]">TOTAL IDL:</span>
                <span className="text-xs font-['JetBrains_Mono'] font-bold text-[#5de6ff]">
                  {plantGrandTotalIDL} IDL
                </span>
              </div>
              <div className="px-3.5 py-1.5 bg-[#4edea3]/15 rounded-lg border border-[#4edea3]/40 flex items-center gap-2" title="Total Plant Headcount (HC) = DL + IDL">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#4edea3] font-medium">TOTAL HC:</span>
                <span className="text-sm font-['JetBrains_Mono'] font-extrabold text-[#4edea3]">
                  {plantGrandTotal} HC
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-[#141518] border-b border-[#524437]/60 overflow-x-auto text-xs font-['JetBrains_Mono']">
          <span className="text-[#d7c3b2]/50 text-[11px] uppercase mr-1 hidden sm:inline">CATEGORY:</span>
          <button
            onClick={() => setActiveDeptTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeDeptTab === 'all'
                ? 'bg-[#ffb86b] text-[#331c00] shadow-md'
                : 'bg-[#1C1D22] text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#26272e] border border-[#524437]/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">view_agenda</span>
            <span>All Departments Overview</span>
          </button>

          <button
            onClick={() => setActiveDeptTab('mfg')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeDeptTab === 'mfg'
                ? 'bg-[#ffb86b] text-[#331c00] shadow-md'
                : 'bg-[#1C1D22] text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#26272e] border border-[#524437]/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
            <span>MANUFACTURING (MFG)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeDeptTab === 'mfg' ? 'bg-[#331c00]/20 text-[#331c00]' : 'bg-[#ffb86b]/15 text-[#ffb86b]'
            }`}>
              {totalMfgDL} DL
            </span>
          </button>

          <button
            onClick={() => setActiveDeptTab('qc')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeDeptTab === 'qc'
                ? 'bg-[#38bdf8] text-[#082f49] shadow-md'
                : 'bg-[#1C1D22] text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#26272e] border border-[#524437]/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>QUALITY CONTROL (QC)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeDeptTab === 'qc' ? 'bg-[#082f49]/20 text-[#082f49]' : 'bg-[#38bdf8]/15 text-[#38bdf8]'
            }`}>
              {qcTotalDL} DL
            </span>
          </button>

          <button
            onClick={() => setActiveDeptTab('ts')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeDeptTab === 'ts'
                ? 'bg-[#4edea3] text-[#052e16] shadow-md'
                : 'bg-[#1C1D22] text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#26272e] border border-[#524437]/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">build</span>
            <span>TROUBLE SHOOTING (TS)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeDeptTab === 'ts' ? 'bg-[#052e16]/20 text-[#052e16]' : 'bg-[#4edea3]/15 text-[#4edea3]'
            }`}>
              {tsTotalDL} DL
            </span>
          </button>

          <button
            onClick={() => setActiveDeptTab('wh')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeDeptTab === 'wh'
                ? 'bg-[#c084fc] text-[#3b0764] shadow-md'
                : 'bg-[#1C1D22] text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#26272e] border border-[#524437]/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            <span>WAREHOUSE LOGISTICS (WH)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeDeptTab === 'wh' ? 'bg-[#3b0764]/20 text-[#3b0764]' : 'bg-[#c084fc]/15 text-[#c084fc]'
            }`}>
              {whTotalDL} DL
            </span>
          </button>

          <button
            onClick={() => setActiveDeptTab('other')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeDeptTab === 'other'
                ? 'bg-[#f472b6] text-[#4c0519] shadow-md'
                : 'bg-[#1C1D22] text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#26272e] border border-[#524437]/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">support_agent</span>
            <span>OTHER SUPPORT (OTH)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeDeptTab === 'other' ? 'bg-[#4c0519]/20 text-[#4c0519]' : 'bg-[#f472b6]/15 text-[#f472b6]'
            }`}>
              {otherTotalDL} DL
            </span>
          </button>
        </div>

        {/* Master Content Body */}
        <div className="p-4 sm:p-6 space-y-6 bg-[#16171b]/60">
          {/* Section 0: Monthly 5 Departments DL & IDL Baseline Maintenance Center */}
          {activeDeptTab === 'all' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffb86b] text-lg">calendar_month</span>
                  <h4 className="font-['Inter'] text-sm sm:text-base font-bold text-[#e5e1e6]">
                    Baseline Maintenance
                  </h4>
                </div>
                <button
                  onClick={() => setBaselineOpen(!baselineOpen)}
                  className="flex items-center gap-1 text-xs text-[#d7c3b2]/70 hover:text-[#ffb86b] font-['JetBrains_Mono'] transition-colors"
                >
                  <span>{baselineOpen ? 'Collapse Baseline Panel' : 'Expand Baseline Panel'}</span>
                  <span className={`material-symbols-outlined text-sm transition-transform ${baselineOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>
              {baselineOpen && (
                <FiveDepartmentMonthlyMaintenance
                  site={site}
                  onUpdateSite={parentOnUpdateSite}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onChangeMonth={onChangeMonth}
                  currentUser={currentUser}
                />
              )}
            </div>
          )}

          {/* Section 1: Manufacturing Segment Deep Dive Container */}
          {(activeDeptTab === 'all' || activeDeptTab === 'mfg') && (
            <div id="segment-manufacturing" className="bg-[#1C1D22] border-2 border-[#ffb86b]/40 rounded-xl overflow-hidden shadow-lg">
        {/* Manufacturing Segment Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2a231d] via-[#1f1e24] to-[#1C1D22] border-b border-[#524437]/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ffb86b]/20 border border-[#ffb86b]/50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#ffb86b] text-2xl">
                  precision_manufacturing
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#ffb86b] text-[#331c00] font-black text-[10px] rounded uppercase font-['JetBrains_Mono'] tracking-wider">
                    Core Segment
                  </span>
                  <h3 className="font-['Inter'] text-xl font-bold text-[#e5e1e6]">
                    MANUFACTURING
                  </h3>
                  {!mfgOpen && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/40">
                      Collapsed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Manufacturing Overview Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-3 py-1.5 bg-[#131316] rounded-lg border border-[#524437]/50 flex items-center gap-2">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70">MFG Online DL:</span>
                <span className="text-xs font-['JetBrains_Mono'] font-bold text-[#e5e1e6]">
                  {totalMfgOnlineDL} DL
                </span>
              </div>
              <div className="px-3 py-1.5 bg-[#131316] rounded-lg border border-[#524437]/50 flex items-center gap-2">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70">MFG Offline DL:</span>
                <span className="text-xs font-['JetBrains_Mono'] font-bold text-[#ffb86b]">
                  {totalMfgOfflineDL} DL
                </span>
              </div>
              <div className="px-3.5 py-1.5 bg-[#ffb86b]/15 rounded-lg border border-[#ffb86b]/40 flex items-center gap-2">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#ffb86b] font-medium">TOTAL MFG DL:</span>
                <span className="text-sm font-['JetBrains_Mono'] font-extrabold text-[#ffb86b]">
                  {totalMfgDL} DL
                </span>
              </div>
              <div className="px-3 py-1.5 bg-[#131316] rounded-lg border border-[#5de6ff]/30 flex items-center gap-2">
                <span className="text-[11px] font-['JetBrains_Mono'] text-[#5de6ff]">MFG IDL:</span>
                <span className="text-xs font-['JetBrains_Mono'] font-bold text-[#5de6ff]">
                  {totalMfgIDL} IDL
                </span>
              </div>

              {mfgOpen && (
                <button
                  id="btn-toggle-all-mfg-subsegments"
                  onClick={() => {
                    const anyOpen = smtOpen || pcaOpen || assyOpen;
                    setSmtOpen(!anyOpen);
                    setPcaOpen(!anyOpen);
                    setAssyOpen(!anyOpen);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-['JetBrains_Mono'] rounded-md bg-[#131316] hover:bg-[#201f23] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                  title={smtOpen || pcaOpen || assyOpen ? "Collapse All Lines (SMT, PCA, System Assembly)" : "Expand All Lines (SMT, PCA, System Assembly)"}
                >
                  {smtOpen || pcaOpen || assyOpen ? 'Collapse All Lines' : 'Expand All Lines'}
                </button>
              )}

              <button
                id="btn-toggle-mfg-segment"
                onClick={() => setMfgOpen(!mfgOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#131316] hover:bg-[#201f23] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 text-xs font-['JetBrains_Mono'] cursor-pointer shadow-sm active:scale-95"
                title={mfgOpen ? "Collapse Manufacturing" : "Expand Manufacturing"}
                aria-expanded={mfgOpen}
              >
                <span className="text-[11px] font-semibold">{mfgOpen ? 'Collapse' : 'Expand'}</span>
                <span
                  className={`material-symbols-outlined text-base transition-transform duration-200 block ${
                    mfgOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
            </div>
          </div>
        </div>

        {mfgOpen && (
          <div className="p-4 sm:p-6 space-y-8">
            {/* ------------------------------------------------------------- */}
            {/* SUB-SECTION 1: SMT (Surface Mount Technology)                 */}
            {/* ------------------------------------------------------------- */}
            <div
              id="subsegment-smt"
              className="bg-[#17181c] border border-[#524437]/50 rounded-lg p-4 sm:p-5"
            >
              {/* SMT Section Title Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#524437]/30">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#ffb86b]/15 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#ffb86b] text-sm">memory</span>
                    </div>
                    <h4 className="font-['Inter'] text-base font-bold text-[#e5e1e6]">
                      SMT
                    </h4>
                    {!smtOpen && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/40">
                        Collapsed
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-[#d7c3b2]/80 font-['JetBrains_Mono'] tracking-wide pl-8">
                    Online: {smtOnlineDL} + Offline: {smtOfflineDL} = Total {smtTotalDL} DL
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Cost Center multi-select picker */}
                  <CostCenterMultiPicker
                    id="input-smt-cost-center"
                    departmentName="SMT"
                    value={site.smtCostCenter}
                    onChange={handleSmtCostCenterChange}
                    hrPresets={SMT_HR_PRESETS}
                    placeholder="e.g. CC-SMT-7102"
                    disabled={!hasEditPermission}
                  />

                  {/* Parallel Offline DL */}
                  <div className={`flex items-center h-[34px] box-border gap-1.5 bg-[#131316] px-2.5 rounded-md border transition-colors shrink-0 ${
                    hasEditPermission ? 'border-[#524437]/40 hover:border-[#ffb86b]/60' : 'border-[#524437]/20 opacity-70'
                  }`}>
                    <label className="font-['JetBrains_Mono'] text-[10px] text-[#ffb86b] font-semibold uppercase whitespace-nowrap flex items-center gap-1 leading-none">
                      <span className="material-symbols-outlined text-[13px] text-[#ffb86b] leading-none">engineering</span>
                      Offline DL:
                    </label>
                    <input
                      id="input-smt-offline-dl"
                      type="number"
                      min="0"
                      disabled={!hasEditPermission}
                      value={site.smtOfflineDL ?? 0}
                      onChange={(e) => handleSmtOfflineChange(Math.max(0, Number(e.target.value)))}
                      className={`w-14 h-6 px-1.5 rounded text-center text-xs font-bold text-[#ffb86b] font-['JetBrains_Mono'] focus:outline-none leading-none ${
                        hasEditPermission ? 'bg-[#201f23] border border-[#ffb86b]/40 focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-75'
                      }`}
                      title={hasEditPermission ? "SMT Department Independent Offline DL pool" : `Read-Only: Requires ${site.code} IE permission`}
                    />
                  </div>

                  {/* Parallel SMT IDL */}
                  <div className={`flex items-center h-[34px] box-border gap-1.5 bg-[#131316] px-2.5 rounded-md border transition-colors shrink-0 ${
                    hasEditPermission ? 'border-[#524437]/40 hover:border-[#5de6ff]/60' : 'border-[#524437]/20 opacity-70'
                  }`}>
                    <label className="font-['JetBrains_Mono'] text-[10px] text-[#5de6ff] font-semibold uppercase whitespace-nowrap flex items-center gap-1 leading-none">
                      <span className="material-symbols-outlined text-[13px] text-[#5de6ff] leading-none">support_agent</span>
                      SMT IDL:
                    </label>
                    <input
                      id="input-smt-idl"
                      type="number"
                      min="0"
                      disabled={!hasEditPermission}
                      value={site.smtIdl ?? 0}
                      onChange={(e) => handleSmtIdlChange(Math.max(0, Number(e.target.value)))}
                      className={`w-14 h-6 px-1.5 rounded text-center text-xs font-bold text-[#5de6ff] font-['JetBrains_Mono'] focus:outline-none leading-none ${
                        hasEditPermission ? 'bg-[#201f23] border border-[#5de6ff]/40 focus:border-[#5de6ff]' : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-75'
                      }`}
                      title={hasEditPermission ? "SMT Segment Indirect Labor" : `Read-Only: Requires ${site.code} IE permission`}
                    />
                  </div>

                  {/* Collapse / Expand toggle button for SMT */}
                  <button
                    id="btn-toggle-smt"
                    onClick={() => setSmtOpen(!smtOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#131316] hover:bg-[#201f23] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 text-xs font-['JetBrains_Mono'] cursor-pointer shadow-sm active:scale-95"
                    title={smtOpen ? "Collapse SMT" : "Expand SMT"}
                    aria-expanded={smtOpen}
                  >
                    <span className="text-[11px] font-semibold">{smtOpen ? 'Collapse' : 'Expand'}</span>
                    <span
                      className={`material-symbols-outlined text-base transition-transform duration-200 block ${
                        smtOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                </div>
              </div>

              {smtOpen && (
                <>
                  {/* SMT Line Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-[#131316] p-1 rounded-md border border-[#524437]/30">
                    <button
                      id="btn-smt-cat-mb"
                      onClick={() => setSmtCategoryFilter('MB')}
                      className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-medium transition-all ${
                        smtCategoryFilter === 'MB'
                          ? 'bg-[#ffb86b] text-[#492900] font-bold shadow'
                          : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                      }`}
                    >
                      MB (Motherboard)
                    </button>
                    <button
                      id="btn-smt-cat-sc"
                      onClick={() => setSmtCategoryFilter('SC')}
                      className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-medium transition-all ${
                        smtCategoryFilter === 'SC'
                          ? 'bg-[#ffb86b] text-[#492900] font-bold shadow'
                          : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                      }`}
                    >
                      SC (Small-card)
                    </button>
                  </div>

                  <button
                    id="btn-add-smt-line"
                    onClick={handleAddSmtLine}
                    disabled={!hasEditPermission}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors text-xs font-['JetBrains_Mono'] font-bold ${
                      hasEditPermission
                        ? 'bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 cursor-pointer'
                        : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                    }`}
                    title={hasEditPermission ? "Add SMT Line" : `Read-Only: Only ${site.code} IE can add lines`}
                  >
                    <span className="material-symbols-outlined text-sm">{hasEditPermission ? 'add_circle' : 'lock'}</span>
                    <span>ADD SMT LINE</span>
                  </button>
                </div>

                <div className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/70">
                  Showing {filteredSmtLines.length} SMT Lines in {smtCategoryFilter} category
                </div>
              </div>

              {/* SMT Table */}
              <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#131316]">
                <table className="w-full text-left font-['Inter'] text-xs">
                  <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3 border-b border-[#524437]/40">LINE NAME</th>
                      <th className="p-3 border-b border-[#524437]/40 text-center w-36">
                        SHIFTS
                      </th>
                      <th className="p-3 border-b border-[#524437]/40 text-right w-44">
                        ONLINE STD DL / SHIFT
                      </th>
                      <th className="p-3 border-b border-[#524437]/40 text-right w-40 text-[#ffb86b]">
                        TOTAL LINE ONLINE DL
                      </th>
                      <th className="p-3 border-b border-[#524437]/40 text-center w-16">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSmtLines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-[#d7c3b2]/50 italic">
                          No SMT lines configured for {smtCategoryFilter} category. Click "ADD SMT LINE" to create.
                        </td>
                      </tr>
                    ) : (
                      filteredSmtLines.map((line) => {
                        const shiftCount = typeof line.shift === 'number' ? line.shift : 1;
                        const lineTotal = (line.onlineStdDL || 0) * shiftCount;

                        return (
                          <tr
                            key={line.id}
                            className="hover:bg-[#1c1b1f] border-b border-[#524437]/20 transition-colors"
                          >
                            <td className="p-2.5">
                              <input
                                type="text"
                                disabled={!hasEditPermission}
                                value={line.name}
                                onChange={(e) => handleUpdateSmtLine(line.id, 'name', e.target.value)}
                                className={`data-table-input data-table-input-left font-semibold font-['JetBrains_Mono'] ${
                                  hasEditPermission ? 'text-[#e5e1e6]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                }`}
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <select
                                disabled={!hasEditPermission}
                                value={shiftCount}
                                onChange={(e) =>
                                  handleUpdateSmtLine(line.id, 'shift', Number(e.target.value) as ShiftNumber)
                                }
                                className={`px-3 py-1.5 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none text-center ${
                                  hasEditPermission
                                    ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]'
                                    : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                }`}
                                title={hasEditPermission ? "Select shifts" : `Read-Only: Only ${site.code} IE can change shifts`}
                              >
                                <option value={0}>0 Shifts (Offline)</option>
                                <option value={1}>1 Shift</option>
                                <option value={2}>2 Shifts</option>
                                <option value={3}>3 Shifts</option>
                                <option value={4}>4 Shifts</option>
                              </select>
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                disabled={!hasEditPermission}
                                value={line.onlineStdDL}
                                onChange={(e) =>
                                  handleUpdateSmtLine(line.id, 'onlineStdDL', Math.max(0, Number(e.target.value)))
                                }
                                className={`data-table-input text-right font-['JetBrains_Mono'] ${
                                  hasEditPermission ? 'text-[#e5e1e6]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                }`}
                                title={hasEditPermission ? "Standard DL" : `Read-Only: Only ${site.code} IE can modify manpower`}
                              />
                            </td>
                            <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b] text-sm">
                              {lineTotal} DL
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleDeleteSmtLine(line.id)}
                                disabled={!hasEditPermission}
                                className={`p-1.5 transition-colors rounded ${
                                  hasEditPermission
                                    ? 'text-[#d7c3b2]/50 hover:text-[#F43F5E] hover:bg-[#2a1b22] cursor-pointer'
                                    : 'text-[#d7c3b2]/20 cursor-not-allowed'
                                }`}
                                title={hasEditPermission ? "Delete line" : "Read-Only: No delete permission"}
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
                </>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SUB-SECTION 2: PCA (Printed Circuit Assembly / Board Test)   */}
            {/* ------------------------------------------------------------- */}
            <div
              id="subsegment-pca"
              className="bg-[#17181c] border border-[#524437]/50 rounded-lg p-4 sm:p-5"
            >
              {/* PCA Section Title Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#524437]/30">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#ffb86b]/15 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#ffb86b] text-sm">developer_board</span>
                    </div>
                    <h4 className="font-['Inter'] text-base font-bold text-[#e5e1e6]">
                      PCA
                    </h4>
                    {!pcaOpen && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/40">
                        Collapsed
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-[#d7c3b2]/80 font-['JetBrains_Mono'] tracking-wide pl-8">
                    Online: {pcaOnlineDL} + Offline: {pcaOfflineDL} = Total {pcaTotalDL} DL
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Cost Center multi-select picker */}
                  <CostCenterMultiPicker
                    id="input-pca-cost-center"
                    departmentName="PCA"
                    value={site.pcaCostCenter}
                    onChange={handlePcaCostCenterChange}
                    hrPresets={PCA_HR_PRESETS}
                    placeholder="e.g. CC-PCA-7105"
                    disabled={!hasEditPermission}
                  />

                  {/* Parallel Offline DL */}
                  <div className={`flex items-center h-[34px] box-border gap-1.5 bg-[#131316] px-2.5 rounded-md border transition-colors shrink-0 ${
                    hasEditPermission ? 'border-[#524437]/40 hover:border-[#ffb86b]/60' : 'border-[#524437]/20 opacity-70'
                  }`}>
                    <label className="font-['JetBrains_Mono'] text-[10px] text-[#ffb86b] font-semibold uppercase whitespace-nowrap flex items-center gap-1 leading-none">
                      <span className="material-symbols-outlined text-[13px] text-[#ffb86b] leading-none">engineering</span>
                      Offline DL:
                    </label>
                    <input
                      id="input-pca-offline-dl"
                      type="number"
                      min="0"
                      disabled={!hasEditPermission}
                      value={site.pcaOfflineDL ?? 0}
                      onChange={(e) => handlePcaOfflineChange(Math.max(0, Number(e.target.value)))}
                      className={`w-14 h-6 px-1.5 rounded text-center text-xs font-bold text-[#ffb86b] font-['JetBrains_Mono'] focus:outline-none leading-none ${
                        hasEditPermission ? 'bg-[#201f23] border border-[#ffb86b]/40 focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-75'
                      }`}
                      title={hasEditPermission ? "PCA Department Independent Offline DL pool" : `Read-Only: Requires ${site.code} IE permission`}
                    />
                  </div>

                  {/* Parallel PCA IDL */}
                  <div className={`flex items-center h-[34px] box-border gap-1.5 bg-[#131316] px-2.5 rounded-md border transition-colors shrink-0 ${
                    hasEditPermission ? 'border-[#524437]/40 hover:border-[#5de6ff]/60' : 'border-[#524437]/20 opacity-70'
                  }`}>
                    <label className="font-['JetBrains_Mono'] text-[10px] text-[#5de6ff] font-semibold uppercase whitespace-nowrap flex items-center gap-1 leading-none">
                      <span className="material-symbols-outlined text-[13px] text-[#5de6ff] leading-none">support_agent</span>
                      PCA IDL:
                    </label>
                    <input
                      id="input-pca-idl"
                      type="number"
                      min="0"
                      disabled={!hasEditPermission}
                      value={site.pcaIdl ?? 0}
                      onChange={(e) => handlePcaIdlChange(Math.max(0, Number(e.target.value)))}
                      className={`w-14 h-6 px-1.5 rounded text-center text-xs font-bold text-[#5de6ff] font-['JetBrains_Mono'] focus:outline-none leading-none ${
                        hasEditPermission ? 'bg-[#201f23] border border-[#5de6ff]/40 focus:border-[#5de6ff]' : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-75'
                      }`}
                      title={hasEditPermission ? "PCA Segment Indirect Labor" : `Read-Only: Requires ${site.code} IE permission`}
                    />
                  </div>

                  {/* Collapse / Expand toggle button for PCA */}
                  <button
                    id="btn-toggle-pca"
                    onClick={() => setPcaOpen(!pcaOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#131316] hover:bg-[#201f23] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 text-xs font-['JetBrains_Mono'] cursor-pointer shadow-sm active:scale-95"
                    title={pcaOpen ? "Collapse PCA" : "Expand PCA"}
                    aria-expanded={pcaOpen}
                  >
                    <span className="text-[11px] font-semibold">{pcaOpen ? 'Collapse' : 'Expand'}</span>
                    <span
                      className={`material-symbols-outlined text-base transition-transform duration-200 block ${
                        pcaOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                </div>
              </div>

              {pcaOpen && (
                <>
                  {/* PCA Line Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-[#131316] p-1 rounded-md border border-[#524437]/30">
                    <button
                      id="btn-pca-cat-mb"
                      onClick={() => setPcaCategoryFilter('MB')}
                      className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-medium transition-all ${
                        pcaCategoryFilter === 'MB'
                          ? 'bg-[#ffb86b] text-[#492900] font-bold shadow'
                          : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                      }`}
                    >
                      MB (Motherboard)
                    </button>
                    <button
                      id="btn-pca-cat-sc"
                      onClick={() => setPcaCategoryFilter('SC')}
                      className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-medium transition-all ${
                        pcaCategoryFilter === 'SC'
                          ? 'bg-[#ffb86b] text-[#492900] font-bold shadow'
                          : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                      }`}
                    >
                      SC (Small-card)
                    </button>
                  </div>

                  <button
                    id="btn-add-pca-line"
                    onClick={handleAddPcaLine}
                    disabled={!hasEditPermission}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors text-xs font-['JetBrains_Mono'] font-bold ${
                      hasEditPermission
                        ? 'bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 cursor-pointer'
                        : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                    }`}
                    title={hasEditPermission ? "Add PCA Line" : `Read-Only: Only ${site.code} IE can add lines`}
                  >
                    <span className="material-symbols-outlined text-sm">{hasEditPermission ? 'add_circle' : 'lock'}</span>
                    <span>ADD PCA LINE</span>
                  </button>
                </div>

                <div className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/70">
                  Each station (FA, Test, Packing) has independent Shift configuration
                </div>
              </div>

              {/* PCA Table with Station Shifts */}
              <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#131316]">
                <table className="w-full text-left font-['Inter'] text-xs">
                  <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3 border-b border-[#524437]/40 min-w-[140px]">LINE NAME</th>
                      <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                        FA (DL × SHIFT)
                      </th>
                      <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                        TEST (DL × SHIFT)
                      </th>
                      <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                        PACKING (DL × SHIFT)
                      </th>
                      <th className="p-3 border-b border-[#524437]/40 text-right w-36 text-[#ffb86b]">
                        TOTAL LINE DL
                      </th>
                      <th className="p-3 border-b border-[#524437]/40 text-center w-14">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPcaLines.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-[#d7c3b2]/50 italic">
                          No PCA lines configured for {pcaCategoryFilter} category. Click "ADD PCA LINE" to create.
                        </td>
                      </tr>
                    ) : (
                      filteredPcaLines.map((line) => {
                        const faShifts = typeof line.faShift === 'number' ? line.faShift : 1;
                        const testShifts = typeof line.testShift === 'number' ? line.testShift : 1;
                        const packShifts = typeof line.packingShift === 'number' ? line.packingShift : 1;
                        const lineTotal =
                          (line.faStdDL || 0) * faShifts +
                          (line.testStdDL || 0) * testShifts +
                          (line.packingStdDL || 0) * packShifts;

                        return (
                          <tr
                            key={line.id}
                            className="hover:bg-[#1c1b1f] border-b border-[#524437]/20 transition-colors"
                          >
                            <td className="p-2.5">
                              <input
                                type="text"
                                disabled={!hasEditPermission}
                                value={line.name}
                                onChange={(e) => handleUpdatePcaLine(line.id, 'name', e.target.value)}
                                className={`data-table-input data-table-input-left font-semibold font-['JetBrains_Mono'] ${
                                  hasEditPermission ? 'text-[#e5e1e6]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                }`}
                              />
                            </td>

                            {/* FA Station: DL & Shift */}
                            <td className="p-2.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!hasEditPermission}
                                  value={line.faStdDL}
                                  onChange={(e) =>
                                    handleUpdatePcaLine(line.id, 'faStdDL', Math.max(0, Number(e.target.value)))
                                  }
                                  className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                    hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "FA Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                />
                                <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                <select
                                  disabled={!hasEditPermission}
                                  value={faShifts}
                                  onChange={(e) =>
                                    handleUpdatePcaLine(line.id, 'faShift', Number(e.target.value) as ShiftNumber)
                                  }
                                  className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                    hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "FA Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                >
                                  <option value={0}>0S</option>
                                  <option value={1}>1S</option>
                                  <option value={2}>2S</option>
                                  <option value={3}>3S</option>
                                  <option value={4}>4S</option>
                                </select>
                              </div>
                            </td>

                            {/* TEST Station: DL & Shift */}
                            <td className="p-2.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!hasEditPermission}
                                  value={line.testStdDL}
                                  onChange={(e) =>
                                    handleUpdatePcaLine(line.id, 'testStdDL', Math.max(0, Number(e.target.value)))
                                  }
                                  className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                    hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "Test Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                />
                                <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                <select
                                  disabled={!hasEditPermission}
                                  value={testShifts}
                                  onChange={(e) =>
                                    handleUpdatePcaLine(line.id, 'testShift', Number(e.target.value) as ShiftNumber)
                                  }
                                  className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                    hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "Test Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                >
                                  <option value={0}>0S</option>
                                  <option value={1}>1S</option>
                                  <option value={2}>2S</option>
                                  <option value={3}>3S</option>
                                  <option value={4}>4S</option>
                                </select>
                              </div>
                            </td>

                            {/* PACKING Station: DL & Shift */}
                            <td className="p-2.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!hasEditPermission}
                                  value={line.packingStdDL}
                                  onChange={(e) =>
                                    handleUpdatePcaLine(line.id, 'packingStdDL', Math.max(0, Number(e.target.value)))
                                  }
                                  className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                    hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "Packing Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                />
                                <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                <select
                                  disabled={!hasEditPermission}
                                  value={packShifts}
                                  onChange={(e) =>
                                    handleUpdatePcaLine(line.id, 'packingShift', Number(e.target.value) as ShiftNumber)
                                  }
                                  className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                    hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "Packing Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                >
                                  <option value={0}>0S</option>
                                  <option value={1}>1S</option>
                                  <option value={2}>2S</option>
                                  <option value={3}>3S</option>
                                  <option value={4}>4S</option>
                                </select>
                              </div>
                            </td>

                            <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b] text-sm">
                              {lineTotal} DL
                            </td>

                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleDeletePcaLine(line.id)}
                                disabled={!hasEditPermission}
                                className={`p-1.5 transition-colors rounded ${
                                  hasEditPermission
                                    ? 'text-[#d7c3b2]/50 hover:text-[#F43F5E] hover:bg-[#2a1b22] cursor-pointer'
                                    : 'text-[#d7c3b2]/20 cursor-not-allowed'
                                }`}
                                title={hasEditPermission ? "Delete line" : "Read-Only: No delete permission"}
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
                </>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SUB-SECTION 3: SYSTEM ASSEMBLY (CPU / Server Chassis)        */}
            {/* ------------------------------------------------------------- */}
            <div
              id="subsegment-system-assembly"
              className="bg-[#17181c] border border-[#524437]/50 rounded-lg p-4 sm:p-5"
            >
              {/* Assembly Section Title Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#524437]/30">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#ffb86b]/15 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#ffb86b] text-sm">
                        settings_suggest
                      </span>
                    </div>
                    <h4 className="font-['Inter'] text-base font-bold text-[#e5e1e6]">
                      System Assembly
                    </h4>
                    {!assyOpen && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/40">
                        Collapsed
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-[#d7c3b2]/80 font-['JetBrains_Mono'] tracking-wide pl-8">
                    Online: {assyOnlineDL} DL (CPU: {cpuAssyOnlineDL} + Rack: {rackAssyOnlineDL}) + Offline: {assyOfflineDL} = Total {assyTotalDL} DL
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Cost Center multi-select picker */}
                  <CostCenterMultiPicker
                    id="input-assembly-cost-center"
                    departmentName="System Assembly"
                    value={site.assemblyCostCenter}
                    onChange={handleAssemblyCostCenterChange}
                    hrPresets={ASSEMBLY_HR_PRESETS}
                    placeholder="e.g. CC-SYS-7110"
                    disabled={!hasEditPermission}
                  />

                  {/* Parallel Offline DL */}
                  <div className={`flex items-center h-[34px] box-border gap-1.5 bg-[#131316] px-2.5 rounded-md border transition-colors shrink-0 ${
                    hasEditPermission ? 'border-[#524437]/40 hover:border-[#ffb86b]/60' : 'border-[#524437]/20 opacity-70'
                  }`}>
                    <label className="font-['JetBrains_Mono'] text-[10px] text-[#ffb86b] font-semibold uppercase whitespace-nowrap flex items-center gap-1 leading-none">
                      <span className="material-symbols-outlined text-[13px] text-[#ffb86b] leading-none">engineering</span>
                      Offline DL:
                    </label>
                    <input
                      id="input-assembly-offline-dl"
                      type="number"
                      min="0"
                      disabled={!hasEditPermission}
                      value={site.assemblyOfflineDL ?? 0}
                      onChange={(e) => handleAssemblyOfflineChange(Math.max(0, Number(e.target.value)))}
                      className={`w-14 h-6 px-1.5 rounded text-center text-xs font-bold text-[#ffb86b] font-['JetBrains_Mono'] focus:outline-none leading-none ${
                        hasEditPermission ? 'bg-[#201f23] border border-[#ffb86b]/40 focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-75'
                      }`}
                      title={hasEditPermission ? "System Assembly Independent Offline DL pool" : `Read-Only: Requires ${site.code} IE permission`}
                    />
                  </div>

                  {/* Parallel ASSY IDL */}
                  <div className={`flex items-center h-[34px] box-border gap-1.5 bg-[#131316] px-2.5 rounded-md border transition-colors shrink-0 ${
                    hasEditPermission ? 'border-[#524437]/40 hover:border-[#5de6ff]/60' : 'border-[#524437]/20 opacity-70'
                  }`}>
                    <label className="font-['JetBrains_Mono'] text-[10px] text-[#5de6ff] font-semibold uppercase whitespace-nowrap flex items-center gap-1 leading-none">
                      <span className="material-symbols-outlined text-[13px] text-[#5de6ff] leading-none">support_agent</span>
                      ASSY IDL:
                    </label>
                    <input
                      id="input-assembly-idl"
                      type="number"
                      min="0"
                      disabled={!hasEditPermission}
                      value={site.assemblyIdl ?? 0}
                      onChange={(e) => handleAssemblyIdlChange(Math.max(0, Number(e.target.value)))}
                      className={`w-14 h-6 px-1.5 rounded text-center text-xs font-bold text-[#5de6ff] font-['JetBrains_Mono'] focus:outline-none leading-none ${
                        hasEditPermission ? 'bg-[#201f23] border border-[#5de6ff]/40 focus:border-[#5de6ff]' : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-75'
                      }`}
                      title={hasEditPermission ? "Assembly Segment Indirect Labor" : `Read-Only: Requires ${site.code} IE permission`}
                    />
                  </div>

                  {/* Collapse / Expand toggle button for System Assembly */}
                  <button
                    id="btn-toggle-assembly"
                    onClick={() => setAssyOpen(!assyOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#131316] hover:bg-[#201f23] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 text-xs font-['JetBrains_Mono'] cursor-pointer shadow-sm active:scale-95"
                    title={assyOpen ? "Collapse System Assembly" : "Expand System Assembly"}
                    aria-expanded={assyOpen}
                  >
                    <span className="text-[11px] font-semibold">{assyOpen ? 'Collapse' : 'Expand'}</span>
                    <span
                      className={`material-symbols-outlined text-base transition-transform duration-200 block ${
                        assyOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                </div>
              </div>

              {assyOpen && (
                <>
                  {/* System Assembly Line Controls Bar (Referencing PCA MB/SC Selector) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-[#131316] p-1 rounded-md border border-[#524437]/30">
                    <button
                      id="btn-assembly-cat-cpu"
                      onClick={() => setAssemblyCategoryFilter('CPU')}
                      className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-medium transition-all flex items-center gap-1.5 ${
                        assemblyCategoryFilter === 'CPU'
                          ? 'bg-[#ffb86b] text-[#492900] font-bold shadow'
                          : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">memory</span>
                      <span>CPU (CPU Assembly)</span>
                    </button>
                    <button
                      id="btn-assembly-cat-rack"
                      onClick={() => setAssemblyCategoryFilter('RACK')}
                      className={`px-3 py-1 text-xs font-['JetBrains_Mono'] rounded font-medium transition-all flex items-center gap-1.5 ${
                        assemblyCategoryFilter === 'RACK'
                          ? 'bg-[#ffb86b] text-[#492900] font-bold shadow'
                          : 'text-[#d7c3b2]/70 hover:text-[#e5e1e6]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">dns</span>
                      <span>RACK (Rack Assembly)</span>
                    </button>
                  </div>

                  {assemblyCategoryFilter === 'CPU' ? (
                    <button
                      id="btn-add-cpu-assembly-line"
                      onClick={handleAddCpuAssemblyLine}
                      disabled={!hasEditPermission}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors text-xs font-['JetBrains_Mono'] font-bold ${
                        hasEditPermission
                          ? 'bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 cursor-pointer'
                          : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                      }`}
                      title={hasEditPermission ? "Add CPU Assembly Line" : `Read-Only: Only ${site.code} IE can add lines`}
                    >
                      <span className="material-symbols-outlined text-sm">{hasEditPermission ? 'add_circle' : 'lock'}</span>
                      <span>ADD CPU LINE</span>
                    </button>
                  ) : (
                    <button
                      id="btn-add-rack-assembly-line"
                      onClick={handleAddRackAssemblyLine}
                      disabled={!hasEditPermission}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors text-xs font-['JetBrains_Mono'] font-bold ${
                        hasEditPermission
                          ? 'bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 cursor-pointer'
                          : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                      }`}
                      title={hasEditPermission ? "Add Rack Assembly Line" : `Read-Only: Only ${site.code} IE can add lines`}
                    >
                      <span className="material-symbols-outlined text-sm">{hasEditPermission ? 'add_circle' : 'lock'}</span>
                      <span>ADD RACK LINE</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {assemblyCategoryFilter === 'CPU' ? (
                    <span className="font-['JetBrains_Mono'] text-[11px] font-bold px-2 py-0.5 rounded bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/30">
                      {(site.cpuAssemblyLines || []).length} Lines • Online: {cpuAssyOnlineDL} DL
                    </span>
                  ) : (
                    <span className="font-['JetBrains_Mono'] text-[11px] font-bold px-2 py-0.5 rounded bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/30">
                      {(site.rackAssemblyLines || []).length} Lines • Online: {rackAssyOnlineDL} DL
                    </span>
                  )}
                  <span className="hidden md:inline text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/60">
                    Stations split into ASSY / TEST / PACKING with independent DL & Shift (S)
                  </span>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* BLOCK 1: CPU ASSEMBLY                                        */}
              {/* ------------------------------------------------------------- */}
              <div
                id="block-cpu-assembly"
                className={`transition-all ${
                  assemblyCategoryFilter === 'CPU' ? 'block' : 'hidden'
                }`}
              >
                {/* CPU Assembly Table */}
                <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#131316]">
                  <table id="table-cpu-assembly" className="w-full text-left font-['Inter'] text-xs">
                    <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 border-b border-[#524437]/40 min-w-[140px]">LINE NAME</th>
                        <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                          ASSY (DL × SHIFT)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                          TEST (DL × SHIFT)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                          PACKING (DL × SHIFT)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-right w-36 text-[#ffb86b]">
                          TOTAL LINE DL
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-center w-14">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(site.cpuAssemblyLines || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-[#d7c3b2]/50 italic">
                            No CPU Assembly lines configured. Click "ADD CPU LINE" to create.
                          </td>
                        </tr>
                      ) : (
                        (site.cpuAssemblyLines || []).map((line) => {
                          const assyShifts = typeof line.assyShift === 'number' ? line.assyShift : 1;
                          const testShifts = typeof line.testShift === 'number' ? line.testShift : 1;
                          const packShifts = typeof line.packShift === 'number' ? line.packShift : 1;
                          const lineTotal =
                            (line.assyDL || 0) * assyShifts +
                            (line.testDL || 0) * testShifts +
                            (line.packDL || 0) * packShifts;

                          return (
                            <tr
                              key={line.id}
                              className="hover:bg-[#1c1b1f] border-b border-[#524437]/20 transition-colors"
                            >
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  disabled={!hasEditPermission}
                                  value={line.name}
                                  onChange={(e) => handleUpdateCpuAssemblyLine(line.id, 'name', e.target.value)}
                                  className={`data-table-input data-table-input-left font-semibold font-['JetBrains_Mono'] ${
                                    hasEditPermission ? 'text-[#e5e1e6]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                  }`}
                                />
                              </td>

                              {/* ASSY Station: DL & Shift */}
                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={!hasEditPermission}
                                    value={line.assyDL}
                                    onChange={(e) =>
                                      handleUpdateCpuAssemblyLine(line.id, 'assyDL', Math.max(0, Number(e.target.value)))
                                    }
                                    className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Assembly Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                  />
                                  <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                  <select
                                    disabled={!hasEditPermission}
                                    value={assyShifts}
                                    onChange={(e) =>
                                      handleUpdateCpuAssemblyLine(line.id, 'assyShift', Number(e.target.value) as ShiftNumber)
                                    }
                                    className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Assembly Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                  >
                                    <option value={0}>0S</option>
                                    <option value={1}>1S</option>
                                    <option value={2}>2S</option>
                                    <option value={3}>3S</option>
                                    <option value={4}>4S</option>
                                  </select>
                                </div>
                              </td>

                              {/* TEST Station: DL & Shift */}
                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={!hasEditPermission}
                                    value={line.testDL}
                                    onChange={(e) =>
                                      handleUpdateCpuAssemblyLine(line.id, 'testDL', Math.max(0, Number(e.target.value)))
                                    }
                                    className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Test Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                  />
                                  <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                  <select
                                    disabled={!hasEditPermission}
                                    value={testShifts}
                                    onChange={(e) =>
                                      handleUpdateCpuAssemblyLine(line.id, 'testShift', Number(e.target.value) as ShiftNumber)
                                    }
                                    className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Test Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                  >
                                    <option value={0}>0S</option>
                                    <option value={1}>1S</option>
                                    <option value={2}>2S</option>
                                    <option value={3}>3S</option>
                                    <option value={4}>4S</option>
                                  </select>
                                </div>
                              </td>

                              {/* PACK Station: DL & Shift */}
                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={!hasEditPermission}
                                    value={line.packDL}
                                    onChange={(e) =>
                                      handleUpdateCpuAssemblyLine(line.id, 'packDL', Math.max(0, Number(e.target.value)))
                                    }
                                    className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Packing Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                  />
                                  <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                  <select
                                    disabled={!hasEditPermission}
                                    value={packShifts}
                                    onChange={(e) =>
                                      handleUpdateCpuAssemblyLine(line.id, 'packShift', Number(e.target.value) as ShiftNumber)
                                    }
                                    className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Packing Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                  >
                                    <option value={0}>0S</option>
                                    <option value={1}>1S</option>
                                    <option value={2}>2S</option>
                                    <option value={3}>3S</option>
                                    <option value={4}>4S</option>
                                  </select>
                                </div>
                              </td>

                              <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b] text-sm">
                                {lineTotal} DL
                              </td>

                              <td className="p-2.5 text-center">
                                <button
                                  onClick={() => handleDeleteCpuAssemblyLine(line.id)}
                                  disabled={!hasEditPermission}
                                  className={`p-1.5 transition-colors rounded ${
                                    hasEditPermission
                                      ? 'text-[#d7c3b2]/50 hover:text-[#F43F5E] hover:bg-[#2a1b22] cursor-pointer'
                                      : 'text-[#d7c3b2]/20 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "Delete line" : "Read-Only: No delete permission"}
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {(site.cpuAssemblyLines || []).length > 0 && (
                      <tfoot className="bg-[#18181c] border-t border-[#524437]/40 font-['JetBrains_Mono'] text-xs">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right text-[#d7c3b2]/70 font-semibold">
                            CPU Assembly Subtotal Online DL:
                          </td>
                          <td className="p-2.5 text-right font-bold text-[#ffb86b] text-sm">
                            {cpuAssyOnlineDL} DL
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* BLOCK 2: RACK ASSEMBLY                                       */}
              {/* ------------------------------------------------------------- */}
              <div
                id="block-rack-assembly"
                className={`transition-all ${
                  assemblyCategoryFilter === 'RACK' ? 'block' : 'hidden'
                }`}
              >
                {/* Rack Assembly Table */}
                <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#131316]">
                  <table id="table-rack-assembly" className="w-full text-left font-['Inter'] text-xs">
                    <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 border-b border-[#524437]/40 min-w-[140px]">LINE NAME</th>
                        <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                          ASSY (DL × SHIFT)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                          TEST (DL × SHIFT)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-center min-w-[170px]">
                          PACKING (DL × SHIFT)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-right w-36 text-[#ffb86b]">
                          TOTAL LINE DL
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-center w-14">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(site.rackAssemblyLines || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-[#d7c3b2]/50 italic">
                            No Rack Assembly lines configured. Click "ADD RACK LINE" to create.
                          </td>
                        </tr>
                      ) : (
                        (site.rackAssemblyLines || []).map((line) => {
                          const assyShifts = typeof line.assyShift === 'number' ? line.assyShift : 1;
                          const testShifts = typeof line.testShift === 'number' ? line.testShift : 1;
                          const packShifts = typeof line.packShift === 'number' ? line.packShift : 1;
                          const lineTotal =
                            (line.assyDL || 0) * assyShifts +
                            (line.testDL || 0) * testShifts +
                            (line.packDL || 0) * packShifts;

                          return (
                            <tr
                              key={line.id}
                              className="hover:bg-[#1c1b1f] border-b border-[#524437]/20 transition-colors"
                            >
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  disabled={!hasEditPermission}
                                  value={line.name}
                                  onChange={(e) => handleUpdateRackAssemblyLine(line.id, 'name', e.target.value)}
                                  className={`data-table-input data-table-input-left font-semibold font-['JetBrains_Mono'] ${
                                    hasEditPermission ? 'text-[#e5e1e6]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                  }`}
                                />
                              </td>

                              {/* ASSY Station: DL & Shift */}
                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={!hasEditPermission}
                                    value={line.assyDL}
                                    onChange={(e) =>
                                      handleUpdateRackAssemblyLine(line.id, 'assyDL', Math.max(0, Number(e.target.value)))
                                    }
                                    className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Assembly Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                  />
                                  <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                  <select
                                    disabled={!hasEditPermission}
                                    value={assyShifts}
                                    onChange={(e) =>
                                      handleUpdateRackAssemblyLine(line.id, 'assyShift', Number(e.target.value) as ShiftNumber)
                                    }
                                    className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Assembly Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                  >
                                    <option value={0}>0S</option>
                                    <option value={1}>1S</option>
                                    <option value={2}>2S</option>
                                    <option value={3}>3S</option>
                                    <option value={4}>4S</option>
                                  </select>
                                </div>
                              </td>

                              {/* TEST Station: DL & Shift */}
                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={!hasEditPermission}
                                    value={line.testDL}
                                    onChange={(e) =>
                                      handleUpdateRackAssemblyLine(line.id, 'testDL', Math.max(0, Number(e.target.value)))
                                    }
                                    className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Test Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                  />
                                  <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                  <select
                                    disabled={!hasEditPermission}
                                    value={testShifts}
                                    onChange={(e) =>
                                      handleUpdateRackAssemblyLine(line.id, 'testShift', Number(e.target.value) as ShiftNumber)
                                    }
                                    className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Test Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                  >
                                    <option value={0}>0S</option>
                                    <option value={1}>1S</option>
                                    <option value={2}>2S</option>
                                    <option value={3}>3S</option>
                                    <option value={4}>4S</option>
                                  </select>
                                </div>
                              </td>

                              {/* PACK Station: DL & Shift */}
                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={!hasEditPermission}
                                    value={line.packDL}
                                    onChange={(e) =>
                                      handleUpdateRackAssemblyLine(line.id, 'packDL', Math.max(0, Number(e.target.value)))
                                    }
                                    className={`w-14 px-2 py-1 rounded text-right text-xs font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#e5e1e6] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/60 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Packing Standard DL per shift" : `Read-Only: Requires ${site.code} IE permission`}
                                  />
                                  <span className="text-[#d7c3b2]/60 text-[11px] font-['JetBrains_Mono']">×</span>
                                  <select
                                    disabled={!hasEditPermission}
                                    value={packShifts}
                                    onChange={(e) =>
                                      handleUpdateRackAssemblyLine(line.id, 'packShift', Number(e.target.value) as ShiftNumber)
                                    }
                                    className={`px-2 py-1 rounded text-xs font-bold font-['JetBrains_Mono'] focus:outline-none ${
                                      hasEditPermission ? 'bg-[#201f23] border border-[#524437] text-[#ffb86b] focus:border-[#ffb86b]' : 'bg-[#17171a] border border-[#524437]/30 text-[#d7c3b2]/50 cursor-not-allowed'
                                    }`}
                                    title={hasEditPermission ? "Packing Shift count (0 to 4)" : `Read-Only: Requires ${site.code} IE permission`}
                                  >
                                    <option value={0}>0S</option>
                                    <option value={1}>1S</option>
                                    <option value={2}>2S</option>
                                    <option value={3}>3S</option>
                                    <option value={4}>4S</option>
                                  </select>
                                </div>
                              </td>

                              <td className="p-2.5 text-right font-['JetBrains_Mono'] font-bold text-[#ffb86b] text-sm">
                                {lineTotal} DL
                              </td>

                              <td className="p-2.5 text-center">
                                <button
                                  onClick={() => handleDeleteRackAssemblyLine(line.id)}
                                  disabled={!hasEditPermission}
                                  className={`p-1.5 transition-colors rounded ${
                                    hasEditPermission
                                      ? 'text-[#d7c3b2]/50 hover:text-[#F43F5E] hover:bg-[#2a1b22] cursor-pointer'
                                      : 'text-[#d7c3b2]/20 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "Delete line" : "Read-Only: No delete permission"}
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {(site.rackAssemblyLines || []).length > 0 && (
                      <tfoot className="bg-[#18181c] border-t border-[#524437]/40 font-['JetBrains_Mono'] text-xs">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right text-[#d7c3b2]/70 font-semibold">
                            Rack Assembly Subtotal Online DL:
                          </td>
                          <td className="p-2.5 text-right font-bold text-[#ffb86b] text-sm">
                            {rackAssyOnlineDL} DL
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
                </>
              )}
            </div>
          </div>
        )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* Section 2: QUALITY CONTROL SEGMENT                                       */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* Section 2: QUALITY CONTROL SEGMENT                                       */}
          {/* ========================================================================= */}
          {(activeDeptTab === 'all' || activeDeptTab === 'qc') && (
            <div id="segment-quality-control" className="bg-[#1C1D22] border border-[#524437]/60 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#524437]/30">
                <div
                  onClick={() => setQcOpen(!qcOpen)}
                  className="flex items-center gap-2.5 cursor-pointer select-none group"
                  title={qcOpen ? "Click to collapse Quality Control" : "Click to expand Quality Control"}
                >
                  <span className="material-symbols-outlined text-[#ffb86b] text-xl group-hover:scale-110 transition-transform">
                    verified_user
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-['Inter'] text-base sm:text-lg font-semibold text-[#e5e1e6] group-hover:text-[#ffb86b] transition-colors">
                        QUALITY CONTROL (QC)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                        {qcItems.length} Stations
                      </span>
                      {!qcOpen && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/40">
                          Collapsed
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#d7c3b2]/70 font-['JetBrains_Mono'] mt-0.5">
                      DL Total: <strong className="text-[#e5e1e6]">{qcTotalDL}</strong> DL • IDL Total: <strong className="text-[#5de6ff]">{qcTotalIDL}</strong> IDL
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <CostCenterMultiPicker
                    id="input-qc-cost-center"
                    departmentName="Quality Control"
                    value={site.qualityControl.costCenter || site.qualityControl.pqcCostCenter}
                    onChange={(val) =>
                      onUpdateSite({
                        ...site,
                        qualityControl: {
                          ...site.qualityControl,
                          costCenter: val,
                        },
                      })
                    }
                    hrPresets={QC_HR_PRESETS}
                    placeholder="e.g. CC-QC-7201"
                    disabled={!hasEditPermission}
                  />

                  {qcOpen && (
                    <button
                      id="btn-add-qc-item"
                      onClick={handleAddQcItem}
                      disabled={!hasEditPermission}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-['JetBrains_Mono'] font-bold ${
                        hasEditPermission
                          ? 'bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 cursor-pointer shadow-sm active:scale-95'
                          : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                      }`}
                      title={hasEditPermission ? "Add Quality Control Item / Station" : `Read-Only: Only ${site.code} IE can add items`}
                    >
                      <span className="material-symbols-outlined text-sm">{hasEditPermission ? 'add_circle' : 'lock'}</span>
                      <span>ADD QC STATION</span>
                    </button>
                  )}

                  <button
                    id="btn-toggle-qc"
                    onClick={() => setQcOpen(!qcOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#131316] hover:bg-[#201f23] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 text-xs font-['JetBrains_Mono'] cursor-pointer shadow-sm active:scale-95"
                    title={qcOpen ? "Collapse Quality Control" : "Expand Quality Control"}
                    aria-expanded={qcOpen}
                  >
                    <span className="text-[11px] font-semibold">{qcOpen ? 'Collapse' : 'Expand'}</span>
                    <span
                      className={`material-symbols-outlined text-base transition-transform duration-200 block ${
                        qcOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                </div>
              </div>

              {/* Quality Control Functions Table */}
              {qcOpen && (
                <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#131316]">
                  <table className="w-full text-left font-['Inter'] text-xs">
                    <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 border-b border-[#524437]/40">QUALITY CONTROL STATION / FUNCTION NAME</th>
                        <th className="p-3 border-b border-[#524437]/40 text-right w-44">
                          DIRECT LABOR (DL)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-right w-44 text-[#5de6ff]">
                          INDIRECT LABOR (IDL)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-right w-40 text-[#4edea3]">
                          TOTAL (DL+IDL)
                        </th>
                        <th className="p-3 border-b border-[#524437]/40 text-center w-20">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#524437]/30 font-['JetBrains_Mono']">
                      {qcItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-[#d7c3b2]/50 italic">
                            No quality control stations configured. Click "ADD QC STATION" to add a new function.
                          </td>
                        </tr>
                      ) : (
                        qcItems.map((item, idx) => {
                          const rowDL = Number(item.dl) || 0;
                          const rowIDL = Number(item.idl) || 0;
                          const rowTotal = rowDL + rowIDL;

                          return (
                            <tr
                              key={item.id || `qc-${idx}`}
                              className="hover:bg-[#1c1b1f] transition-colors"
                            >
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  disabled={!hasEditPermission}
                                  value={item.name}
                                  placeholder="e.g. PQC Process Audit, OQC Outgoing, IQC, Reliability Lab"
                                  onChange={(e) => handleUpdateQcItem(item.id, 'name', e.target.value)}
                                  className={`data-table-input data-table-input-left font-semibold font-['JetBrains_Mono'] w-full ${
                                    hasEditPermission ? 'text-[#e5e1e6] focus:border-[#ffb86b]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                  }`}
                                  title={hasEditPermission ? "Station Name" : `Read-Only: Requires ${site.code} IE permission`}
                                />
                              </td>
                              <td className="p-2.5 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!hasEditPermission}
                                  value={item.dl}
                                  onChange={(e) => handleUpdateQcItem(item.id, 'dl', e.target.value)}
                                  className={`data-table-input font-bold text-[#ffb86b] w-28 text-right font-['JetBrains_Mono'] ${
                                    hasEditPermission ? 'focus:border-[#ffb86b]' : 'cursor-not-allowed opacity-80'
                                  }`}
                                  title={hasEditPermission ? "Direct Labor (DL)" : `Read-Only: Requires ${site.code} IE permission`}
                                />
                              </td>
                              <td className="p-2.5 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!hasEditPermission}
                                  value={item.idl}
                                  onChange={(e) => handleUpdateQcItem(item.id, 'idl', e.target.value)}
                                  className={`data-table-input font-bold text-[#5de6ff] w-28 text-right font-['JetBrains_Mono'] ${
                                    hasEditPermission ? 'focus:border-[#5de6ff]' : 'cursor-not-allowed opacity-80'
                                  }`}
                                  title={hasEditPermission ? "Indirect Labor (IDL)" : `Read-Only: Requires ${site.code} IE permission`}
                                />
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#4edea3] text-sm">
                                {rowTotal}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  onClick={() => handleDeleteQcItem(item.id)}
                                  disabled={!hasEditPermission}
                                  className={`p-1.5 transition-colors rounded ${
                                    hasEditPermission
                                      ? 'text-[#d7c3b2]/50 hover:text-[#F43F5E] hover:bg-[#2a1b22] cursor-pointer'
                                      : 'text-[#d7c3b2]/20 cursor-not-allowed'
                                  }`}
                                  title={hasEditPermission ? "Delete station" : "Read-Only: No delete permission"}
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {qcItems.length > 0 && (
                      <tfoot className="bg-[#18181c] border-t border-[#524437]/50 font-['JetBrains_Mono'] text-xs font-semibold">
                        <tr>
                          <td className="p-3 text-[#d7c3b2]/80">
                            Quality Control Subtotal ({qcItems.length} Stations):
                          </td>
                          <td className="p-3 text-right text-[#ffb86b] font-bold text-sm">
                            {qcTotalDL} DL
                          </td>
                          <td className="p-3 text-right text-[#5de6ff] font-bold text-sm">
                            {qcTotalIDL} IDL
                          </td>
                          <td className="p-3 text-right text-[#4edea3] font-bold text-sm">
                            {qcTotalDL + qcTotalIDL}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* Section 3-5: SUPPORT DEPARTMENTS (Trouble Shooting, Warehouse, Other)    */}
          {/* ========================================================================= */}
          {(activeDeptTab === 'all' || activeDeptTab === 'ts' || activeDeptTab === 'wh' || activeDeptTab === 'other') && (
            <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#524437]/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#ffb86b]/20 border border-[#ffb86b]/40 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#ffb86b] text-xl">contact_support</span>
                  </div>
                  <div>
                    <h4 className="font-['Inter'] text-base font-bold text-[#e5e1e6]">
                      SUPPORT DEPARTMENTS MAINTENANCE
                    </h4>
                    <p className="text-xs text-[#d7c3b2]/70 font-['Inter']">
                      Trouble Shooting • Warehouse Logistics • Other Support
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-['JetBrains_Mono'] px-2.5 py-1 rounded bg-[#131316] text-[#d7c3b2]/90 border border-[#524437]/40">
                    Support Total: <strong className="text-[#ffb86b]">{tsTotalDL + whTotalDL + otherTotalDL} DL</strong> • <strong className="text-[#5de6ff]">{tsTotalIDL + whTotalIDL + otherTotalIDL} IDL</strong>
                  </span>
                  <button
                    onClick={() => {
                      const allOpen = tsOpen && whOpen && otherSupportOpen;
                      setTsOpen(!allOpen);
                      setWhOpen(!allOpen);
                      setOtherSupportOpen(!allOpen);
                    }}
                    className="text-xs font-['JetBrains_Mono'] px-2.5 py-1 rounded bg-[#131316] hover:bg-[#201f23] text-[#d7c3b2] hover:text-[#ffb86b] border border-[#524437]/40 transition-colors flex items-center gap-1 cursor-pointer"
                    title={tsOpen && whOpen && otherSupportOpen ? "Collapse All Support Departments" : "Expand All Support Departments"}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {tsOpen && whOpen && otherSupportOpen ? 'unfold_less' : 'unfold_more'}
                    </span>
                    <span>{tsOpen && whOpen && otherSupportOpen ? 'Collapse All' : 'Expand All'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Trouble Shooting */}
                {(activeDeptTab === 'all' || activeDeptTab === 'ts') && (
                  <div id="segment-troubleshooting" className="bg-[#131316] border border-[#524437]/50 rounded-xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#524437]/30">
                      <div
                        onClick={() => setTsOpen(!tsOpen)}
                        className="flex items-center gap-2.5 cursor-pointer select-none group"
                        title={tsOpen ? "Click to collapse Trouble Shooting" : "Click to expand Trouble Shooting"}
                      >
                        <span className="material-symbols-outlined text-[#ffb86b] text-xl group-hover:scale-110 transition-transform">
                          build
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-['Inter'] text-base font-semibold text-[#e5e1e6] group-hover:text-[#ffb86b] transition-colors">
                              Trouble Shooting
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                              {troubleshootingItems.length} Functions
                            </span>
                            {!tsOpen && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium bg-[#ffb86b]/15 text-[#ffb86b] border border-[#ffb86b]/40">
                                Collapsed
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#d7c3b2]/70 font-['JetBrains_Mono'] mt-0.5">
                            DL Total: <strong className="text-[#e5e1e6]">{tsTotalDL}</strong> DL • IDL Total: <strong className="text-[#5de6ff]">{tsTotalIDL}</strong> IDL
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <CostCenterMultiPicker
                          id="input-troubleshooting-cost-center"
                          departmentName="Trouble Shooting"
                          value={site.troubleShooting.costCenter}
                          onChange={(val) =>
                            onUpdateSite({
                              ...site,
                              troubleShooting: {
                                ...site.troubleShooting,
                                costCenter: val,
                              },
                            })
                          }
                          hrPresets={TROUBLESHOOTING_HR_PRESETS}
                          placeholder="e.g. CC-TS-7301"
                          disabled={!hasEditPermission}
                        />

                        {tsOpen && (
                          <button
                            id="btn-add-troubleshooting-item"
                            onClick={handleAddTroubleshootingItem}
                            disabled={!hasEditPermission}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-['JetBrains_Mono'] font-bold ${
                              hasEditPermission
                                ? 'bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 cursor-pointer shadow-sm active:scale-95'
                                : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                            }`}
                            title={hasEditPermission ? "Add Trouble Shooting Item / Station" : `Read-Only: Only ${site.code} IE can add items`}
                          >
                            <span className="material-symbols-outlined text-sm">{hasEditPermission ? 'add_circle' : 'lock'}</span>
                            <span>ADD TROUBLE SHOOTING ITEM</span>
                          </button>
                        )}

                        <button
                          id="btn-toggle-troubleshooting"
                          onClick={() => setTsOpen(!tsOpen)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1f1e24] hover:bg-[#2a2930] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 text-xs font-['JetBrains_Mono'] cursor-pointer shadow-sm active:scale-95"
                          title={tsOpen ? "Collapse Trouble Shooting" : "Expand Trouble Shooting"}
                          aria-expanded={tsOpen}
                        >
                          <span className="text-[11px] font-semibold">{tsOpen ? 'Collapse' : 'Expand'}</span>
                          <span
                            className={`material-symbols-outlined text-base transition-transform duration-200 block ${
                              tsOpen ? 'rotate-180' : ''
                            }`}
                          >
                            expand_more
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Trouble Shooting Functions Table */}
                    {tsOpen && (
                      <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#131316]">
                        <table className="w-full text-left font-['Inter'] text-xs">
                          <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="p-3 border-b border-[#524437]/40">TROUBLE SHOOTING FUNCTION / STATION NAME</th>
                              <th className="p-3 border-b border-[#524437]/40 text-right w-44">
                                DIRECT LABOR (DL)
                              </th>
                              <th className="p-3 border-b border-[#524437]/40 text-right w-44 text-[#5de6ff]">
                                INDIRECT LABOR (IDL)
                              </th>
                              <th className="p-3 border-b border-[#524437]/40 text-right w-40 text-[#4edea3]">
                                TOTAL (DL+IDL)
                              </th>
                              <th className="p-3 border-b border-[#524437]/40 text-center w-20">ACTION</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#524437]/30 font-['JetBrains_Mono']">
                            {troubleshootingItems.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-[#d7c3b2]/50 italic">
                                  No trouble shooting stations configured. Click "ADD TROUBLE SHOOTING ITEM" to add a new function.
                                </td>
                              </tr>
                            ) : (
                              troubleshootingItems.map((item, idx) => {
                                const rowDL = Number(item.dl) || 0;
                                const rowIDL = Number(item.idl) || 0;
                                const rowTotal = rowDL + rowIDL;

                                return (
                                  <tr
                                    key={item.id || `ts-${idx}`}
                                    className="hover:bg-[#1c1b1f] transition-colors"
                                  >
                                    <td className="p-2.5">
                                      <input
                                        type="text"
                                        disabled={!hasEditPermission}
                                        value={item.name}
                                        placeholder="e.g. Debug & FA, Board Repair, Diagnostic Lab"
                                        onChange={(e) => handleUpdateTroubleshootingItem(item.id, 'name', e.target.value)}
                                        className={`data-table-input data-table-input-left font-semibold font-['JetBrains_Mono'] w-full ${
                                          hasEditPermission ? 'text-[#e5e1e6] focus:border-[#ffb86b]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                        }`}
                                      />
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <input
                                          type="number"
                                          min={0}
                                          disabled={!hasEditPermission}
                                          value={item.dl}
                                          onChange={(e) => handleUpdateTroubleshootingItem(item.id, 'dl', e.target.value)}
                                          className={`data-table-input text-right font-bold font-['JetBrains_Mono'] w-28 ${
                                            hasEditPermission ? 'text-[#e5e1e6] focus:border-[#ffb86b]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                          }`}
                                        />
                                        <span className="text-[11px] text-[#d7c3b2]/60">DL</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <input
                                          type="number"
                                          min={0}
                                          disabled={!hasEditPermission}
                                          value={item.idl}
                                          onChange={(e) => handleUpdateTroubleshootingItem(item.id, 'idl', e.target.value)}
                                          className={`data-table-input text-right font-bold font-['JetBrains_Mono'] text-[#5de6ff] w-28 ${
                                            hasEditPermission ? 'focus:border-[#5de6ff]' : 'cursor-not-allowed opacity-80'
                                          }`}
                                        />
                                        <span className="text-[11px] text-[#5de6ff]/70">IDL</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-sm text-[#4edea3]">
                                      {rowTotal} <span className="text-xs text-[#d7c3b2]/60 font-normal">HC</span>
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <button
                                        disabled={!hasEditPermission || troubleshootingItems.length <= 1}
                                        onClick={() => handleDeleteTroubleshootingItem(item.id)}
                                        className={`p-1 rounded transition-colors ${
                                          hasEditPermission && troubleshootingItems.length > 1
                                            ? 'text-[#ff6b6b]/80 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/15 cursor-pointer'
                                            : 'text-[#d7c3b2]/30 cursor-not-allowed'
                                        }`}
                                        title={
                                          !hasEditPermission
                                            ? 'Read-only mode'
                                            : troubleshootingItems.length <= 1
                                            ? 'At least one troubleshooting station must remain'
                                            : `Delete ${item.name}`
                                        }
                                      >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          {/* Summary Footer */}
                          <tfoot className="bg-[#17181c] border-t-2 border-[#524437]/60 font-['JetBrains_Mono'] text-xs font-bold">
                            <tr>
                              <td className="p-3 text-[#ffb86b] flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">summarize</span>
                                <span>Trouble Shooting Total Standard Manpower:</span>
                              </td>
                              <td className="p-3 text-right text-[#e5e1e6]">
                                {tsTotalDL} <span className="text-[10px] text-[#d7c3b2]/60 font-normal">DL</span>
                              </td>
                              <td className="p-3 text-right text-[#5de6ff]">
                                {tsTotalIDL} <span className="text-[10px] text-[#5de6ff]/70 font-normal">IDL</span>
                              </td>
                              <td className="p-3 text-right text-[#4edea3] text-sm font-extrabold">
                                {tsTotalDL + tsTotalIDL} <span className="text-[10px] text-[#4edea3]/80 font-normal">HC</span>
                              </td>
                              <td className="p-3 text-center text-[#d7c3b2]/50 text-[10px]">
                                SYNCED
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

      {/* Warehouse */}
      {(activeDeptTab === 'all' || activeDeptTab === 'wh') && (
        <div id="segment-warehouse" className="bg-[#131316] border border-[#524437]/50 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#524437]/30">
            <div
              onClick={() => setWhOpen(!whOpen)}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              title={whOpen ? "Click to collapse Warehouse Logistic" : "Click to expand Warehouse Logistic"}
            >
              <span className="material-symbols-outlined text-[#ffb86b] text-xl group-hover:scale-110 transition-transform">
                inventory_2
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Inter'] text-base font-semibold text-[#e5e1e6] group-hover:text-[#ffb86b] transition-colors">
                    Warehouse Logistic
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#c084fc]/15 text-[#c084fc] border border-[#c084fc]/30">
                    {warehouseItems.length} Functions
                  </span>
                  {!whOpen && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium bg-[#c084fc]/20 text-[#c084fc] border border-[#c084fc]/40">
                      Collapsed
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#d7c3b2]/70 font-['JetBrains_Mono'] mt-0.5">
                  DL Total: <strong className="text-[#e5e1e6]">{whTotalDL}</strong> DL • IDL Total: <strong className="text-[#5de6ff]">{whTotalIDL}</strong> IDL
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <CostCenterMultiPicker
                id="input-warehouse-cost-center"
                departmentName="Warehouse Logistic"
                value={site.warehouse.costCenter}
                onChange={(val) =>
                  onUpdateSite({
                    ...site,
                    warehouse: {
                      ...site.warehouse,
                      costCenter: val,
                    },
                  })
                }
                hrPresets={WAREHOUSE_HR_PRESETS}
                placeholder="e.g. CC-WH-7401"
                disabled={!hasEditPermission}
              />

              {whOpen && (
                <button
                  id="btn-add-warehouse-item"
                  onClick={handleAddWarehouseItem}
                  disabled={!hasEditPermission}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-['JetBrains_Mono'] font-bold ${
                    hasEditPermission
                      ? 'bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 cursor-pointer shadow-sm active:scale-95'
                      : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                  }`}
                  title={hasEditPermission ? "Add Warehouse Item / Function" : `Read-Only: Only ${site.code} IE can add items`}
                >
                  <span className="material-symbols-outlined text-sm">{hasEditPermission ? 'add_circle' : 'lock'}</span>
                  <span>ADD WAREHOUSE ITEM</span>
                </button>
              )}

              <button
                id="btn-toggle-warehouse"
                onClick={() => setWhOpen(!whOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1f1e24] hover:bg-[#2a2930] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 text-xs font-['JetBrains_Mono'] cursor-pointer shadow-sm active:scale-95"
                title={whOpen ? "Collapse Warehouse Logistic" : "Expand Warehouse Logistic"}
                aria-expanded={whOpen}
              >
                <span className="text-[11px] font-semibold">{whOpen ? 'Collapse' : 'Expand'}</span>
                <span
                  className={`material-symbols-outlined text-base transition-transform duration-200 block ${
                    whOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
            </div>
          </div>

          {/* Warehouse Functions Table */}
          {whOpen && (
            <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#131316]">
              <table className="w-full text-left font-['Inter'] text-xs">
                <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 border-b border-[#524437]/40">WAREHOUSE FUNCTION / LINE NAME</th>
                    <th className="p-3 border-b border-[#524437]/40 text-right w-44">
                      DIRECT LABOR (DL)
                    </th>
                    <th className="p-3 border-b border-[#524437]/40 text-right w-44 text-[#5de6ff]">
                      INDIRECT LABOR (IDL)
                    </th>
                    <th className="p-3 border-b border-[#524437]/40 text-right w-40 text-[#4edea3]">
                      TOTAL (DL+IDL)
                    </th>
                    <th className="p-3 border-b border-[#524437]/40 text-center w-20">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#524437]/30 font-['JetBrains_Mono']">
                  {warehouseItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#d7c3b2]/50 italic">
                        No warehouse functions configured. Click "ADD WAREHOUSE ITEM" to add a new function.
                      </td>
                    </tr>
                  ) : (
                    warehouseItems.map((item, idx) => {
                      const rowDL = Number(item.dl) || 0;
                      const rowIDL = Number(item.idl) || 0;
                      const rowTotal = rowDL + rowIDL;

                      return (
                        <tr
                          key={item.id || `wh-${idx}`}
                          className="hover:bg-[#1c1b1f] transition-colors"
                        >
                          <td className="p-2.5">
                            <input
                              type="text"
                              disabled={!hasEditPermission}
                              value={item.name}
                              placeholder="e.g. Material Logistics, Inventory Control, Shipping"
                              onChange={(e) => handleUpdateWarehouseItem(item.id, 'name', e.target.value)}
                              className={`data-table-input data-table-input-left font-semibold font-['JetBrains_Mono'] w-full ${
                                hasEditPermission ? 'text-[#e5e1e6] focus:border-[#ffb86b]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                              }`}
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min={0}
                                disabled={!hasEditPermission}
                                value={item.dl}
                                onChange={(e) => handleUpdateWarehouseItem(item.id, 'dl', e.target.value)}
                                className={`data-table-input text-right font-bold font-['JetBrains_Mono'] w-28 ${
                                  hasEditPermission ? 'text-[#e5e1e6] focus:border-[#ffb86b]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                }`}
                              />
                              <span className="text-[11px] text-[#d7c3b2]/60">DL</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min={0}
                                disabled={!hasEditPermission}
                                value={item.idl}
                                onChange={(e) => handleUpdateWarehouseItem(item.id, 'idl', e.target.value)}
                                className={`data-table-input text-right font-bold font-['JetBrains_Mono'] text-[#5de6ff] w-28 ${
                                  hasEditPermission ? 'focus:border-[#5de6ff]' : 'cursor-not-allowed opacity-80'
                                }`}
                              />
                              <span className="text-[11px] text-[#5de6ff]/70">IDL</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-bold text-sm text-[#4edea3]">
                            {rowTotal} <span className="text-xs text-[#d7c3b2]/60 font-normal">HC</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              disabled={!hasEditPermission || warehouseItems.length <= 1}
                              onClick={() => handleDeleteWarehouseItem(item.id)}
                              className={`p-1 rounded transition-colors ${
                                hasEditPermission && warehouseItems.length > 1
                                  ? 'text-[#ff6b6b]/80 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/15 cursor-pointer'
                                  : 'text-[#d7c3b2]/30 cursor-not-allowed'
                              }`}
                              title={
                                !hasEditPermission
                                  ? 'Read-only mode'
                                  : warehouseItems.length <= 1
                                  ? 'At least one warehouse function must remain'
                                  : `Delete ${item.name}`
                              }
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Summary Footer */}
                <tfoot className="bg-[#17181c] border-t-2 border-[#524437]/60 font-['JetBrains_Mono'] text-xs font-bold">
                  <tr>
                    <td className="p-3 text-[#ffb86b] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">summarize</span>
                      <span>Warehouse Total Standard Manpower:</span>
                    </td>
                    <td className="p-3 text-right text-[#e5e1e6]">
                      {whTotalDL} <span className="text-[10px] text-[#d7c3b2]/60 font-normal">DL</span>
                    </td>
                    <td className="p-3 text-right text-[#5de6ff]">
                      {whTotalIDL} <span className="text-[10px] text-[#5de6ff]/70 font-normal">IDL</span>
                    </td>
                    <td className="p-3 text-right text-[#4edea3] text-sm font-extrabold">
                      {whTotalDL + whTotalIDL} <span className="text-[10px] text-[#4edea3]/80 font-normal">HC</span>
                    </td>
                    <td className="p-3 text-center text-[#d7c3b2]/50 text-[10px]">
                      SYNCED
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Other Support */}
      {(activeDeptTab === 'all' || activeDeptTab === 'other') && (
        <div id="segment-othersupport" className="bg-[#131316] border border-[#524437]/50 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#524437]/30">
            <div
              onClick={() => setOtherSupportOpen(!otherSupportOpen)}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              title={otherSupportOpen ? "Click to collapse Other Support" : "Click to expand Other Support"}
            >
              <span className="material-symbols-outlined text-[#ffb86b] text-xl group-hover:scale-110 transition-transform">
                support_agent
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Inter'] text-base font-semibold text-[#e5e1e6] group-hover:text-[#ffb86b] transition-colors">
                    Other Support
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-[#fb923c]/15 text-[#fb923c] border border-[#fb923c]/30">
                    {otherSupportItems.length} Functions
                  </span>
                  {!otherSupportOpen && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/40">
                      Collapsed
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#d7c3b2]/70 font-['JetBrains_Mono'] mt-0.5">
                  DL Total: <strong className="text-[#e5e1e6]">{otherTotalDL}</strong> DL • IDL Total: <strong className="text-[#5de6ff]">{otherTotalIDL}</strong> IDL
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <CostCenterMultiPicker
                id="input-othersupport-cost-center"
                departmentName="Other Support"
                value={site.otherSupport.costCenter}
                onChange={(val) =>
                  onUpdateSite({
                    ...site,
                    otherSupport: {
                      ...site.otherSupport,
                      costCenter: val,
                    },
                  })
                }
                hrPresets={OTHER_SUPPORT_HR_PRESETS}
                placeholder="e.g. CC-OTH-7501"
                disabled={!hasEditPermission}
              />

              {otherSupportOpen && (
                <button
                  id="btn-add-othersupport-item"
                  onClick={handleAddOtherSupportItem}
                  disabled={!hasEditPermission}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-['JetBrains_Mono'] font-bold ${
                    hasEditPermission
                      ? 'bg-[#ffb86b]/20 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/50 cursor-pointer shadow-sm active:scale-95'
                      : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                  }`}
                  title={hasEditPermission ? "Add Other Support Item / Function" : `Read-Only: Only ${site.code} IE can add items`}
                >
                  <span className="material-symbols-outlined text-sm">{hasEditPermission ? 'add_circle' : 'lock'}</span>
                  <span>ADD OTHER SUPPORT ITEM</span>
                </button>
              )}

              <button
                id="btn-toggle-othersupport"
                onClick={() => setOtherSupportOpen(!otherSupportOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1f1e24] hover:bg-[#2a2930] text-[#d7c3b2] hover:text-[#ffb86b] transition-all border border-[#524437]/50 text-xs font-['JetBrains_Mono'] cursor-pointer shadow-sm active:scale-95"
                title={otherSupportOpen ? "Collapse Other Support" : "Expand Other Support"}
                aria-expanded={otherSupportOpen}
              >
                <span className="text-[11px] font-semibold">{otherSupportOpen ? 'Collapse' : 'Expand'}</span>
                <span
                  className={`material-symbols-outlined text-base transition-transform duration-200 block ${
                    otherSupportOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
            </div>
          </div>

          {/* Other Support Functions Table */}
          {otherSupportOpen && (
            <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#131316]">
              <table className="w-full text-left font-['Inter'] text-xs">
                <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 border-b border-[#524437]/40">OTHER SUPPORT FUNCTION / TEAM NAME</th>
                    <th className="p-3 border-b border-[#524437]/40 text-right w-44">
                      DIRECT LABOR (DL)
                    </th>
                    <th className="p-3 border-b border-[#524437]/40 text-right w-44 text-[#5de6ff]">
                      INDIRECT LABOR (IDL)
                    </th>
                    <th className="p-3 border-b border-[#524437]/40 text-right w-40 text-[#4edea3]">
                      TOTAL (DL+IDL)
                    </th>
                    <th className="p-3 border-b border-[#524437]/40 text-center w-20">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#524437]/30 font-['JetBrains_Mono']">
                  {otherSupportItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#d7c3b2]/50 italic">
                        No other support teams configured. Click "ADD OTHER SUPPORT ITEM" to add a new function.
                      </td>
                    </tr>
                  ) : (
                    otherSupportItems.map((item, idx) => {
                      const rowDL = Number(item.dl) || 0;
                      const rowIDL = Number(item.idl) || 0;
                      const rowTotal = rowDL + rowIDL;

                      return (
                        <tr
                          key={item.id || `oth-${idx}`}
                          className="hover:bg-[#1c1b1f] transition-colors"
                        >
                          <td className="p-2.5">
                            <input
                              type="text"
                              disabled={!hasEditPermission}
                              value={item.name}
                              placeholder="e.g. Facility & Cleanroom, EHS, General Affairs"
                              onChange={(e) => handleUpdateOtherSupportItem(item.id, 'name', e.target.value)}
                              className={`data-table-input data-table-input-left font-semibold font-['JetBrains_Mono'] w-full ${
                                hasEditPermission ? 'text-[#e5e1e6] focus:border-[#ffb86b]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                              }`}
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min={0}
                                disabled={!hasEditPermission}
                                value={item.dl}
                                onChange={(e) => handleUpdateOtherSupportItem(item.id, 'dl', e.target.value)}
                                className={`data-table-input text-right font-bold font-['JetBrains_Mono'] w-28 ${
                                  hasEditPermission ? 'text-[#e5e1e6] focus:border-[#ffb86b]' : 'text-[#d7c3b2]/60 cursor-not-allowed opacity-80'
                                }`}
                              />
                              <span className="text-[11px] text-[#d7c3b2]/60">DL</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min={0}
                                disabled={!hasEditPermission}
                                value={item.idl}
                                onChange={(e) => handleUpdateOtherSupportItem(item.id, 'idl', e.target.value)}
                                className={`data-table-input text-right font-bold font-['JetBrains_Mono'] text-[#5de6ff] w-28 ${
                                  hasEditPermission ? 'focus:border-[#5de6ff]' : 'cursor-not-allowed opacity-80'
                                }`}
                              />
                              <span className="text-[11px] text-[#5de6ff]/70">IDL</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-bold text-sm text-[#4edea3]">
                            {rowTotal} <span className="text-xs text-[#d7c3b2]/60 font-normal">HC</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              disabled={!hasEditPermission || otherSupportItems.length <= 1}
                              onClick={() => handleDeleteOtherSupportItem(item.id)}
                              className={`p-1 rounded transition-colors ${
                                hasEditPermission && otherSupportItems.length > 1
                                  ? 'text-[#ff6b6b]/80 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/15 cursor-pointer'
                                  : 'text-[#d7c3b2]/30 cursor-not-allowed'
                              }`}
                              title={
                                !hasEditPermission
                                  ? 'Read-only mode'
                                  : otherSupportItems.length <= 1
                                  ? 'At least one support team must remain'
                                  : `Delete ${item.name}`
                              }
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Summary Footer */}
                <tfoot className="bg-[#17181c] border-t-2 border-[#524437]/60 font-['JetBrains_Mono'] text-xs font-bold">
                  <tr>
                    <td className="p-3 text-[#ffb86b] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">summarize</span>
                      <span>Other Support Total Standard Manpower:</span>
                    </td>
                    <td className="p-3 text-right text-[#e5e1e6]">
                      {otherTotalDL} <span className="text-[10px] text-[#d7c3b2]/60 font-normal">DL</span>
                    </td>
                    <td className="p-3 text-right text-[#5de6ff]">
                      {otherTotalIDL} <span className="text-[10px] text-[#5de6ff]/70 font-normal">IDL</span>
                    </td>
                    <td className="p-3 text-right text-[#4edea3] text-sm font-extrabold">
                      {otherTotalDL + otherTotalIDL} <span className="text-[10px] text-[#4edea3]/80 font-normal">HC</span>
                    </td>
                    <td className="p-3 text-center text-[#d7c3b2]/50 text-[10px]">
                      SYNCED
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
