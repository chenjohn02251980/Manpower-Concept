// August 2026 APS SMT & Paired PCA Schedule Data
export interface SmtPcaOrder {
  id: string;
  smtLine: string;
  pcaLine: string;
  plant: string;
  dType: 'MP' | 'NPI';
  model: string;
  family: string;
  date: string;
  planQty: number;
  dayQty: number;
  nightQty: number;
  hasDay: boolean;
  hasNight: boolean;
  shifts: number;
  mo: string;
}

export interface SmtLineSummary {
  smtLine: string;
  pcaLine: string;
  plant: string;
  smtStdDL: number;
  pcaStdDL: number;
  totalPairStdDL: number;
  totalPlanQty: number;
  activeDays: number;
  daily: Record<string, {
    dayQty: number;
    nightQty: number;
    totalQty: number;
    hasDay: boolean;
    hasNight: boolean;
    shifts: number; // 0, 1, 2
    smtDL: number; // shifts * smtStdDL
    pcaDL: number; // shifts * pcaStdDL (continuous production)
    totalDL: number; // smtDL + pcaDL
  }>;
}

export const SMT_PAIRS_CONFIG: Record<string, { pca: string; smtDL: number; pcaDL: number; plant: string }> = {
  'S21': { pca: 'P21', smtDL: 6, pcaDL: 18, plant: 'TP05' },
  'S22': { pca: 'P22', smtDL: 6, pcaDL: 18, plant: 'TP05' },
  'S23': { pca: 'P23', smtDL: 5, pcaDL: 16, plant: 'TP05' },
  'S41': { pca: 'P41', smtDL: 6, pcaDL: 18, plant: 'TP05' },
  'S42': { pca: 'P42', smtDL: 6, pcaDL: 16, plant: 'TP05' },
  'S43': { pca: 'P43', smtDL: 5, pcaDL: 16, plant: 'TP05' },
  'S44': { pca: 'P44', smtDL: 6, pcaDL: 18, plant: 'TP05' },
  'S51': { pca: 'P51', smtDL: 6, pcaDL: 18, plant: 'TP05' },
  'S61': { pca: 'P61', smtDL: 5, pcaDL: 16, plant: 'TP05' },
  'S71': { pca: 'P71', smtDL: 6, pcaDL: 16, plant: 'TP05' },
  'S72': { pca: 'P72', smtDL: 5, pcaDL: 14, plant: 'TP05' },
  'S73': { pca: 'P73', smtDL: 5, pcaDL: 14, plant: 'TP05' },
};

