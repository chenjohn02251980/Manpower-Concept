import React, { useState, useEffect } from 'react';
import { ViewTab, IeStandardSubTab, AnnualManpowerTab } from '../types';

interface SidebarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  ieSubTab?: IeStandardSubTab;
  onIeSubTabChange?: (subTab: IeStandardSubTab) => void;
  overviewSubTab?: AnnualManpowerTab;
  onOverviewSubTabChange?: (subTab: 'trend' | 'matrix') => void;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  ieSubTab = 'historical_trend',
  onIeSubTabChange,
  overviewSubTab = 'trend',
  onOverviewSubTabChange,
  onOpenSettings,
  onOpenSupport,
}) => {
  const [ieMenuExpanded, setIeMenuExpanded] = useState<boolean>(true);
  const [overviewMenuExpanded, setOverviewMenuExpanded] = useState<boolean>(true);

  // Automatically expand IE menu whenever IE Standard is active
  useEffect(() => {
    if (activeTab === 'ie_forecast') {
      setIeMenuExpanded(true);
    }
  }, [activeTab]);

  // Automatically expand Overview menu whenever Executive Overview is active
  useEffect(() => {
    if (activeTab === 'overview') {
      setOverviewMenuExpanded(true);
    }
  }, [activeTab]);

  const navItems: {
    id: ViewTab;
    label: string;
    icon: string;
    badge?: string;
    badgeColor?: string;
    sublabel?: string;
  }[] = [
    {
      id: 'overview',
      label: 'EXECUTIVE OVERVIEW',
      icon: 'dashboard',
      badge: 'BUDGET HIT RATE',
      badgeColor: 'bg-[#a78bfa]/15 text-[#a78bfa] border-[#a78bfa]/35',
      sublabel: 'Yearly Budget • APS Hit Rate',
    },
    {
      id: 'aps_demand',
      label: 'APS DEMAND',
      icon: 'precision_manufacturing',
      badge: 'DL VARIABLE',
      badgeColor: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/35',
      sublabel: 'Capacity Linked • IDL Fixed',
    },
    {
      id: 'hr_actual',
      label: 'HR ACTUAL',
      icon: 'groups',
      badge: 'HR BUDGET SYNC',
      badgeColor: 'bg-[#5de6ff]/15 text-[#5de6ff] border-[#5de6ff]/35',
      sublabel: 'Yearly Budget Manpower Sync',
    },
    {
      id: 'ie_forecast',
      label: 'IE STANDARD',
      icon: 'analytics',
      badge: 'BASE SETUP',
      badgeColor: 'bg-[#ffb86b]/15 text-[#ffb86b] border-[#ffb86b]/35',
      sublabel: 'Monthly DL + IDL Standard',
    },
  ];

  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 border-r border-[#524437]/60 bg-[#1C1D22] py-8 flex flex-col z-50 select-none">
      <div className="px-6 mb-8">
        <h1 className="font-['Inter'] text-xl font-bold text-[#ffb86b] tracking-tight">
          IEC Manpower
        </h1>
        <p className="font-['JetBrains_Mono'] text-xs text-[#d7c3b2]/70 uppercase tracking-widest mt-1">
          Workforce Central
        </p>
      </div>

      <nav className="flex-grow overflow-y-auto custom-scrollbar">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isIeStandard = item.id === 'ie_forecast';
            const isOverview = item.id === 'overview';

            return (
              <li key={item.id} className="px-3">
                <button
                  onClick={() => {
                    onTabChange(item.id);
                    if (isIeStandard) {
                      if (activeTab === 'ie_forecast') {
                        setIeMenuExpanded((prev) => !prev);
                      } else {
                        setIeMenuExpanded(true);
                      }
                    }
                    if (isOverview) {
                      if (activeTab === 'overview') {
                        setOverviewMenuExpanded((prev) => !prev);
                      } else {
                        setOverviewMenuExpanded(true);
                      }
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm transition-all duration-200 text-left rounded-lg group ${
                    isActive
                      ? "text-[#e5e1e6] font-bold bg-[#2a292d] relative before:content-[''] before:absolute before:left-0 before:w-1 before:h-6 before:bg-[#ffb86b] before:rounded-full shadow-sm"
                      : "text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#2a292d]/50 font-normal"
                  }`}
                  title={
                    item.id === 'overview'
                      ? 'Executive Overview: Annual Manpower Trend & Plant Summary Matrix'
                      : item.id === 'aps_demand'
                      ? 'APS Demand: DL (Online/Offline) scales with capacity; IDL remains fixed'
                      : item.id === 'hr_actual'
                      ? 'HR Actual: Connected to HR System Yearly Budget Manpower & Payroll Tracking'
                      : item.id === 'ie_forecast'
                      ? 'IE Standard: Click to open/toggle sub-options (Historical Manpower Trend & Function Configuration)'
                      : item.label
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`material-symbols-outlined text-lg shrink-0 ${
                        isActive ? 'text-[#ffb86b]' : 'text-[#d7c3b2]/70 group-hover:text-[#ffb86b]'
                      }`}
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-['Inter'] font-semibold leading-tight">
                        {item.label}
                      </span>
                      {item.sublabel && (
                        <span className="block text-[10px] text-[#d7c3b2]/60 truncate font-['Inter'] leading-tight mt-0.5">
                          {item.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-['JetBrains_Mono'] font-bold border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {(isIeStandard || isOverview) && (
                      <span
                        className={`material-symbols-outlined text-base transition-transform duration-200 ${
                          isActive ? 'text-[#ffb86b]' : 'text-[#d7c3b2]/50'
                        } ${(isIeStandard && ieMenuExpanded) || (isOverview && overviewMenuExpanded) ? 'rotate-180' : ''}`}
                      >
                        keyboard_arrow_down
                      </span>
                    )}
                  </div>
                </button>

                {/* Submenu for EXECUTIVE OVERVIEW: Annual Manpower Trend / Plant Summary Matrix */}
                {isOverview && overviewMenuExpanded && (
                  <div className="mt-1.5 ml-4 pl-2.5 border-l-2 border-[#a78bfa]/40 space-y-1 py-1">
                    {/* Sub-item 1: Annual Manpower Trend */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('overview');
                        onOverviewSubTabChange?.('trend');
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-['Inter'] transition-all text-left ${
                        activeTab === 'overview' && (overviewSubTab === 'trend' || !overviewSubTab)
                          ? 'bg-[#ffb86b]/20 text-[#ffb86b] font-bold border border-[#ffb86b]/50 shadow-sm'
                          : 'text-[#d7c3b2]/75 hover:text-[#e5e1e6] hover:bg-[#2a292d]/60 font-medium'
                      }`}
                      title="Annual Manpower Trend (Chart & Comparison)"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`material-symbols-outlined text-base shrink-0 ${
                            activeTab === 'overview' && (overviewSubTab === 'trend' || !overviewSubTab)
                              ? 'text-[#ffb86b]'
                              : 'text-[#d7c3b2]/60'
                          }`}
                        >
                          equalizer
                        </span>
                        <span className="truncate leading-tight">Annual Manpower Trend</span>
                      </div>
                      {activeTab === 'overview' && (overviewSubTab === 'trend' || !overviewSubTab) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb86b] shrink-0" />
                      )}
                    </button>

                    {/* Sub-item 2: Plant Summary Matrix */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('overview');
                        onOverviewSubTabChange?.('matrix');
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-['Inter'] transition-all text-left ${
                        activeTab === 'overview' && overviewSubTab === 'matrix'
                          ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/50 shadow-sm'
                          : 'text-[#d7c3b2]/75 hover:text-[#e5e1e6] hover:bg-[#2a292d]/60 font-medium'
                      }`}
                      title="Plant Summary Matrix (Multi-Plant Table)"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`material-symbols-outlined text-base shrink-0 ${
                            activeTab === 'overview' && overviewSubTab === 'matrix'
                              ? 'text-[#38bdf8]'
                              : 'text-[#d7c3b2]/60'
                          }`}
                        >
                          factory
                        </span>
                        <span className="truncate leading-tight">Plant Summary Matrix</span>
                      </div>
                      {activeTab === 'overview' && overviewSubTab === 'matrix' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shrink-0" />
                      )}
                    </button>
                  </div>
                )}

                {/* Submenu for IE STANDARD */}
                {isIeStandard && ieMenuExpanded && (
                  <div className="mt-1.5 ml-4 pl-2.5 border-l-2 border-[#ffb86b]/40 space-y-1 py-1">
                    {/* Sub-item 1: Historical Manpower Trend */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('ie_forecast');
                        onIeSubTabChange?.('historical_trend');
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-['Inter'] transition-all text-left ${
                        activeTab === 'ie_forecast' && ieSubTab === 'historical_trend'
                          ? 'bg-[#ffb86b]/20 text-[#ffb86b] font-bold border border-[#ffb86b]/50 shadow-sm'
                          : 'text-[#d7c3b2]/75 hover:text-[#e5e1e6] hover:bg-[#2a292d]/60 font-medium'
                      }`}
                      title="1. Historical Manpower Trend (Overview & Trend Charts)"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`material-symbols-outlined text-base shrink-0 ${
                            activeTab === 'ie_forecast' && ieSubTab === 'historical_trend'
                              ? 'text-[#ffb86b]'
                              : 'text-[#d7c3b2]/60'
                          }`}
                        >
                          trending_up
                        </span>
                        <span className="truncate leading-tight">Historical Manpower Trend</span>
                      </div>
                      {activeTab === 'ie_forecast' && ieSubTab === 'historical_trend' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb86b] shrink-0" />
                      )}
                    </button>

                    {/* Sub-item 2: Function Configuration */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('ie_forecast');
                        onIeSubTabChange?.('five_functions');
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-['Inter'] transition-all text-left ${
                        activeTab === 'ie_forecast' && ieSubTab === 'five_functions'
                          ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/50 shadow-sm'
                          : 'text-[#d7c3b2]/75 hover:text-[#e5e1e6] hover:bg-[#2a292d]/60 font-medium'
                      }`}
                      title="Function Configuration (Plant Line Maintenance)"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`material-symbols-outlined text-base shrink-0 ${
                            activeTab === 'ie_forecast' && ieSubTab === 'five_functions'
                              ? 'text-[#38bdf8]'
                              : 'text-[#d7c3b2]/60'
                          }`}
                        >
                          tune
                        </span>
                        <span className="truncate leading-tight">Function Configuration</span>
                      </div>
                      {activeTab === 'ie_forecast' && ieSubTab === 'five_functions' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shrink-0" />
                      )}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 mt-auto space-y-1 pt-4 border-t border-[#524437]/30">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#2a292d]/50 transition-colors text-left rounded-md"
        >
          <span className="material-symbols-outlined text-lg text-[#d7c3b2]/70">
            settings
          </span>
          <span>Settings</span>
        </button>
        <button
          onClick={onOpenSupport}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#d7c3b2]/80 hover:text-[#e5e1e6] hover:bg-[#2a292d]/50 transition-colors text-left rounded-md"
        >
          <span className="material-symbols-outlined text-lg text-[#d7c3b2]/70">
            help
          </span>
          <span>Support</span>
        </button>
      </div>
    </aside>
  );
};
