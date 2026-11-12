import React, { useState } from 'react';

export interface CostCenterPreset {
  code: string;
  label: string;
}

export const parseCostCenters = (val?: string | string[]): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

interface CostCenterMultiPickerProps {
  id: string;
  value?: string | string[];
  onChange: (val: string[]) => void;
  hrPresets: CostCenterPreset[];
  placeholder?: string;
  departmentName: string;
  disabled?: boolean;
}

export const CostCenterMultiPicker: React.FC<CostCenterMultiPickerProps> = ({
  id,
  value,
  onChange,
  hrPresets,
  placeholder = 'e.g. CC-SMT-7102',
  departmentName,
  disabled = false,
}) => {
  const currentList = parseCostCenters(value);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTokens = (text: string) => {
    const rawTokens = text
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (rawTokens.length === 0) return;

    const nextList = [...currentList];
    rawTokens.forEach((token) => {
      if (!nextList.includes(token)) {
        nextList.push(token);
      }
    });

    onChange(nextList);
    setInputValue('');
  };

  const handleRemove = (codeToRemove: string) => {
    onChange(currentList.filter((c) => c !== codeToRemove));
  };

  const handleTogglePreset = (code: string) => {
    if (currentList.includes(code)) {
      onChange(currentList.filter((c) => c !== code));
    } else {
      onChange([...currentList, code]);
    }
  };

  const currentDisplayLabel =
    currentList.length === 0
      ? 'None'
      : currentList.length === 1
      ? currentList[0]
      : `${currentList[0]} (+${currentList.length - 1})`;

  return (
    <div className="relative inline-block text-left shrink-0">
      {/* Dropdown Trigger Button */}
      <div
        className={`flex items-center h-[34px] box-border gap-1.5 bg-[#131316] px-2.5 rounded-md border transition-colors ${
          disabled
            ? 'border-[#524437]/20 opacity-60 cursor-not-allowed'
            : 'border-[#524437]/40 hover:border-[#a78bfa]/60'
        }`}
      >
        <label
          htmlFor={id}
          className={`font-['JetBrains_Mono'] text-[10px] text-[#a78bfa] font-semibold uppercase flex items-center gap-1 whitespace-nowrap leading-none ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          title={
            disabled
              ? `${departmentName} Cost Center (唯讀)`
              : `${departmentName} Cost Center (Synced with HR System)`
          }
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className="material-symbols-outlined text-[13px] text-[#a78bfa] leading-none">
            {disabled ? 'lock' : 'badge'}
          </span>
          Cost Center:
        </label>

        {/* Dropdown View & Select Button */}
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-1.5 h-6 px-2 bg-[#201f23] border border-[#a78bfa]/40 rounded text-xs font-['JetBrains_Mono'] text-[#e5e1e6] min-w-[120px] sm:min-w-[150px] transition-all shadow-sm leading-none ${
            disabled ? 'cursor-not-allowed opacity-75' : 'hover:border-[#a78bfa] cursor-pointer'
          }`}
          title={
            disabled
              ? '無維護權限（僅該廠 IE 可設定 Cost Center）'
              : 'Click to view entered cost centers or select from HR list'
          }
        >
          <span className="font-bold text-[#a78bfa] truncate">
            {currentDisplayLabel}
          </span>
          <span className="text-[10px] text-[#d7c3b2]/70 font-mono leading-none">
            {disabled ? '🔒' : isOpen ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {/* Dropdown Menu Overlay / Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-[#1b1a1f] border border-[#a78bfa]/60 rounded-lg text-xs space-y-2.5 p-3 z-50 shadow-2xl backdrop-blur-md animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between text-[11px] text-[#d7c3b2]/90 font-['JetBrains_Mono'] border-b border-[#524437]/40 pb-1.5">
            <span className="font-semibold text-[#a78bfa] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#a78bfa]">format_list_bulleted</span>
              {departmentName} Cost Centers ({currentList.length})
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#d7c3b2]/60 hover:text-[#ff5555] font-bold text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Current Assigned Cost Centers */}
          <div className="space-y-1">
            <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/60 uppercase tracking-wider block">
              Currently Assigned:
            </span>
            {currentList.length === 0 ? (
              <div className="text-[11px] font-['JetBrains_Mono'] text-[#d7c3b2]/40 italic py-1 px-2 bg-[#131316] rounded border border-[#524437]/30">
                No cost center assigned yet
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#131316] rounded border border-[#524437]/30">
                {currentList.map((cc) => (
                  <span
                    key={cc}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#201f23] border border-[#a78bfa]/50 text-xs font-bold text-[#a78bfa] font-['JetBrains_Mono'] shadow-sm"
                  >
                    <span>{cc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(cc)}
                      className="text-[#d7c3b2]/60 hover:text-[#ff5555] font-bold text-xs ml-0.5 hover:bg-[#ff5555]/10 rounded px-0.5 cursor-pointer transition-colors"
                      title={`Remove ${cc}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Custom Input Addition */}
          <div className="space-y-1">
            <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/60 uppercase tracking-wider block">
              Add Custom Code:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTokens(inputValue);
                  }
                }}
                className="flex-1 px-2 py-1 bg-[#201f23] border border-[#a78bfa]/40 rounded text-xs font-['JetBrains_Mono'] font-bold text-[#e5e1e6] focus:outline-none focus:border-[#a78bfa] placeholder:text-[#d7c3b2]/30"
              />
              <button
                type="button"
                onClick={() => handleAddTokens(inputValue)}
                disabled={!inputValue.trim()}
                className="px-2.5 py-1 bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 border border-[#a78bfa]/50 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs font-bold text-[#a78bfa] font-['JetBrains_Mono'] transition-all cursor-pointer whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          </div>

          {/* HR Catalog Presets List */}
          <div className="space-y-1">
            <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/60 uppercase tracking-wider block">
              Select from HR Catalog:
            </span>
            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
              {hrPresets.map((preset) => {
                const isSelected = currentList.includes(preset.code);
                return (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleTogglePreset(preset.code)}
                    className={`text-left px-2 py-1.5 rounded text-[11px] font-['JetBrains_Mono'] flex items-center justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#a78bfa]/20 border-[#a78bfa] text-[#ffffff] font-bold'
                        : 'bg-[#201f23] border-[#524437]/50 text-[#d7c3b2]/80 hover:border-[#a78bfa]/60'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-1">
                      <span className={isSelected ? 'text-[#a78bfa]' : 'text-[#e5e1e6]'}>
                        {preset.code}
                      </span>
                      <span className="text-[9px] text-[#d7c3b2]/60 truncate">{preset.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#a78bfa] text-[#131316] font-black'
                          : 'text-[#d7c3b2]/40'
                      }`}
                    >
                      {isSelected ? '✓ Assigned' : '+ Select'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
