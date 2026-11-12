import React, { useState } from 'react';

interface SettingsModalProps {
  onClose: () => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onResetDefaults,
}) => {
  const [targetRatio, setTargetRatio] = useState('1:4.1');
  const [shiftHours, setShiftHours] = useState('8.0');
  const [autoCalculate, setAutoCalculate] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1C1D22] border border-[#524437] rounded-lg max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-[#524437]/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb86b]">settings</span>
            <h3 className="font-['Inter'] font-bold text-lg text-[#e5e1e6]">
              IE System Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#d7c3b2]/60 hover:text-[#e5e1e6]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 text-xs font-['Inter']">
          <div>
            <label className="text-[#d7c3b2] block mb-1 font-['JetBrains_Mono']">
              TARGET IDL RATIO STANDARD
            </label>
            <input
              type="text"
              value={targetRatio}
              onChange={(e) => setTargetRatio(e.target.value)}
              className="w-full bg-[#131316] border border-[#524437] rounded p-2 text-[#e5e1e6] focus:border-[#ffb86b] outline-none"
            />
          </div>

          <div>
            <label className="text-[#d7c3b2] block mb-1 font-['JetBrains_Mono']">
              STANDARD SHIFT HOURS
            </label>
            <input
              type="text"
              value={shiftHours}
              onChange={(e) => setShiftHours(e.target.value)}
              className="w-full bg-[#131316] border border-[#524437] rounded p-2 text-[#e5e1e6] focus:border-[#ffb86b] outline-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#131316] rounded border border-[#524437]/30">
            <div>
              <span className="font-semibold text-[#e5e1e6] block">
                Auto-Recalculate Net Gap
              </span>
              <span className="text-[11px] text-[#d7c3b2]/60">
                Instantly update KPIs when table inputs change
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="w-4 h-4 accent-[#ffb86b] cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-[#524437]/40">
            <button
              onClick={() => {
                if (confirm('Reset all site forecast standards to initial baseline values?')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="w-full py-2 bg-[#F43F5E]/10 border border-[#F43F5E]/40 text-[#F43F5E] hover:bg-[#F43F5E]/20 font-['JetBrains_Mono'] text-xs font-bold rounded transition-colors"
            >
              RESET STANDARDS TO FACTORY DEFAULTS
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-[#524437]/40 mt-5">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#ffb86b] text-[#492900] font-bold rounded font-['JetBrains_Mono'] hover:opacity-90"
          >
            SAVE CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};
