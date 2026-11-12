/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ViewTab, TimePeriod, SiteData, NotificationItem, FeedbackItem, IeStandardSubTab, AnnualManpowerTab } from './types';
import { INITIAL_SITES, INITIAL_NOTIFICATIONS, INITIAL_FEEDBACKS } from './data/mockData';
import { calculateSiteMetrics, calculateOverallSite } from './utils/calculations';
import { generateMonthlyApsPlan } from './utils/apsSchedule';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { IEForecastView } from './components/IEForecastView';
import { ExecutiveOverviewView } from './components/ExecutiveOverviewView';
import { ApsDemandView } from './components/ApsDemandView';
import { HrActualView } from './components/HrActualView';
import { GlobalFeedbackView } from './components/GlobalFeedbackView';
import { Footer } from './components/Footer';
import { NotificationsModal } from './components/NotificationsModal';
import { SettingsModal } from './components/SettingsModal';
import { HtmlReportDownloadModal } from './components/HtmlReportDownloadModal';

const LOCAL_STORAGE_KEY = 'iec_manpower_sites_v5';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [ieSubTab, setIeSubTab] = useState<IeStandardSubTab>(() => {
    try {
      const saved = localStorage.getItem('ie_standard_view_mode');
      if (saved === 'historical_trend' || saved === 'five_functions') {
        return saved as IeStandardSubTab;
      }
    } catch {
      // ignore
    }
    return 'historical_trend';
  });

  const handleIeSubTabChange = (sub: IeStandardSubTab) => {
    setIeSubTab(sub);
    try {
      localStorage.setItem('ie_standard_view_mode', sub);
    } catch {
      // ignore
    }
  };

  const [overviewSubTab, setOverviewSubTab] = useState<AnnualManpowerTab>(() => {
    try {
      const saved = localStorage.getItem('executive_annual_manpower_tab');
      if (saved === 'trend' || saved === 'matrix' || saved === 'both') {
        return saved as AnnualManpowerTab;
      }
    } catch {
      // ignore
    }
    return 'trend';
  });

  const handleOverviewSubTabChange = (tab: AnnualManpowerTab) => {
    setOverviewSubTab(tab);
    try {
      localStorage.setItem('executive_annual_manpower_tab', tab);
    } catch {
      // ignore
    }
  };

  const [currentSiteId, setCurrentSiteId] = useState<string>('overall');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('MONTHLY');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('14:32 Today');

  // Load sites from Embedded state (if in exported standalone HTML) or LocalStorage
  const [sites, setSites] = useState<Record<string, SiteData>>(() => {
    try {
      let parsed: any = null;

      // 1. Check embedded data from exported standalone HTML
      if (typeof window !== 'undefined' && (window as any).__IEC_EMBEDDED_SITES__) {
        const embedded = (window as any).__IEC_EMBEDDED_SITES__;
        if (embedded && typeof embedded === 'object' && Object.keys(embedded).length > 0) {
          parsed = embedded;
        }
      }

      // 2. Otherwise load from localStorage
      if (!parsed) {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          parsed = JSON.parse(saved);
        }
      }

      if (parsed) {
        // Normalize loaded sites with fallback for new fields
        const normalized: Record<string, SiteData> = {};
        for (const [key, site] of Object.entries(parsed as Record<string, any>)) {
          // Exclude internal sub-plants that belong inside TAO
          if (key === 'tp08' || key === 'tp15' || key === 'tp16' || !INITIAL_SITES[key]) {
            continue;
          }
          const initSite = INITIAL_SITES[key] || INITIAL_SITES.tao;
          normalized[key] = {
            ...initSite,
            ...site,
            plants: site.plants ?? initSite.plants,
            plantNote: site.plantNote ?? initSite.plantNote,
            yearlyBudgetManpower: site.yearlyBudgetManpower ?? initSite.yearlyBudgetManpower ?? 1290,
            yearlyBudgetDL: site.yearlyBudgetDL ?? initSite.yearlyBudgetDL ?? 1230,
            yearlyBudgetIDL: site.yearlyBudgetIDL ?? initSite.yearlyBudgetIDL ?? 60,
            actualHrIDL: site.actualHrIDL ?? initSite.actualHrIDL ?? 60,
            smtOfflineDL: site.smtOfflineDL ?? initSite.smtOfflineDL ?? 8,
            pcaOfflineDL: site.pcaOfflineDL ?? initSite.pcaOfflineDL ?? 6,
            assemblyOfflineDL: site.assemblyOfflineDL ?? initSite.assemblyOfflineDL ?? 12,
            smtLines: (site.smtLines || initSite.smtLines).map((l: any, idx: number) => ({
              ...l,
              shift: typeof l.shift === 'number' ? l.shift : (l.shift === 'Night' ? 2 : 1),
            })),
            pcaLines: (site.pcaLines || initSite.pcaLines).map((l: any, idx: number) => {
              const baseShift = typeof l.shift === 'number' ? l.shift : (l.shift === 'Night' ? 2 : 1);
              return {
                ...l,
                faShift: l.faShift ?? baseShift ?? 1,
                testShift: l.testShift ?? baseShift ?? 1,
                packingShift: l.packingShift ?? baseShift ?? 1,
              };
            }),
            cpuAssemblyLines: (site.cpuAssemblyLines || initSite.cpuAssemblyLines).map((l: any, idx: number) => {
              const baseShift = typeof l.shift === 'number' ? l.shift : (l.shift === 'Night' ? 2 : 1);
              return {
                ...l,
                assyShift: l.assyShift ?? baseShift ?? 1,
                testShift: l.testShift ?? baseShift ?? 1,
                packShift: l.packShift ?? baseShift ?? 1,
              };
            }),
            rackAssemblyLines: (site.rackAssemblyLines || initSite.rackAssemblyLines || []).map((l: any, idx: number) => {
              const baseShift = typeof l.shift === 'number' ? l.shift : (l.shift === 'Night' ? 2 : 1);
              return {
                ...l,
                assyShift: l.assyShift ?? baseShift ?? 1,
                testShift: l.testShift ?? baseShift ?? 1,
                packShift: l.packShift ?? baseShift ?? 1,
              };
            }),
            qualityControl: {
              ...initSite.qualityControl,
              ...(site.qualityControl || {}),
              pqcCostCenter: site.qualityControl?.pqcCostCenter ?? initSite.qualityControl?.pqcCostCenter,
              oqcCostCenter: site.qualityControl?.oqcCostCenter ?? initSite.qualityControl?.oqcCostCenter,
              pqcDL: site.qualityControl?.pqcDL ?? 0,
              pqcIDL:
                site.qualityControl?.pqcIDL ??
                ((site.qualityControl?.pqcDayShift || 0) + (site.qualityControl?.pqcNightShift || 0)),
            },
            troubleShooting: {
              ...initSite.troubleShooting,
              ...(site.troubleShooting || {}),
              costCenter: site.troubleShooting?.costCenter ?? initSite.troubleShooting?.costCenter,
            },
            warehouse: {
              ...initSite.warehouse,
              ...(site.warehouse || {}),
              costCenter: site.warehouse?.costCenter ?? initSite.warehouse?.costCenter,
            },
            otherSupport: {
              ...initSite.otherSupport,
              ...(site.otherSupport || {}),
              costCenter: site.otherSupport?.costCenter ?? initSite.otherSupport?.costCenter,
            },
          };
        }
        // Ensure all initial sites exist in normalized
        for (const [k, initVal] of Object.entries(INITIAL_SITES)) {
          if (!normalized[k]) {
            normalized[k] = initVal;
          }
        }
        return normalized;
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    return INITIAL_SITES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(INITIAL_FEEDBACKS);

  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showDownloadReport, setShowDownloadReport] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // Save sites to LocalStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sites));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }, [sites]);

  const overallSite = React.useMemo(() => calculateOverallSite(sites), [sites]);
  const currentSite =
    currentSiteId === 'overall'
      ? overallSite
      : sites[currentSiteId] || sites['tao'] || Object.values(sites)[0];
  const metrics = calculateSiteMetrics(currentSite, timePeriod);

  const currentApsPlan = React.useMemo(
    () => generateMonthlyApsPlan(currentSite, selectedYear, selectedMonth),
    [currentSite, selectedYear, selectedMonth]
  );

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleUpdateSite = (updatedSite: SiteData) => {
    if (updatedSite.id === 'overall') {
      showToast('Consolidated overall view is automatically calculated from all plant baselines.');
      return;
    }
    setSites((prev) => ({
      ...prev,
      [updatedSite.id]: updatedSite,
    }));
  };

  const handleRecalculate = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';
    setLastUpdatedTime(timeStr);
    showToast(`Recalculated Net Capacity Gap for ${currentSite.name}: ${metrics.netGap} DL`);
  };

  const handleSave = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';
    setLastUpdatedTime(timeStr);
    showToast(`Saved IE Forecast Standards for ${currentSite.name} successfully.`);
  };

  const handleResetDefaults = () => {
    setSites(INITIAL_SITES);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
    showToast('Factory standards reset to default baseline.');
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAddFeedback = (newItem: FeedbackItem) => {
    setFeedbacks((prev) => [newItem, ...prev]);
    showToast('Revision request submitted for review.');
  };

  const handleUpdateFeedbackStatus = (
    id: string,
    newStatus: 'Approved' | 'Pending Review' | 'In Discussion'
  ) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
    showToast(`Revision request marked as ${newStatus}.`);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#040406] text-[#e5e1e6] font-['Inter',sans-serif]">
      {/* Toast Banner */}
      {toast && (
        <div className="fixed top-4 right-10 z-50 bg-[#ffb86b] text-[#492900] px-4 py-2.5 rounded-lg shadow-2xl font-['JetBrains_Mono'] text-xs font-bold flex items-center gap-2 border border-[#cd8939] animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Side Navigation Shell */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ieSubTab={ieSubTab}
        onIeSubTabChange={handleIeSubTabChange}
        overviewSubTab={overviewSubTab}
        onOverviewSubTabChange={handleOverviewSubTabChange}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSupport={() =>
          showToast('Support Center: Contact IE Operations Desk at ext. #8812')
        }
      />

      {/* Main Content Canvas */}
      <main className="ml-[280px] w-[calc(100%-280px)] h-screen flex flex-col relative overflow-hidden bg-[#131316]">
        {/* Top Navigation Header */}
        <Header
          activeTab={activeTab}
          currentSite={currentSite}
          sites={sites}
          onSelectSite={(id) => setCurrentSiteId(id)}
          timePeriod={timePeriod}
          onToggleTimePeriod={setTimePeriod}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onChangeYear={setSelectedYear}
          onChangeMonth={setSelectedMonth}
          unreadNotifCount={unreadNotifCount}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenDownloadReport={() => setShowDownloadReport(true)}
          onTabChange={setActiveTab}
        />

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 xl:p-10 max-w-[1920px] w-full mx-auto custom-scrollbar">
          {/* Summary KPIs bar (shown on non-overview tabs; on overview tab, it is embedded below Annual Manpower Trend) */}
          {activeTab !== 'overview' && activeTab !== 'ie_forecast' && (
            <SummaryCards
              metrics={metrics}
              apsDemandDL={currentApsPlan.totalApsDemandDL}
              hrActualDL={currentSite.actualHrDL}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              currentSite={currentSite}
              activeTab={activeTab}
            />
          )}

          {/* Dynamic Tab Views */}
          {activeTab === 'ie_forecast' && (
            <IEForecastView
              site={currentSite}
              onUpdateSite={handleUpdateSite}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onChangeMonth={setSelectedMonth}
              onChangeYear={setSelectedYear}
              subTab={ieSubTab}
              onSubTabChange={handleIeSubTabChange}
            />
          )}

          {activeTab === 'overview' && (
            <ExecutiveOverviewView
              sites={sites}
              currentSite={currentSite}
              timePeriod={timePeriod}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              onSelectSite={(id) => setCurrentSiteId(id)}
              onNavigateToForecast={() => setActiveTab('ie_forecast')}
              annualManpowerTab={overviewSubTab}
              onAnnualManpowerTabChange={handleOverviewSubTabChange}
              summaryCards={
                <SummaryCards
                  metrics={metrics}
                  apsDemandDL={currentApsPlan.totalApsDemandDL}
                  hrActualDL={currentSite.actualHrDL}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  currentSite={currentSite}
                  activeTab={activeTab}
                />
              }
            />
          )}

          {activeTab === 'aps_demand' && (
            <ApsDemandView
              site={currentSite}
              timePeriod={timePeriod}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              onNavigateToForecast={() => setActiveTab('ie_forecast')}
              onSelectSite={(id) => setCurrentSiteId(id)}
            />
          )}

          {activeTab === 'hr_actual' && (
            <HrActualView
              site={currentSite}
              timePeriod={timePeriod}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onNavigateToForecast={() => setActiveTab('ie_forecast')}
            />
          )}

          {activeTab === 'global_feedback' && (
            <GlobalFeedbackView
              feedbacks={feedbacks}
              onAddFeedback={handleAddFeedback}
              onUpdateStatus={handleUpdateFeedbackStatus}
            />
          )}
        </div>

        {/* Action Footer */}
        <Footer
          onRecalculate={handleRecalculate}
          onSave={handleSave}
          lastUpdatedTime={lastUpdatedTime}
        />
      </main>

      {/* Slide-over Notifications Drawer */}
      {showNotifications && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAllRead={handleMarkAllNotifsRead}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onResetDefaults={handleResetDefaults}
        />
      )}

      {/* HTML Report Download Modal */}
      <HtmlReportDownloadModal
        isOpen={showDownloadReport}
        onClose={() => setShowDownloadReport(false)}
        currentSite={currentSite}
        sites={sites}
        timePeriod={timePeriod}
        onToast={showToast}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
