import React, { useState } from 'react';
import { SiteData, MonthDepartmentManpower, CurrentUser } from '../types';
import {
  MONTH_SEASONAL_FACTORS,
  getOrInitSiteMonthlyData,
  applyMonthSnapshotToSite,
  directUpdateDepartmentManpower,
  copyMonthData,
  syncCurrentMonthToAll,
} from '../utils/monthlyDepartmentHelper';

interface FiveDepartmentMonthlyMaintenanceProps {
  site: SiteData;
  onUpdateSite: (updatedSite: SiteData) => void;
  selectedMonth: number;
  selectedYear: number;
  onChangeMonth?: (month: number) => void;
  currentUser?: CurrentUser;
}

export const FiveDepartmentMonthlyMaintenance: React.FC<FiveDepartmentMonthlyMaintenanceProps> = ({
  site,
  onUpdateSite,
  selectedMonth,
  selectedYear,
  onChangeMonth,
  currentUser,
}) => {
  const [showMatrixView, setShowMatrixView] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Permission check: only the IE belonging to this plant (or Global IE Admin) can maintain
  const hasEditPermission =
    !currentUser ||
    currentUser.plantScope === 'all' ||
    currentUser.plantScope === site.id ||
    currentUser.plantScope === site.code?.toLowerCase();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Ensure monthly department data is initialized for all 12 months
  const monthlyData: Record<number, MonthDepartmentManpower> = getOrInitSiteMonthlyData(site);
  const currentMonthData = monthlyData[selectedMonth] || monthlyData[9] || Object.values(monthlyData)[0];

  const handleMonthSelect = (month: number) => {
    if (onChangeMonth) {
      onChangeMonth(month);
    }
    // Also apply the month's snapshot to top-level site fields
    const updated = applyMonthSnapshotToSite(site, month);
    onUpdateSite(updated);
  };

  const handleQuickCopyNext = () => {
    if (!hasEditPermission) {
      showToast(
        `[Permission Notice] Logged in as [${currentUser?.name}]. You can only maintain [${currentUser?.plantName}] plant data, not [${site.name}] plant!`
      );
      return;
    }
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const updated = copyMonthData(site, selectedMonth, nextMonth, selectedMonth);
    onUpdateSite(updated);
    showToast(`Successfully copied 5 Dept baseline configuration from Month ${selectedMonth} to Month ${nextMonth}`);
  };

  const handleSyncAllMonths = () => {
    if (!hasEditPermission) {
      showToast(
        `[Permission Notice] Logged in as [${currentUser?.name}]. You can only maintain [${currentUser?.plantName}] plant data, not [${site.name}] plant!`
      );
      return;
    }
    const updated = syncCurrentMonthToAll(site, selectedMonth, selectedMonth);
    onUpdateSite(updated);
    showToast(`Synchronized Month ${selectedMonth} 5 Dept baseline data to all 12 months (Jan-Dec)`);
  };

  const handleDirectEdit = (
    dept: 'mfg' | 'qc' | 'ts' | 'wh' | 'other',
    field: 'dl' | 'idl',
    value: number,
    targetMonth = selectedMonth
  ) => {
    if (!hasEditPermission) {
      showToast(
        `[Permission Notice] Logged in as [${currentUser?.name}]. You can only maintain [${currentUser?.plantName}] plant data, not [${site.name}] plant!`
      );
      return;
    }
    const updated = directUpdateDepartmentManpower(
      site,
      targetMonth,
      dept,
      field,
      value,
      selectedMonth
    );
    onUpdateSite(updated);
  };

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#ffb86b]/20 border border-[#ffb86b] rounded-lg text-xs font-['JetBrains_Mono'] text-[#ffb86b] shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#ffb86b]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#d7c3b2]/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main Monthly Maintenance Control Container */}
      <div className="bg-[#1C1D22] border-2 border-[#ffb86b]/50 rounded-xl overflow-hidden shadow-xl">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2c221a] via-[#1f1e24] to-[#1C1D22] border-b border-[#524437]/70">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Purpose */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ffb86b]/20 border border-[#ffb86b]/60 flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[#ffb86b] text-2xl">
                  calendar_month
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#ffb86b] text-[#331c00] font-black text-[10px] rounded uppercase font-['JetBrains_Mono'] tracking-wider">
                    Monthly Maintenance
                  </span>
                  <h3 className="font-['Inter'] text-lg sm:text-xl font-bold text-[#e5e1e6]">
                    Monthly DL & IDL Maintenance
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs font-['JetBrains_Mono']">
                  <span className="text-[#d7c3b2]/80">
                    Total Factory DL: <strong className="text-[#ffb86b]">{currentMonthData.totalDL}</strong> HC
                  </span>
                  <span className="text-[#524437]">•</span>
                  <span className="text-[#d7c3b2]/80">
                    Total Factory IDL: <strong className="text-[#5de6ff]">{currentMonthData.totalIDL}</strong> HC
                  </span>
                  <span className="text-[#524437]">•</span>
                  <span className="text-[#d7c3b2]/80">
                    DL:IDL: <strong className="text-[#4edea3]">{currentMonthData.dlRatio}</strong>
                  </span>
                  <span className="text-[#524437]">•</span>
                  <span className="px-2 py-0.5 rounded bg-[#131316] border border-[#ffb86b]/40 text-[#ffb86b] font-bold">
                    Total Factory HC: {currentMonthData.totalHeadcount} HC
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & View Mode Toggle */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {!hasEditPermission && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ff6b6b]/15 border border-[#ff6b6b]/40 rounded-lg text-xs font-['JetBrains_Mono'] text-[#ff8787]">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Read-Only (Requires {site.code} IE permission)</span>
                </div>
              )}

              <button
                id="btn-copy-next-month"
                onClick={handleQuickCopyNext}
                disabled={!hasEditPermission}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['JetBrains_Mono'] font-bold transition-all shadow-sm ${
                  hasEditPermission
                    ? 'bg-[#131316] hover:bg-[#201f23] text-[#ffb86b] border border-[#ffb86b]/40 cursor-pointer'
                    : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                }`}
                title={
                  hasEditPermission
                    ? `Copy Month ${selectedMonth} data to Month ${selectedMonth === 12 ? 1 : selectedMonth + 1}`
                    : `Read-Only: Only ${site.code} IE has maintenance permission`
                }
              >
                <span className="material-symbols-outlined text-sm">
                  {hasEditPermission ? 'content_copy' : 'lock'}
                </span>
                <span>Copy to Next Month (M+1)</span>
              </button>

              <button
                id="btn-sync-all-months"
                onClick={handleSyncAllMonths}
                disabled={!hasEditPermission}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['JetBrains_Mono'] font-bold transition-all shadow-sm ${
                  hasEditPermission
                    ? 'bg-[#131316] hover:bg-[#201f23] text-[#5de6ff] border border-[#5de6ff]/40 cursor-pointer'
                    : 'bg-[#17171a] text-[#d7c3b2]/40 border border-[#524437]/30 cursor-not-allowed opacity-60'
                }`}
                title={
                  hasEditPermission
                    ? `Sync Month ${selectedMonth} as baseline across all 12 months`
                    : `Read-Only: Only ${site.code} IE has maintenance permission`
                }
              >
                <span className="material-symbols-outlined text-sm">
                  {hasEditPermission ? 'sync' : 'lock'}
                </span>
                <span>Sync to All Months</span>
              </button>

              <button
                id="btn-toggle-matrix-view"
                onClick={() => setShowMatrixView(!showMatrixView)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['JetBrains_Mono'] font-bold transition-all border shadow-sm ${
                  showMatrixView
                    ? 'bg-[#ffb86b] text-[#331c00] border-[#ffb86b]'
                    : 'bg-[#131316] hover:bg-[#201f23] text-[#e5e1e6] border-[#524437]/60'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {showMatrixView ? 'visibility_off' : 'grid_view'}
                </span>
                <span>{showMatrixView ? 'Hide 12-Month Matrix' : 'View 12-Month Matrix'}</span>
              </button>
            </div>
          </div>

          {/* Month Selector Tabs (Jan ~ Dec) */}
          <div className="mt-4 pt-3 border-t border-[#524437]/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-[#ffb86b]">date_range</span>
                Select Month to maintain baseline manpower
              </span>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#ffb86b]">
                Active Maintenance Month: <strong>Month {selectedMonth} ({MONTH_SEASONAL_FACTORS[selectedMonth]?.note || 'Regular Schedule'})</strong>
              </span>
            </div>

            {/* 12 Months Grid Buttons */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isSelected = m === selectedMonth;
                const mData = monthlyData[m];
                const totalManpower = mData ? mData.totalHeadcount : 0;
                const isModified = mData?.isModified;

                return (
                  <button
                    key={m}
                    id={`btn-month-select-${m}`}
                    onClick={() => handleMonthSelect(m)}
                    className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-[#ffb86b] text-[#331c00] border-[#ffb86b] font-extrabold shadow-md scale-102 ring-2 ring-[#ffb86b]/40'
                        : 'bg-[#131316] hover:bg-[#201f23] text-[#d7c3b2] border-[#524437]/50 hover:border-[#ffb86b]/50'
                    }`}
                  >
                    <span className="font-['JetBrains_Mono'] text-xs font-bold leading-none">
                      M{m < 10 ? `0${m}` : m}
                    </span>
                    <span
                      className={`font-['JetBrains_Mono'] text-[9px] mt-1 leading-none ${
                        isSelected ? 'text-[#331c00]/90 font-bold' : 'text-[#d7c3b2]/60'
                      }`}
                    >
                      {totalManpower > 0 ? `${totalManpower} HC` : '-'}
                    </span>
                    {isModified && !isSelected && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#4edea3]"
                        title="This month has been manually modified"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Optional 12-Month Matrix View Table */}
        {showMatrixView && (
          <div className="p-4 sm:p-5 bg-[#131316] border-t border-[#524437]/50 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb86b] text-base">table_chart</span>
                <h5 className="font-['JetBrains_Mono'] text-xs font-bold text-[#e5e1e6] uppercase">
                  Full-Year 12-Month 5 Departments DL / IDL Matrix (Click month to switch or edit values directly)
                </h5>
              </div>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/70">
                Click [Set Active] on any row to configure details for that month
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#524437]/40 bg-[#1C1D22]">
              <table className="w-full text-left font-['Inter'] text-xs">
                <thead className="bg-[#201f23] text-[#d7c3b2]/90 font-['JetBrains_Mono'] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center w-20">Month</th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center text-[#ffb86b]">
                      MANUFACTURING<br /><span className="text-[9px] font-normal text-[#d7c3b2]/70">DL / IDL</span>
                    </th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center">
                      QUALITY CONTROL<br /><span className="text-[9px] font-normal text-[#d7c3b2]/70">DL / IDL</span>
                    </th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center">
                      TROUBLE SHOOTING<br /><span className="text-[9px] font-normal text-[#d7c3b2]/70">DL / IDL</span>
                    </th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center">
                      WAREHOUSE<br /><span className="text-[9px] font-normal text-[#d7c3b2]/70">DL / IDL</span>
                    </th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center">
                      OTHER SUPPORT<br /><span className="text-[9px] font-normal text-[#d7c3b2]/70">IDL</span>
                    </th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-right text-[#ffb86b]">Factory DL</th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-right text-[#5de6ff]">Factory IDL</th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-right text-white font-bold">Total HC</th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center text-[#4edea3]">DL:IDL</th>
                    <th className="p-2.5 border-b border-[#524437]/40 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#524437]/20 font-['JetBrains_Mono'] text-xs">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const row = monthlyData[m];
                    const isSelected = m === selectedMonth;

                    return (
                      <tr
                        key={m}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-[#ffb86b]/10 hover:bg-[#ffb86b]/15'
                            : 'hover:bg-[#201f23]'
                        }`}
                      >
                        <td className="p-2.5 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              isSelected
                                ? 'bg-[#ffb86b] text-[#331c00] font-black'
                                : 'bg-[#131316] text-[#e5e1e6] border border-[#524437]/40'
                            }`}
                          >
                            M{m < 10 ? `0${m}` : m}
                          </span>
                        </td>
                        {/* MFG */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              disabled={!hasEditPermission}
                              value={row.mfgDL}
                              onChange={(e) => handleDirectEdit('mfg', 'dl', Number(e.target.value), m)}
                              className={`w-14 px-1 py-0.5 rounded text-center text-xs font-bold text-[#ffb86b] transition-colors ${
                                hasEditPermission
                                  ? 'bg-[#131316] border border-[#ffb86b]/30'
                                  : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                              }`}
                              title={hasEditPermission ? `M${m} MFG DL` : `Read-Only: Requires ${site.code} IE permission`}
                            />
                            <span className="text-[#524437]">/</span>
                            <input
                              type="number"
                              min="0"
                              disabled={!hasEditPermission}
                              value={row.mfgIDL}
                              onChange={(e) => handleDirectEdit('mfg', 'idl', Number(e.target.value), m)}
                              className={`w-12 px-1 py-0.5 rounded text-center text-xs font-bold text-[#5de6ff] transition-colors ${
                                hasEditPermission
                                  ? 'bg-[#131316] border border-[#5de6ff]/30'
                                  : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                              }`}
                              title={hasEditPermission ? `M${m} MFG IDL` : `Read-Only: Requires ${site.code} IE permission`}
                            />
                          </div>
                        </td>
                        {/* QC */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              disabled={!hasEditPermission}
                              value={row.qcDL}
                              onChange={(e) => handleDirectEdit('qc', 'dl', Number(e.target.value), m)}
                              className={`w-12 px-1 py-0.5 rounded text-center text-xs font-bold text-[#ffb86b] transition-colors ${
                                hasEditPermission
                                  ? 'bg-[#131316] border border-[#524437]/50'
                                  : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                              }`}
                              title={hasEditPermission ? `M${m} QC DL` : `Read-Only: Requires ${site.code} IE permission`}
                            />
                            <span className="text-[#524437]">/</span>
                            <input
                              type="number"
                              min="0"
                              disabled={!hasEditPermission}
                              value={row.qcIDL}
                              onChange={(e) => handleDirectEdit('qc', 'idl', Number(e.target.value), m)}
                              className={`w-12 px-1 py-0.5 rounded text-center text-xs font-bold text-[#5de6ff] transition-colors ${
                                hasEditPermission
                                  ? 'bg-[#131316] border border-[#524437]/50'
                                  : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                              }`}
                              title={hasEditPermission ? `M${m} QC IDL` : `Read-Only: Requires ${site.code} IE permission`}
                            />
                          </div>
                        </td>
                        {/* TS */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              disabled={!hasEditPermission}
                              value={row.tsDL}
                              onChange={(e) => handleDirectEdit('ts', 'dl', Number(e.target.value), m)}
                              className={`w-12 px-1 py-0.5 rounded text-center text-xs font-bold text-[#ffb86b] transition-colors ${
                                hasEditPermission
                                  ? 'bg-[#131316] border border-[#524437]/50'
                                  : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                              }`}
                              title={hasEditPermission ? `M${m} TS DL` : `Read-Only: Requires ${site.code} IE permission`}
                            />
                            <span className="text-[#524437]">/</span>
                            <input
                              type="number"
                              min="0"
                              disabled={!hasEditPermission}
                              value={row.tsIDL}
                              onChange={(e) => handleDirectEdit('ts', 'idl', Number(e.target.value), m)}
                              className={`w-12 px-1 py-0.5 rounded text-center text-xs font-bold text-[#5de6ff] transition-colors ${
                                hasEditPermission
                                  ? 'bg-[#131316] border border-[#524437]/50'
                                  : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                              }`}
                              title={hasEditPermission ? `M${m} TS IDL` : `Read-Only: Requires ${site.code} IE permission`}
                            />
                          </div>
                        </td>
                        {/* WH */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              disabled={!hasEditPermission}
                              value={row.whDL}
                              onChange={(e) => handleDirectEdit('wh', 'dl', Number(e.target.value), m)}
                              className={`w-12 px-1 py-0.5 rounded text-center text-xs font-bold text-[#ffb86b] transition-colors ${
                                hasEditPermission
                                  ? 'bg-[#131316] border border-[#524437]/50'
                                  : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                              }`}
                              title={hasEditPermission ? `M${m} WH DL` : `Read-Only: Requires ${site.code} IE permission`}
                            />
                            <span className="text-[#524437]">/</span>
                            <input
                              type="number"
                              min="0"
                              disabled={!hasEditPermission}
                              value={row.whIDL}
                              onChange={(e) => handleDirectEdit('wh', 'idl', Number(e.target.value), m)}
                              className={`w-12 px-1 py-0.5 rounded text-center text-xs font-bold text-[#5de6ff] transition-colors ${
                                hasEditPermission
                                  ? 'bg-[#131316] border border-[#524437]/50'
                                  : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                              }`}
                              title={hasEditPermission ? `M${m} WH IDL` : `Read-Only: Requires ${site.code} IE permission`}
                            />
                          </div>
                        </td>
                        {/* Other */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            disabled={!hasEditPermission}
                            value={row.otherIDL}
                            onChange={(e) => handleDirectEdit('other', 'idl', Number(e.target.value), m)}
                            className={`w-12 px-1 py-0.5 rounded text-center text-xs font-bold text-[#5de6ff] transition-colors ${
                              hasEditPermission
                                ? 'bg-[#131316] border border-[#524437]/50'
                                : 'bg-[#17171a] border border-[#524437]/30 cursor-not-allowed opacity-70'
                            }`}
                            title={hasEditPermission ? `M${m} Other IDL` : `Read-Only: Requires ${site.code} IE permission`}
                          />
                        </td>
                        {/* Totals */}
                        <td className="p-2.5 text-right font-bold text-[#ffb86b]">
                          {row.totalDL}
                        </td>
                        <td className="p-2.5 text-right font-bold text-[#5de6ff]">
                          {row.totalIDL}
                        </td>
                        <td className="p-2.5 text-right font-black text-white">
                          {row.totalHeadcount}
                        </td>
                        <td className="p-2.5 text-center text-[#4edea3] font-semibold">
                          {row.dlRatio}
                        </td>
                        <td className="p-2.5 text-center">
                          {isSelected ? (
                            <span className="text-[10px] text-[#ffb86b] font-bold">● Active</span>
                          ) : (
                            <button
                              onClick={() => handleMonthSelect(m)}
                              className="px-2 py-0.5 bg-[#ffb86b]/15 hover:bg-[#ffb86b]/30 text-[#ffb86b] border border-[#ffb86b]/40 rounded text-[10px] font-bold transition-all"
                            >
                              Set Active
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
