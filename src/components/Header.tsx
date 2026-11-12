import React, { useState } from 'react';
import { ViewTab, SiteData, TimePeriod, CurrentUser } from '../types';

interface HeaderProps {
  activeTab: ViewTab;
  currentSite: SiteData;
  sites: Record<string, SiteData>;
  onSelectSite: (siteId: string) => void;
  timePeriod: TimePeriod;
  onToggleTimePeriod: (period: TimePeriod) => void;
  selectedYear?: number;
  selectedMonth?: number;
  onChangeYear?: (year: number) => void;
  onChangeMonth?: (month: number) => void;
  unreadNotifCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenDownloadReport?: () => void;
  onTabChange: (tab: ViewTab) => void;
  currentUser?: CurrentUser;
  onSwitchUser?: (user: CurrentUser) => void;
  availableUsers?: CurrentUser[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentSite,
  sites,
  onSelectSite,
  timePeriod,
  onToggleTimePeriod,
  selectedYear = 2026,
  selectedMonth = 9,
  onChangeYear = (_year: number) => {},
  onChangeMonth = (_month: number) => {},
  unreadNotifCount,
  onOpenNotifications,
  onOpenSettings,
  onOpenDownloadReport,
  onTabChange,
  currentUser,
  onSwitchUser,
  availableUsers,
}) => {
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const hasEditPermission =
    !currentUser ||
    currentUser.plantScope === 'all' ||
    currentUser.plantScope === currentSite.id ||
    currentUser.plantScope === currentSite.code?.toLowerCase();

  const getTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Executive Overview';
      case 'aps_demand':
        return 'APS Demand Schedule';
      case 'hr_actual':
        return 'HR Actual Headcounts';
      case 'global_feedback':
        return 'Global IE Feedback & Revisions';
      case 'ie_forecast':
      default:
        return 'IE Standard Manpower';
    }
  };

  const monthNames = [
    { m: 1, label: 'January' },
    { m: 2, label: 'February' },
    { m: 3, label: 'March' },
    { m: 4, label: 'April' },
    { m: 5, label: 'May' },
    { m: 6, label: 'June' },
    { m: 7, label: 'July' },
    { m: 8, label: 'August' },
    { m: 9, label: 'September' },
    { m: 10, label: 'October' },
    { m: 11, label: 'November' },
    { m: 12, label: 'December' },
  ];

  const nextMonthNumber = selectedMonth === 12 ? 1 : selectedMonth + 1;
  const nextMonthName = monthNames.find((m) => m.m === nextMonthNumber)?.label || '';

  return (
    <header className="h-16 w-full border-b border-[#524437]/60 bg-[#131316]/95 backdrop-blur-md flex justify-between items-center px-10 shrink-0 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="font-['Inter'] text-lg md:text-xl font-bold text-[#ffb86b] tracking-tight">
          {getTitle()}
        </h2>
        <div className="h-5 w-[1px] bg-[#524437]/60 mx-1 hidden sm:block"></div>
        <button
          onClick={() => onTabChange('overview')}
          className="text-[#d7c3b2]/80 hover:text-[#ffb86b] transition-colors text-sm font-medium hidden sm:block"
        >
          Dashboard
        </button>

        {/* Site Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSiteDropdown(!showSiteDropdown)}
            title={
              currentSite.id === 'tao' || currentSite.code === 'TAO'
                ? 'TAO Plant Scope (Divisions: TP05, TP08, TP11, TP12, TP15, TP16 are all under TAO)'
                : `Plant Scope: ${currentSite.name}`
            }
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border transition-all text-sm ${
              currentSite.id === 'overall'
                ? 'bg-[#2a292d] border-[#ffb86b]/50 text-[#ffb86b] font-medium'
                : currentSite.id === 'tao' || currentSite.code === 'TAO'
                ? 'bg-[#1C1D22] border-[#ffb86b]/70 hover:border-[#ffb86b] text-[#e5e1e6] shadow-md ring-1 ring-[#ffb86b]/20'
                : 'bg-[#2a292d] border-transparent hover:border-[#ffb86b]/60 text-[#e5e1e6]'
            }`}
          >
            <span className="material-symbols-outlined text-[#ffb86b] text-base">
              {currentSite.id === 'overall'
                ? 'public'
                : currentSite.id === 'tao' || currentSite.code === 'TAO'
                ? 'domain'
                : 'location_on'}
            </span>
            <div className="flex items-center gap-2 text-left">
              <span className="font-semibold text-[#e5e1e6]">
                {currentSite.id === 'tao' || currentSite.code === 'TAO'
                  ? 'TAO'
                  : currentSite.name}
              </span>
              {(currentSite.id === 'tao' || currentSite.code === 'TAO') && (
                <span
                  title="APS simulation data (TP05, TP08, TP11, TP12, TP15, TP16) ready"
                  className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_6px_#4edea3]"
                ></span>
              )}
              {currentUser && (
                <span
                  className={`text-[9px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                    hasEditPermission
                      ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40'
                      : 'bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/40'
                  }`}
                  title={
                    hasEditPermission
                      ? `【${currentUser.name}】具備維護此廠資料權限`
                      : `權限限制：僅 ${currentSite.name} IE 可維護此廠資料（目前以 ${currentUser.name} 登入，唯讀檢視）`
                  }
                >
                  <span className="material-symbols-outlined text-[10px]">
                    {hasEditPermission ? 'check_circle' : 'lock'}
                  </span>
                  {hasEditPermission ? 'Maintainable' : 'Read-Only'}
                </span>
              )}
            </div>
            <span className="material-symbols-outlined text-[#d7c3b2]/70 text-base">
              expand_more
            </span>
          </button>

          {showSiteDropdown && (
            <div className="absolute left-0 mt-2 w-72 max-h-[30rem] overflow-y-auto bg-[#1C1D22] border border-[#524437] rounded-lg shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 custom-scrollbar">
              <div className="px-3 py-1.5 text-[10px] font-['JetBrains_Mono'] text-[#ffb86b] font-bold uppercase tracking-wider border-b border-[#524437]/40 sticky top-0 bg-[#1C1D22]/95 backdrop-blur-sm z-10 flex items-center justify-between">
                <span>Select Plant Scope</span>
                <span className="text-[9px] text-[#d7c3b2]/60">9 SITES + OVERALL</span>
              </div>

              {/* OVERALL Option */}
              <div className="p-1 border-b border-[#524437]/40 bg-[#161619]">
                <button
                  onClick={() => {
                    onSelectSite('overall');
                    setShowSiteDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-md flex items-center justify-between transition-colors ${
                    currentSite.id === 'overall'
                      ? 'bg-[#ffb86b]/20 text-[#ffb86b] font-bold border border-[#ffb86b]/50'
                      : 'text-[#ffb86b] hover:bg-[#2a292d] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#ffb86b]">
                      public
                    </span>
                    <div className="flex flex-col">
                      <span className="font-['Inter'] font-semibold">Overall</span>
                      <span className="text-[10px] text-[#d7c3b2]/70 font-normal">
                        Consolidated Total
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded bg-[#131316] text-[#ffb86b] border border-[#ffb86b]/40 font-bold">
                      ALL
                    </span>
                    <span className="text-[9px] font-['JetBrains_Mono'] text-[#d7c3b2]/60 bg-[#131316] px-1 py-0.5 rounded border border-[#524437]/30 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">visibility</span>
                      View
                    </span>
                  </div>
                </button>
              </div>

              {/* Individual Sites Header */}
              <div className="px-3 py-1 text-[9px] font-['JetBrains_Mono'] text-[#d7c3b2]/60 uppercase tracking-wider bg-[#131316]/80 flex items-center justify-between">
                <span>Individual Plants ({(Object.values(sites) as SiteData[]).filter((s) => s.id !== 'overall').length})</span>
                {currentUser && (
                  <span className="text-[9px] text-[#ffb86b]">User: {currentUser.name}</span>
                )}
              </div>

              {(Object.values(sites) as SiteData[])
                .filter((s) => s.id !== 'overall')
                .map((s) => {
                  const canMaintainPlant =
                    !currentUser ||
                    currentUser.plantScope === 'all' ||
                    currentUser.plantScope === s.id ||
                    currentUser.plantScope === s.code?.toLowerCase();
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectSite(s.id);
                        setShowSiteDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-colors border-b border-[#524437]/15 last:border-b-0 ${
                        s.id === currentSite.id
                          ? 'bg-[#2a292d] text-[#ffb86b] font-bold'
                          : 'text-[#e5e1e6] hover:bg-[#2a292d]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-[#d7c3b2]/60">
                          {s.id === 'tao' ? 'domain' : 'location_on'}
                        </span>
                        <span className="font-['Inter'] font-semibold">
                          {s.id === 'tao' || s.code === 'TAO' ? 'TAO' : s.name}
                        </span>
                        {s.id === 'tao' && (
                          <span className="text-[9px] font-['JetBrains_Mono'] text-[#4edea3] bg-[#4edea3]/10 px-1.5 py-0.2 rounded border border-[#4edea3]/30 font-semibold">
                            APS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded bg-[#131316] text-[#d7c3b2]/70 border border-[#524437]/30">
                          {s.code}
                        </span>
                        {currentUser && (
                          <span
                            className={`text-[9px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                              canMaintainPlant
                                ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold'
                                : 'bg-[#131316] text-[#d7c3b2]/50 border border-[#524437]/30'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[10px]">
                              {canMaintainPlant ? 'edit' : 'lock'}
                            </span>
                            {canMaintainPlant ? 'Maintain' : 'Read-Only'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Year and Month Selector (Jan - Dec) - Monthly W3 Cycle Planning */}
        <div
          id="header-period-selector"
          className="flex items-center bg-[#201f23] p-1 rounded-lg border border-[#524437]/50 shadow-inner gap-1.5"
        >
          {/* Year Selector */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-[#ffb86b] text-xs pl-1.5 pointer-events-none">
              calendar_month
            </span>
            <select
              value={selectedYear}
              onChange={(e) => onChangeYear(Number(e.target.value))}
              className="bg-transparent text-xs font-['JetBrains_Mono'] font-bold text-[#e5e1e6] py-1 pl-1.5 pr-4 rounded focus:outline-none focus:text-[#ffb86b] cursor-pointer appearance-none"
              title="Select Year"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-[#1C1D22] text-[#e5e1e6]">
                  {y}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[11px] text-[#d7c3b2]/60 -ml-3 pointer-events-none">
              arrow_drop_down
            </span>
          </div>

          <div className="w-[1px] h-4 bg-[#524437]/60"></div>

          {/* Month Stepper Prev */}
          <button
            onClick={() => onChangeMonth(selectedMonth === 1 ? 12 : selectedMonth - 1)}
            className="p-1 rounded hover:bg-[#2a292d] text-[#d7c3b2]/70 hover:text-[#ffb86b] transition-colors"
            title="Previous Month"
          >
            <span className="material-symbols-outlined text-xs">chevron_left</span>
          </button>

          {/* Month Selector (Jan - Dec) */}
          <div className="relative flex items-center">
            <select
              value={selectedMonth}
              onChange={(e) => onChangeMonth(Number(e.target.value))}
              className="bg-[#2a292d] text-xs font-['JetBrains_Mono'] font-bold text-[#ffb86b] py-1 pl-2.5 pr-6 rounded border border-[#ffb86b]/40 hover:border-[#ffb86b] focus:outline-none cursor-pointer appearance-none shadow-sm"
              title="Select Month (Jan - Dec)"
            >
              {monthNames.map((item) => (
                <option key={item.m} value={item.m} className="bg-[#1C1D22] text-[#e5e1e6]">
                  {item.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[13px] text-[#ffb86b] -ml-4 pointer-events-none">
              arrow_drop_down
            </span>
          </div>

          {/* Month Stepper Next */}
          <button
            onClick={() => onChangeMonth(selectedMonth === 12 ? 1 : selectedMonth + 1)}
            className="p-1 rounded hover:bg-[#2a292d] text-[#d7c3b2]/70 hover:text-[#ffb86b] transition-colors"
            title="Next Month"
          >
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>

          {/* W3 Update Cycle Indicator */}
          <div
            className="hidden xl:flex items-center pl-2 pr-1.5 py-0.5 rounded bg-[#131316] border border-[#524437]/30 text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/80 gap-1.5"
            title="Monthly Week 3 cycle updates next month's APS Demand"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span className="text-[#4edea3] font-semibold">W3 Cycle</span>
            <span className="text-[#d7c3b2]/60">➔</span>
            <span className="text-[#ffb86b] font-medium">
              Next Month ({nextMonthName.slice(0, 3)}) APS
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 text-[#d7c3b2]">
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg hover:bg-[#2a292d] hover:text-[#ffb86b] transition-colors cursor-pointer"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F43F5E] rounded-full animate-pulse"></span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg hover:bg-[#2a292d] hover:text-[#ffb86b] transition-colors"
            title="Settings"
          >
            <span className="material-symbols-outlined text-xl">settings_suggest</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-[#9f8e7e]/50 hover:border-[#ffb86b] transition-all bg-[#1C1D22]"
              title={`Logged in as ${currentUser?.name || 'TAO IE'} (${currentUser?.plantName || 'TAO'} Site Only)`}
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border border-[#ffb86b]/60 shrink-0">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjjTx6gqD7tvczdd17PimuEXKI0u7op1FX9DfRfN1pZ1wex9zL1MRqM_TEjvPaK__9RkN551ZvLpNNmLc_Ry16o_RuEGbuk3OdyNcUUW4vVSCN5vZxjoWAfFh7SrHUJmRQA42eEdnAHOCA9Lk3Dheo23nNtuB2MAjQ3NQht6ttVPDtXBxM59zg-gFsjPDh0St6k-8LKdmNcEQJNsgip1MC2_nkKM7-JGDM3cI8eNQbnaOq3DF5D0UlXQ"
                  alt="User Profile Avatar"
                />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-[#e5e1e6] leading-none">
                  {currentUser?.name || 'TAO IE'}
                </span>
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#ffb86b] leading-tight">
                  {currentUser?.plantName || 'TAO'} Scope
                </span>
              </div>
              <span className="material-symbols-outlined text-xs text-[#d7c3b2]/60">
                arrow_drop_down
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1C1D22] border border-[#524437] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-[#524437]/40">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#e5e1e6] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#ffb86b] text-base">badge</span>
                      {currentUser?.name || 'TAO IE'}
                    </p>
                    <span className="px-1.5 py-0.5 rounded bg-[#ffb86b]/20 border border-[#ffb86b]/50 text-[#ffb86b] text-[9px] font-['JetBrains_Mono'] font-bold uppercase">
                      {currentUser?.plantScope === 'all' ? 'GLOBAL ADMIN' : `${currentUser?.plantName} IE`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#d7c3b2]/70 font-['JetBrains_Mono'] mt-0.5">
                    {currentUser?.role || 'TAO Plant IE Specialist'}
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#524437]/30 text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/80">
                    <span className="text-[#ffb86b]">維護權限範圍：</span>
                    {currentUser?.plantScope === 'all'
                      ? ' 全廠區具備維護與編輯權限'
                      : ` 僅能維護【${currentUser?.plantName}】廠資料，其餘廠區唯讀`}
                  </div>
                </div>

                {/* Role Switcher for Testing/Role Switching */}
                {availableUsers && availableUsers.length > 0 && onSwitchUser && (
                  <div className="px-3 py-2 border-b border-[#524437]/40 bg-[#161619]">
                    <p className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#ffb86b]">swap_horiz</span>
                      切換 IE 身份 / 廠區權限:
                    </p>
                    <div className="space-y-1">
                      {availableUsers.map((u) => {
                        const isCurrent = currentUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-[#ffb86b]/20 text-[#ffb86b] font-bold border border-[#ffb86b]/40'
                                : 'text-[#e5e1e6] hover:bg-[#2a292d]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-xs">
                                {u.plantScope === 'all' ? 'shield' : 'person'}
                              </span>
                              <span>{u.name}</span>
                            </div>
                            <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/60">
                              {u.plantName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-1.5 text-xs text-[#e5e1e6] hover:bg-[#2a292d] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">tune</span>
                    System Parameters
                  </button>
                  <button
                    onClick={() => {
                      onOpenNotifications();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-1.5 text-xs text-[#e5e1e6] hover:bg-[#2a292d] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">history</span>
                    Audit Logs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