export const AUGUST_SMT_ORDERS: SmtPcaOrder[] = [
  // S21 Orders
  { id: 'SMT-S21-01', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'NPI', model: '1395A3769004', family: 'NPI', date: '2026/08/03', planQty: 12, dayQty: 12, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:21364217' },
  { id: 'SMT-S21-02', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3256509', family: 'STONEHENGE2', date: '2026/08/03', planQty: 1800, dayQty: 828, nightQty: 972, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032698136' },
  { id: 'SMT-S21-03', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'NPI', model: '1395A3830201', family: 'NPI', date: '2026/08/04', planQty: 89, dayQty: 89, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:000021364526' },
  { id: 'SMT-S21-04', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3494901', family: 'HUAGUOSHAN', date: '2026/08/04', planQty: 2100, dayQty: 597, nightQty: 1503, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032698140' },
  { id: 'SMT-S21-05', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3738801', family: 'GB1_1', date: '2026/08/05', planQty: 2476, dayQty: 2476, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032751316' },
  { id: 'SMT-S21-06', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3476812', family: 'EVERGLADES', date: '2026/08/05', planQty: 2000, dayQty: 317, nightQty: 1683, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032757706' },
  { id: 'SMT-S21-07', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3476812', family: 'EVERGLADES', date: '2026/08/06', planQty: 2740, dayQty: 2012, nightQty: 728, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032757706' },
  { id: 'SMT-S21-08', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3494901', family: 'HUAGUOSHAN', date: '2026/08/06', planQty: 1104, dayQty: 0, nightQty: 1104, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032767673' },
  { id: 'SMT-S21-09', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3256509', family: 'STONEHENGE2', date: '2026/08/07', planQty: 1270, dayQty: 1270, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032767665' },
  { id: 'SMT-S21-10', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3697201', family: 'MAKALU', date: '2026/08/07', planQty: 1500, dayQty: 44, nightQty: 1456, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032774620' },
  { id: 'SMT-S21-11', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3697201', family: 'MAKALU', date: '2026/08/10', planQty: 2804, dayQty: 466, nightQty: 2338, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032785516' },
  { id: 'SMT-S21-12', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'NPI', model: '1395A3838201', family: 'HELIOS', date: '2026/08/10', planQty: 1800, dayQty: 0, nightQty: 1800, hasDay: false, hasNight: true, shifts: 1, mo: '0:000021365738' },
  { id: 'SMT-S21-13', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'NPI', model: '1395A3838201', family: 'HELIOS', date: '2026/08/11', planQty: 3228, dayQty: 3228, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:000021365738' },
  { id: 'SMT-S21-14', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3494901', family: 'HUAGUOSHAN', date: '2026/08/11', planQty: 1854, dayQty: 1738, nightQty: 116, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032785520' },
  { id: 'SMT-S21-15', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3697101', family: 'MAKALU', date: '2026/08/11', planQty: 3200, dayQty: 0, nightQty: 3200, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032751318' },
  { id: 'SMT-S21-16', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3476812', family: 'EVERGLADES', date: '2026/08/12', planQty: 4344, dayQty: 2118, nightQty: 2226, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032792073' },
  { id: 'SMT-S21-17', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3256509', family: 'STONEHENGE2', date: '2026/08/13', planQty: 1118, dayQty: 1118, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032802496' },
  { id: 'SMT-S21-18', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3697001', family: 'MAKALU', date: '2026/08/13', planQty: 4000, dayQty: 739, nightQty: 3261, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032802498' },
  { id: 'SMT-S21-19', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3144018', family: 'SCULPTOR', date: '2026/08/13', planQty: 6000, dayQty: 0, nightQty: 6000, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032820942' },
  { id: 'SMT-S21-20', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3144018', family: 'SCULPTOR', date: '2026/08/14', planQty: 4320, dayQty: 4320, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032820942' },
  { id: 'SMT-S21-21', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3697101', family: 'MAKALU', date: '2026/08/14', planQty: 2092, dayQty: 1872, nightQty: 220, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032767667' },
  { id: 'SMT-S21-22', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3738801', family: 'GB1_1', date: '2026/08/14', planQty: 2916, dayQty: 0, nightQty: 2916, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032814843' },
  { id: 'SMT-S21-23', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3476812', family: 'EVERGLADES', date: '2026/08/18', planQty: 1964, dayQty: 1680, nightQty: 284, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830444' },
  { id: 'SMT-S21-24', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3738801', family: 'GB1_1', date: '2026/08/18', planQty: 3000, dayQty: 0, nightQty: 3000, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032830448' },
  { id: 'SMT-S21-25', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3144018', family: 'SCULPTOR', date: '2026/08/19', planQty: 5640, dayQty: 0, nightQty: 5640, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032839928' },
  { id: 'SMT-S21-26', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3494901', family: 'HUAGUOSHAN', date: '2026/08/21', planQty: 1566, dayQty: 1566, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032839934' },
  { id: 'SMT-S21-27', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3697201', family: 'MAKALU', date: '2026/08/21', planQty: 1696, dayQty: 594, nightQty: 1102, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032850563' },
  { id: 'SMT-S21-28', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3697201', family: 'MAKALU', date: '2026/08/24', planQty: 3000, dayQty: 950, nightQty: 2050, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032860160' },
  { id: 'SMT-S21-29', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3738801', family: 'GB1_1', date: '2026/08/25', planQty: 2900, dayQty: 0, nightQty: 2900, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032866645' },
  { id: 'SMT-S21-30', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3144018', family: 'SCULPTOR', date: '2026/08/26', planQty: 6000, dayQty: 6000, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032873077' },
  { id: 'SMT-S21-31', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3697101', family: 'MAKALU', date: '2026/08/26', planQty: 2500, dayQty: 1068, nightQty: 1432, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032873079' },
  { id: 'SMT-S21-32', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3738801', family: 'GB1_1', date: '2026/08/27', planQty: 2360, dayQty: 0, nightQty: 2360, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032882654' },
  { id: 'SMT-S21-33', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3738801', family: 'GB1_1', date: '2026/08/28', planQty: 4260, dayQty: 2700, nightQty: 1560, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032882654' },
  { id: 'SMT-S21-34', smtLine: 'S21', pcaLine: 'P21', plant: 'TP05', dType: 'MP', model: '1395A3476812', family: 'EVERGLADES', date: '2026/08/31', planQty: 1600, dayQty: 1600, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032924691' },

  // S22 Orders (GuadalupeRiver, Everglades, Seron, Mariner)
  { id: 'SMT-S22-01', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/03', planQty: 1530, dayQty: 580, nightQty: 950, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032708405' },
  { id: 'SMT-S22-02', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3230701', family: 'MARINER', date: '2026/08/03', planQty: 500, dayQty: 305, nightQty: 195, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032698735' },
  { id: 'SMT-S22-03', smtLine: 'S22', pcaLine: 'P22', plant: 'TP08', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/04', planQty: 1370, dayQty: 1370, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032736603' },
  { id: 'SMT-S22-04', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3289705', family: 'EVERGLADES', date: '2026/08/04', planQty: 2400, dayQty: 381, nightQty: 2019, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032698142' },
  { id: 'SMT-S22-05', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/05', planQty: 2400, dayQty: 1342, nightQty: 1058, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032751302' },
  { id: 'SMT-S22-06', smtLine: 'S22', pcaLine: 'P22', plant: 'TP15', dType: 'MP', model: '1395A3289705', family: 'EVERGLADES', date: '2026/08/06', planQty: 720, dayQty: 720, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032708611' },
  { id: 'SMT-S22-07', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3230701', family: 'MARINER', date: '2026/08/06', planQty: 650, dayQty: 457, nightQty: 193, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032708603' },
  { id: 'SMT-S22-08', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/07', planQty: 1830, dayQty: 1369, nightQty: 461, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032757731' },
  { id: 'SMT-S22-09', smtLine: 'S22', pcaLine: 'P22', plant: 'TP15', dType: 'MP', model: '1395A3289705', family: 'EVERGLADES', date: '2026/08/07', planQty: 2400, dayQty: 0, nightQty: 2400, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032767669' },
  { id: 'SMT-S22-10', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/10', planQty: 2400, dayQty: 1120, nightQty: 1280, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032777328' },
  { id: 'SMT-S22-11', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3289705', family: 'EVERGLADES', date: '2026/08/11', planQty: 2580, dayQty: 2500, nightQty: 80, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032788924' },
  { id: 'SMT-S22-12', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/12', planQty: 1820, dayQty: 1029, nightQty: 791, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032793797' },
  { id: 'SMT-S22-13', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/13', planQty: 2180, dayQty: 931, nightQty: 1249, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032803614' },
  { id: 'SMT-S22-14', smtLine: 'S22', pcaLine: 'P22', plant: 'TP08', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/14', planQty: 2018, dayQty: 1176, nightQty: 842, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032814719' },
  { id: 'SMT-S22-15', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/17', planQty: 2100, dayQty: 926, nightQty: 1174, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032820735' },
  { id: 'SMT-S22-16', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/18', planQty: 2070, dayQty: 882, nightQty: 1188, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830412' },
  { id: 'SMT-S22-17', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/19', planQty: 2056, dayQty: 882, nightQty: 1174, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830480' },
  { id: 'SMT-S22-18', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/20', planQty: 2098, dayQty: 1029, nightQty: 1069, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032838870' },
  { id: 'SMT-S22-19', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3289705', family: 'EVERGLADES', date: '2026/08/21', planQty: 1968, dayQty: 1968, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032839937' },
  { id: 'SMT-S22-20', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/21', planQty: 1100, dayQty: 0, nightQty: 1100, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032839046' },
  { id: 'SMT-S22-21', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/24', planQty: 680, dayQty: 680, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032839046' },
  { id: 'SMT-S22-22', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/25', planQty: 1140, dayQty: 1140, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032866657' },
  { id: 'SMT-S22-23', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3266101', family: 'SERON', date: '2026/08/26', planQty: 610, dayQty: 260, nightQty: 350, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032860924' },
  { id: 'SMT-S22-24', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3266101', family: 'SERON', date: '2026/08/27', planQty: 562, dayQty: 392, nightQty: 170, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032860924' },
  { id: 'SMT-S22-25', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/28', planQty: 1222, dayQty: 1029, nightQty: 193, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032884434' },
  { id: 'SMT-S22-26', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3376203', family: 'GUADALUPERIVER', date: '2026/08/31', planQty: 936, dayQty: 936, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032895163' },
  { id: 'SMT-S22-27', smtLine: 'S22', pcaLine: 'P22', plant: 'TP05', dType: 'MP', model: '1395A3287304', family: 'SERON', date: '2026/08/31', planQty: 1080, dayQty: 0, nightQty: 1080, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032924695' },

  // S23 Orders (Makalu, Huaguoshan, Helios, Capala)
  { id: 'SMT-S23-01', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'MP', model: '1395A3697301', family: 'MAKALU', date: '2026/08/06', planQty: 2800, dayQty: 1670, nightQty: 1130, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032733541' },
  { id: 'SMT-S23-02', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'MP', model: '1395A3500101', family: 'HUAGUOSHAN', date: '2026/08/10', planQty: 720, dayQty: 720, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032796838' },
  { id: 'SMT-S23-03', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'NPI', model: '1395A3733903', family: 'NPI', date: '2026/08/10', planQty: 540, dayQty: 0, nightQty: 540, hasDay: false, hasNight: true, shifts: 1, mo: '0:000021364528' },
  { id: 'SMT-S23-04', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'NPI', model: '1395A3733903', family: 'NPI', date: '2026/08/11', planQty: 1152, dayQty: 1087, nightQty: 65, hasDay: true, hasNight: true, shifts: 2, mo: '0:000021364528' },
  { id: 'SMT-S23-05', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'MP', model: '1395A3494502', family: 'HUAGUOSHAN', date: '2026/08/12', planQty: 1228, dayQty: 639, nightQty: 589, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032705195' },
  { id: 'SMT-S23-06', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'MP', model: '1395A3697601', family: 'MAKALU', date: '2026/08/13', planQty: 982, dayQty: 548, nightQty: 434, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032802500' },
  { id: 'SMT-S23-07', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'MP', model: '1395A3697601', family: 'MAKALU', date: '2026/08/17', planQty: 992, dayQty: 548, nightQty: 444, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032820946' },
  { id: 'SMT-S23-08', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'MP', model: '1395A3500101', family: 'HUAGUOSHAN', date: '2026/08/21', planQty: 1560, dayQty: 0, nightQty: 1560, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032820955' },
  { id: 'SMT-S23-09', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'MP', model: '1395A3494502', family: 'HUAGUOSHAN', date: '2026/08/25', planQty: 732, dayQty: 137, nightQty: 595, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830930' },
  { id: 'SMT-S23-10', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'MP', model: '1395A3494502', family: 'HUAGUOSHAN', date: '2026/08/26', planQty: 743, dayQty: 514, nightQty: 229, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830930' },
  { id: 'SMT-S23-11', smtLine: 'S23', pcaLine: 'P23', plant: 'TP05', dType: 'NPI', model: '1395A3733903', family: 'NPI', date: '2026/08/31', planQty: 316, dayQty: 204, nightQty: 112, hasDay: true, hasNight: true, shifts: 2, mo: '0:000021370352' },

  // S41 Orders (Capala, Stonehenge2, Williamson, Yoho, Seron)
  { id: 'SMT-S41-01', smtLine: 'S41', pcaLine: 'P41', plant: 'TP08', dType: 'NPI', model: '1395A3397201', family: 'WILLIAMSON', date: '2026/08/01', planQty: 596, dayQty: 596, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:21363552' },
  { id: 'SMT-S41-02', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3266304', family: 'SERON', date: '2026/08/01', planQty: 1300, dayQty: 665, nightQty: 635, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032732197' },
  { id: 'SMT-S41-03', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3409905', family: 'STONEHENGE2', date: '2026/08/03', planQty: 1440, dayQty: 1187, nightQty: 253, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032732199' },
  { id: 'SMT-S41-04', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/04', planQty: 3600, dayQty: 1806, nightQty: 1794, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032757740' },
  { id: 'SMT-S41-05', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3511401', family: 'CAPALA', date: '2026/08/05', planQty: 2190, dayQty: 846, nightQty: 1344, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032698111' },
  { id: 'SMT-S41-06', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3409905', family: 'STONEHENGE2', date: '2026/08/07', planQty: 1300, dayQty: 616, nightQty: 684, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032751320' },
  { id: 'SMT-S41-07', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3511401', family: 'CAPALA', date: '2026/08/10', planQty: 2400, dayQty: 1283, nightQty: 1117, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032757737' },
  { id: 'SMT-S41-08', smtLine: 'S41', pcaLine: 'P41', plant: 'TP11', dType: 'MP', model: '1395A3266303', family: 'SERON', date: '2026/08/11', planQty: 1010, dayQty: 1010, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032768027' },
  { id: 'SMT-S41-09', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3266304', family: 'SERON', date: '2026/08/12', planQty: 1260, dayQty: 1043, nightQty: 217, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032768023' },
  { id: 'SMT-S41-10', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3511401', family: 'CAPALA', date: '2026/08/13', planQty: 1542, dayQty: 1287, nightQty: 255, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032803608' },
  { id: 'SMT-S41-11', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3409905', family: 'STONEHENGE2', date: '2026/08/14', planQty: 1718, dayQty: 1181, nightQty: 537, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032778570' },
  { id: 'SMT-S41-12', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3511401', family: 'CAPALA', date: '2026/08/17', planQty: 2000, dayQty: 733, nightQty: 1267, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032820738' },
  { id: 'SMT-S41-13', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3493501', family: 'YOHO', date: '2026/08/18', planQty: 604, dayQty: 574, nightQty: 30, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032814845' },
  { id: 'SMT-S41-14', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3511401', family: 'CAPALA', date: '2026/08/19', planQty: 2000, dayQty: 769, nightQty: 1231, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830923' },
  { id: 'SMT-S41-15', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3511401', family: 'CAPALA', date: '2026/08/21', planQty: 1830, dayQty: 854, nightQty: 976, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032839049' },
  { id: 'SMT-S41-16', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3511401', family: 'CAPALA', date: '2026/08/24', planQty: 2000, dayQty: 1094, nightQty: 906, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032860932' },
  { id: 'SMT-S41-17', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3511401', family: 'CAPALA', date: '2026/08/27', planQty: 2268, dayQty: 932, nightQty: 1336, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032875365' },
  { id: 'SMT-S41-18', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3409905', family: 'STONEHENGE2', date: '2026/08/28', planQty: 1880, dayQty: 704, nightQty: 1176, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032895125' },
  { id: 'SMT-S41-19', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'NPI', model: '1395A3797401', family: 'TANGO', date: '2026/08/31', planQty: 1304, dayQty: 693, nightQty: 611, hasDay: true, hasNight: true, shifts: 2, mo: '0:21370738' },
  { id: 'SMT-S41-20', smtLine: 'S41', pcaLine: 'P41', plant: 'TP05', dType: 'MP', model: '1395A3266304', family: 'SERON', date: '2026/08/31', planQty: 1150, dayQty: 0, nightQty: 1150, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032924697' },

  // S42 Orders (Tauri, Viztruck, Argos_V3)
  { id: 'SMT-S42-01', smtLine: 'S42', pcaLine: 'P42', plant: 'TP05', dType: 'MP', model: '1395A3778301', family: 'TAURI', date: '2026/08/03', planQty: 1128, dayQty: 1128, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032708389' },
  { id: 'SMT-S42-02', smtLine: 'S42', pcaLine: 'P42', plant: 'TP05', dType: 'MP', model: '1395A3456906', family: 'VIZTRUCK', date: '2026/08/03', planQty: 740, dayQty: 196, nightQty: 544, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032734680' },
  { id: 'SMT-S42-03', smtLine: 'S42', pcaLine: 'P42', plant: 'TP05', dType: 'MP', model: '1395A3456906', family: 'VIZTRUCK', date: '2026/08/04', planQty: 310, dayQty: 310, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032736610' },
  { id: 'SMT-S42-04', smtLine: 'S42', pcaLine: 'P42', plant: 'TP05', dType: 'MP', model: '1395A3456601', family: 'VIZTRUCK', date: '2026/08/04', planQty: 496, dayQty: 496, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032662432' },
  { id: 'SMT-S42-05', smtLine: 'S42', pcaLine: 'P42', plant: 'TP05', dType: 'MP', model: '1395A3456906', family: 'VIZTRUCK', date: '2026/08/12', planQty: 954, dayQty: 434, nightQty: 520, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032751328' },
  { id: 'SMT-S42-06', smtLine: 'S42', pcaLine: 'P42', plant: 'TP05', dType: 'MP', model: '1395A3671201', family: 'VIZTRUCK', date: '2026/08/14', planQty: 1004, dayQty: 1004, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032777332' },
  { id: 'SMT-S42-07', smtLine: 'S42', pcaLine: 'P42', plant: 'TP05', dType: 'MP', model: '1395A3773701', family: 'TAURI', date: '2026/08/31', planQty: 500, dayQty: 332, nightQty: 168, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032926890' },

  // S43 Orders (Capala, Yoho, Pegasus, Makalu, Seahawk)
  { id: 'SMT-S43-01', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'NPI', model: '1395A3729302', family: 'NPI', date: '2026/08/03', planQty: 900, dayQty: 180, nightQty: 720, hasDay: true, hasNight: true, shifts: 2, mo: '0:000021364519' },
  { id: 'SMT-S43-02', smtLine: 'S43', pcaLine: 'P43', plant: 'TP12', dType: 'NPI', model: '1395A3729302', family: 'NPI', date: '2026/08/04', planQty: 845, dayQty: 720, nightQty: 125, hasDay: true, hasNight: true, shifts: 2, mo: '0:000021364519' },
  { id: 'SMT-S43-03', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/07', planQty: 1800, dayQty: 563, nightQty: 1237, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032768022' },
  { id: 'SMT-S43-04', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/10', planQty: 1960, dayQty: 428, nightQty: 1532, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032768022' },
  { id: 'SMT-S43-05', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/11', planQty: 1800, dayQty: 1219, nightQty: 581, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032787449' },
  { id: 'SMT-S43-06', smtLine: 'S43', pcaLine: 'P43', plant: 'TP08', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/17', planQty: 2300, dayQty: 1530, nightQty: 770, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032794563' },
  { id: 'SMT-S43-07', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/19', planQty: 1356, dayQty: 263, nightQty: 1093, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830443' },
  { id: 'SMT-S43-08', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/21', planQty: 776, dayQty: 776, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032830926' },
  { id: 'SMT-S43-09', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/26', planQty: 740, dayQty: 0, nightQty: 740, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032839052' },
  { id: 'SMT-S43-10', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/28', planQty: 1002, dayQty: 1002, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032875368' },
  { id: 'SMT-S43-11', smtLine: 'S43', pcaLine: 'P43', plant: 'TP05', dType: 'MP', model: '1395A3536201', family: 'CAPALA', date: '2026/08/31', planQty: 1080, dayQty: 0, nightQty: 1080, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032895169' },

  // S44 Orders (Capala MLB, Everglades, Tauri)
  { id: 'SMT-S44-01', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/03', planQty: 1255, dayQty: 597, nightQty: 658, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032733626' },
  { id: 'SMT-S44-02', smtLine: 'S44', pcaLine: 'P44', plant: 'TP08', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/04', planQty: 1249, dayQty: 588, nightQty: 661, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032708397' },
  { id: 'SMT-S44-03', smtLine: 'S44', pcaLine: 'P44', plant: 'TP08', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/05', planQty: 1146, dayQty: 586, nightQty: 560, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032708526' },
  { id: 'SMT-S44-04', smtLine: 'S44', pcaLine: 'P44', plant: 'TP08', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/06', planQty: 1318, dayQty: 659, nightQty: 659, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032751311' },
  { id: 'SMT-S44-05', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/07', planQty: 820, dayQty: 342, nightQty: 478, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032758983' },
  { id: 'SMT-S44-06', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/10', planQty: 780, dayQty: 300, nightQty: 480, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032758983' },
  { id: 'SMT-S44-07', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/11', planQty: 773, dayQty: 420, nightQty: 353, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032778561' },
  { id: 'SMT-S44-08', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/13', planQty: 960, dayQty: 449, nightQty: 511, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032787452' },
  { id: 'SMT-S44-09', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/14', planQty: 961, dayQty: 540, nightQty: 421, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032794566' },
  { id: 'SMT-S44-10', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/17', planQty: 840, dayQty: 360, nightQty: 480, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032820941' },
  { id: 'SMT-S44-11', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/18', planQty: 838, dayQty: 360, nightQty: 478, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032820941' },
  { id: 'SMT-S44-12', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/19', planQty: 795, dayQty: 318, nightQty: 477, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830450' },
  { id: 'SMT-S44-13', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/21', planQty: 1020, dayQty: 362, nightQty: 658, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830929' },
  { id: 'SMT-S44-14', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/24', planQty: 845, dayQty: 420, nightQty: 425, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830929' },
  { id: 'SMT-S44-15', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/25', planQty: 900, dayQty: 420, nightQty: 480, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032860935' },
  { id: 'SMT-S44-16', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/26', planQty: 787, dayQty: 300, nightQty: 487, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032860935' },
  { id: 'SMT-S44-17', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/27', planQty: 840, dayQty: 420, nightQty: 420, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032868863' },
  { id: 'SMT-S44-18', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/28', planQty: 840, dayQty: 360, nightQty: 480, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032884437' },
  { id: 'SMT-S44-19', smtLine: 'S44', pcaLine: 'P44', plant: 'TP05', dType: 'MP', model: '1395A3511501', family: 'CAPALA', date: '2026/08/31', planQty: 787, dayQty: 420, nightQty: 367, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032884437' },

  // S51 Orders (GB1_1, Sculptor, Daytona)
  { id: 'SMT-S51-01', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3595102', family: 'SCULPTOR', date: '2026/08/03', planQty: 1008, dayQty: 146, nightQty: 862, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032708609' },
  { id: 'SMT-S51-02', smtLine: 'S51', pcaLine: 'P51', plant: 'TP15', dType: 'MP', model: '1395A3595102', family: 'SCULPTOR', date: '2026/08/04', planQty: 1689, dayQty: 824, nightQty: 865, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032708609' },
  { id: 'SMT-S51-03', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726401', family: 'GB1_1', date: '2026/08/06', planQty: 3000, dayQty: 1462, nightQty: 1538, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032742573' },
  { id: 'SMT-S51-04', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3595102', family: 'SCULPTOR', date: '2026/08/10', planQty: 2010, dayQty: 1013, nightQty: 997, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032742577' },
  { id: 'SMT-S51-05', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3595102', family: 'SCULPTOR', date: '2026/08/11', planQty: 1020, dayQty: 330, nightQty: 690, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032742577' },
  { id: 'SMT-S51-06', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3595102', family: 'SCULPTOR', date: '2026/08/12', planQty: 1491, dayQty: 1138, nightQty: 353, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032778572' },
  { id: 'SMT-S51-07', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726201', family: 'GB1_1', date: '2026/08/17', planQty: 2130, dayQty: 1022, nightQty: 1108, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032820950' },
  { id: 'SMT-S51-08', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726501', family: 'GB1_1', date: '2026/08/18', planQty: 1200, dayQty: 0, nightQty: 1200, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032803704' },
  { id: 'SMT-S51-09', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726501', family: 'GB1_1', date: '2026/08/19', planQty: 1344, dayQty: 144, nightQty: 1200, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032803704' },
  { id: 'SMT-S51-10', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726201', family: 'GB1_1', date: '2026/08/24', planQty: 2100, dayQty: 1184, nightQty: 916, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032830932' },
  { id: 'SMT-S51-11', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726501', family: 'GB1_1', date: '2026/08/25', planQty: 2400, dayQty: 1107, nightQty: 1293, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032860928' },
  { id: 'SMT-S51-12', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726201', family: 'GB1_1', date: '2026/08/27', planQty: 2340, dayQty: 1022, nightQty: 1318, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032875361' },
  { id: 'SMT-S51-13', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726201', family: 'GB1_1', date: '2026/08/28', planQty: 915, dayQty: 915, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032875361' },
  { id: 'SMT-S51-14', smtLine: 'S51', pcaLine: 'P51', plant: 'TP05', dType: 'MP', model: '1395A3726201', family: 'GB1_1', date: '2026/08/31', planQty: 1179, dayQty: 1179, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032895129' },

  // S61 Orders
  { id: 'SMT-S61-01', smtLine: 'S61', pcaLine: 'P61', plant: 'TP05', dType: 'NPI', model: '1395A3847901', family: 'NPI', date: '2026/08/10', planQty: 109, dayQty: 0, nightQty: 109, hasDay: false, hasNight: true, shifts: 1, mo: '0:000021365822' },
  { id: 'SMT-S61-02', smtLine: 'S61', pcaLine: 'P61', plant: 'TP05', dType: 'NPI', model: '1395A3847902', family: 'NPI', date: '2026/08/11', planQty: 31, dayQty: 31, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:21365824' },
  { id: 'SMT-S61-03', smtLine: 'S61', pcaLine: 'P61', plant: 'TP05', dType: 'NPI', model: '1395A3847901', family: 'NPI', date: '2026/08/12', planQty: 28, dayQty: 28, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:000021365822' },
  { id: 'SMT-S61-04', smtLine: 'S61', pcaLine: 'P61', plant: 'TP05', dType: 'NPI', model: '1395A3847901', family: 'NPI', date: '2026/08/13', planQty: 30, dayQty: 30, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:000021365822' },
  { id: 'SMT-S61-05', smtLine: 'S61', pcaLine: 'P61', plant: 'TP05', dType: 'NPI', model: '1395A3847902', family: 'NPI', date: '2026/08/20', planQty: 16, dayQty: 0, nightQty: 16, hasDay: false, hasNight: true, shifts: 1, mo: '0:000021368295' },
  { id: 'SMT-S61-06', smtLine: 'S61', pcaLine: 'P61', plant: 'TP05', dType: 'NPI', model: '1395A3847902', family: 'NPI', date: '2026/08/21', planQty: 14, dayQty: 14, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:000021368295' },

  // S71 Orders (Diorite, Everglades)
  { id: 'SMT-S71-01', smtLine: 'S71', pcaLine: 'P71', plant: 'TP05', dType: 'MP', model: '1395A3476812', family: 'EVERGLADES', date: '2026/08/24', planQty: 60, dayQty: 60, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032869876' },
  { id: 'SMT-S71-02', smtLine: 'S71', pcaLine: 'P71', plant: 'TP05', dType: 'NPI', model: '1395A3832503', family: 'DIORITE', date: '2026/08/25', planQty: 120, dayQty: 120, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032865242' },
  { id: 'SMT-S71-03', smtLine: 'S71', pcaLine: 'P71', plant: 'TP08', dType: 'NPI', model: '1395A3832503', family: 'DIORITE', date: '2026/08/27', planQty: 32, dayQty: 32, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032921077' },
  { id: 'SMT-S71-04', smtLine: 'S71', pcaLine: 'P71', plant: 'TP05', dType: 'NPI', model: '1395A3832504', family: 'DIORITE', date: '2026/08/27', planQty: 280, dayQty: 280, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032889897' },
  { id: 'SMT-S71-05', smtLine: 'S71', pcaLine: 'P71', plant: 'TP05', dType: 'NPI', model: '1395A3832504', family: 'DIORITE', date: '2026/08/28', planQty: 624, dayQty: 279, nightQty: 345, hasDay: true, hasNight: true, shifts: 2, mo: '0:100032889897' },

  // S72 Orders (Diorite, NPI)
  { id: 'SMT-S72-01', smtLine: 'S72', pcaLine: 'P72', plant: 'TP05', dType: 'NPI', model: '1395A3830303', family: 'NPI', date: '2026/08/03', planQty: 8, dayQty: 8, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:21362568' },
  { id: 'SMT-S72-02', smtLine: 'S72', pcaLine: 'P72', plant: 'TP05', dType: 'NPI', model: '1395A3832503', family: 'DIORITE', date: '2026/08/04', planQty: 48, dayQty: 48, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032736606' },
  { id: 'SMT-S72-03', smtLine: 'S72', pcaLine: 'P72', plant: 'TP05', dType: 'NPI', model: '1395A3830303', family: 'NPI', date: '2026/08/06', planQty: 8, dayQty: 8, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:21362562' },
  { id: 'SMT-S72-04', smtLine: 'S72', pcaLine: 'P72', plant: 'TP05', dType: 'NPI', model: '1395A3832504', family: 'DIORITE', date: '2026/08/06', planQty: 36, dayQty: 0, nightQty: 36, hasDay: false, hasNight: true, shifts: 1, mo: '0:100032769090' },
  { id: 'SMT-S72-05', smtLine: 'S72', pcaLine: 'P72', plant: 'TP05', dType: 'NPI', model: '1395A3830303', family: 'NPI', date: '2026/08/12', planQty: 12, dayQty: 12, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:21366327' },

  // S73 Orders (Viztruck)
  { id: 'SMT-S73-01', smtLine: 'S73', pcaLine: 'P73', plant: 'TP05', dType: 'MP', model: '1395A3426001', family: 'VIZTRUCK', date: '2026/08/20', planQty: 30, dayQty: 30, nightQty: 0, hasDay: true, hasNight: false, shifts: 1, mo: '0:100032838873' },
];

// Helper to build August SMT Line Summaries with paired PCA continuity
export function getAugustSmtLineSummaries(): SmtLineSummary[] {
  const lineKeys = Object.keys(SMT_PAIRS_CONFIG);
  const result: SmtLineSummary[] = [];

  for (const line of lineKeys) {
    const cfg = SMT_PAIRS_CONFIG[line];
    const orders = AUGUST_SMT_ORDERS.filter(o => o.smtLine === line);
    const daily: SmtLineSummary['daily'] = {};

    let totalPlanQty = 0;
    const activeDates = new Set<string>();

    for (let day = 1; day <= 31; day++) {
      const dt = `2026/08/${String(day).padStart(2, '0')}`;
      const dayOrders = orders.filter(o => o.date === dt);
      const dayQty = dayOrders.reduce((sum, o) => sum + o.dayQty, 0);
      const nightQty = dayOrders.reduce((sum, o) => sum + o.nightQty, 0);
      const totalQty = dayQty + nightQty;
      const hasDay = dayQty > 0 || dayOrders.some(o => o.hasDay);
      const hasNight = nightQty > 0 || dayOrders.some(o => o.hasNight);
      const shifts = (hasDay ? 1 : 0) + (hasNight ? 1 : 0);

      const smtDL = shifts * cfg.smtDL;
      const pcaDL = shifts * cfg.pcaDL; // SMT -> PCA continuous staffing requirement!
      const totalDL = smtDL + pcaDL;

      if (shifts > 0) activeDates.add(dt);
      totalPlanQty += totalQty;

      daily[dt] = {
        dayQty,
        nightQty,
        totalQty,
        hasDay,
        hasNight,
        shifts,
        smtDL,
        pcaDL,
        totalDL,
      };
    }

    result.push({
      smtLine: line,
      pcaLine: cfg.pca,
      plant: cfg.plant,
      smtStdDL: cfg.smtDL,
      pcaStdDL: cfg.pcaDL,
      totalPairStdDL: cfg.smtDL + cfg.pcaDL,
      totalPlanQty,
      activeDays: activeDates.size,
      daily,
    });
  }

  return result;
}

export const AUGUST_SMT_LINE_SUMMARIES = getAugustSmtLineSummaries();
