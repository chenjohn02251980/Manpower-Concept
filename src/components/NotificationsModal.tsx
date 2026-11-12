import React from 'react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#1C1D22] border-l border-[#524437] w-full max-w-md h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-[#524437]/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb86b]">notifications</span>
            <h3 className="font-['Inter'] font-bold text-lg text-[#e5e1e6]">
              Notifications & Alerts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#d7c3b2]/60 hover:text-[#e5e1e6] p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex justify-between items-center my-3">
          <span className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/70 uppercase">
            {notifications.filter((n) => !n.read).length} Unread Notifications
          </span>
          <button
            onClick={onMarkAllRead}
            className="text-xs text-[#ffb86b] hover:underline font-['JetBrains_Mono'] font-medium"
          >
            Mark all read
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border text-xs transition-all ${
                n.read
                  ? 'bg-[#131316] border-[#524437]/30 opacity-70'
                  : 'bg-[#201f23] border-[#524437] shadow-sm'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#e5e1e6]">{n.title}</span>
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#d7c3b2]/50">
                  {n.time}
                </span>
              </div>
              <p className="text-[#d7c3b2] leading-relaxed">{n.message}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#524437]/40 mt-auto">
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#2a292d] text-[#e5e1e6] font-['JetBrains_Mono'] text-xs font-bold rounded hover:bg-[#353438]"
          >
            CLOSE PANEL
          </button>
        </div>
      </div>
    </div>
  );
};
