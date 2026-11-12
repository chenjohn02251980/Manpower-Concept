import React, { useState } from 'react';

interface FooterProps {
  onRecalculate: () => void;
  onSave: () => void;
  lastUpdatedTime: string;
}

export const Footer: React.FC<FooterProps> = ({
  onRecalculate,
  onSave,
  lastUpdatedTime,
}) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSaveClick = () => {
    if (saveStatus !== 'idle') return;
    setSaveStatus('saving');

    setTimeout(() => {
      onSave();
      setSaveStatus('saved');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 900);
  };

  return (
    <footer className="h-20 bg-[#131316] border-t border-[#524437]/60 px-10 flex justify-between items-center shrink-0 sticky bottom-0 z-40 select-none">
      <div className="flex items-center gap-2 text-[#d7c3b2]/80">
        <span className="material-symbols-outlined text-sm">schedule</span>
        <span className="text-xs font-['Inter']">
          Last updated by <strong className="text-[#e5e1e6]">IE_Admin_04</strong> at{' '}
          {lastUpdatedTime}
        </span>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onRecalculate}
          className="px-5 py-2 border border-[#524437] text-[#e5e1e6] hover:bg-[#2a292d] hover:border-[#ffb86b]/50 transition-all flex items-center gap-2 font-['JetBrains_Mono'] text-xs rounded font-medium"
        >
          <span className="material-symbols-outlined text-base text-[#ffb86b]">
            calculate
          </span>
          RECALCULATE NET GAP
        </button>

        <button
          onClick={handleSaveClick}
          disabled={saveStatus === 'saving'}
          className={`px-7 py-2 font-bold transition-all flex items-center gap-2 font-['JetBrains_Mono'] text-xs rounded shadow-md ${
            saveStatus === 'saved'
              ? 'bg-[#00ad78] text-[#003824]'
              : 'bg-[#ffb86b] text-[#492900] hover:bg-[#ffb86b]/90'
          }`}
        >
          {saveStatus === 'saving' && (
            <>
              <span className="material-symbols-outlined text-base animate-spin">
                sync
              </span>
              SAVING...
            </>
          )}

          {saveStatus === 'saved' && (
            <>
              <span className="material-symbols-outlined text-base">
                check_circle
              </span>
              STANDARDS SAVED
            </>
          )}

          {saveStatus === 'idle' && (
            <>
              <span className="material-symbols-outlined text-base">save</span>
              SAVE STANDARDS
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
