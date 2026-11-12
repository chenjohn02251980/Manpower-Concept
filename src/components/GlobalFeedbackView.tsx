import React, { useState } from 'react';
import { FeedbackItem } from '../types';

interface GlobalFeedbackViewProps {
  feedbacks: FeedbackItem[];
  onAddFeedback: (feedback: FeedbackItem) => void;
  onUpdateStatus: (id: string, newStatus: 'Approved' | 'Pending Review' | 'In Discussion') => void;
}

export const GlobalFeedbackView: React.FC<GlobalFeedbackViewProps> = ({
  feedbacks,
  onAddFeedback,
  onUpdateStatus,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [line, setLine] = useState('Line-S01 (SMT)');
  const [author, setAuthor] = useState('Chang, IE Specialist');
  const [department, setDepartment] = useState('IE Operations');
  const [comment, setComment] = useState('');
  const [suggestedChange, setSuggestedChange] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !suggestedChange) return;

    const newItem: FeedbackItem = {
      id: `fb-${Date.now()}`,
      line,
      author,
      department,
      comment,
      suggestedChange,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
    };

    onAddFeedback(newItem);
    setShowAddModal(false);
    setComment('');
    setSuggestedChange('');
  };

  return (
    <div className="space-y-6 pb-8 select-none">
      <div className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#ffb86b] uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-sm">public</span>
              Global Field IE Feedback Queue
            </div>
            <h3 className="font-['Inter'] text-2xl font-bold text-[#e5e1e6]">
              Standard Revisions & Feedback
            </h3>
            <p className="text-sm text-[#d7c3b2]/70 mt-1">
              Field requests from plant industrial engineers to revise manpower line standards.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#ffb86b] text-[#492900] font-bold text-xs font-['JetBrains_Mono'] rounded hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">rate_review</span>
            SUBMIT REVISION REQUEST
          </button>
        </div>
      </div>

      {/* Feedback Items List */}
      <div className="grid grid-cols-1 gap-4">
        {feedbacks.map((item) => (
          <div
            key={item.id}
            className="bg-[#1C1D22] border border-[#524437]/60 rounded-lg p-5 hover:border-[#ffb86b]/40 transition-all"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-[#201f23] text-[#ffb86b] border border-[#ffb86b]/30 rounded text-xs font-['JetBrains_Mono'] font-bold">
                  {item.line}
                </span>
                <span className="text-xs text-[#d7c3b2]/70">
                  By <strong className="text-[#e5e1e6]">{item.author}</strong> ({item.department})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-['JetBrains_Mono'] text-[#d7c3b2]/50">
                  {item.date}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold uppercase ${
                    item.status === 'Approved'
                      ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40'
                      : item.status === 'Pending Review'
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      : 'bg-[#5de6ff]/20 text-[#5de6ff] border border-[#5de6ff]/40'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#e5e1e6] bg-[#131316] p-3 rounded border border-[#524437]/30 mb-3">
              "{item.comment}"
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-[#524437]/20">
              <div className="text-xs text-[#5de6ff] font-['JetBrains_Mono'] font-semibold">
                Suggested Revision: {item.suggestedChange}
              </div>

              {item.status === 'Pending Review' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateStatus(item.id, 'Approved')}
                    className="px-3 py-1 bg-[#00ad78] text-[#003824] hover:bg-[#4edea3] transition-colors rounded text-[10px] font-['JetBrains_Mono'] font-bold"
                  >
                    APPROVE REVISION
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item.id, 'In Discussion')}
                    className="px-3 py-1 bg-[#201f23] border border-[#524437] text-[#e5e1e6] hover:bg-[#2a292d] transition-colors rounded text-[10px] font-['JetBrains_Mono'] font-bold"
                  >
                    DISCUSS
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Feedback Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1D22] border border-[#524437] rounded-lg max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#524437]/60 pb-3 mb-4">
              <h4 className="font-['Inter'] font-bold text-lg text-[#e5e1e6]">
                Submit IE Standard Revision Request
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#d7c3b2]/60 hover:text-[#e5e1e6]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-['Inter']">
              <div>
                <label className="text-[#d7c3b2] block mb-1 font-['JetBrains_Mono']">
                  PRODUCTION LINE / STATION
                </label>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  className="w-full bg-[#131316] border border-[#524437] rounded p-2 text-[#e5e1e6] focus:border-[#ffb86b] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[#d7c3b2] block mb-1 font-['JetBrains_Mono']">
                  AUTHOR / ENGINEER NAME
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-[#131316] border border-[#524437] rounded p-2 text-[#e5e1e6] focus:border-[#ffb86b] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[#d7c3b2] block mb-1 font-['JetBrains_Mono']">
                  JUSTIFICATION / OBSERVED ISSUES
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe why the standard DL/IDL should be adjusted..."
                  className="w-full bg-[#131316] border border-[#524437] rounded p-2 text-[#e5e1e6] focus:border-[#ffb86b] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[#d7c3b2] block mb-1 font-['JetBrains_Mono']">
                  SUGGESTED REVISION
                </label>
                <input
                  type="text"
                  value={suggestedChange}
                  onChange={(e) => setSuggestedChange(e.target.value)}
                  placeholder="e.g. Increase FA Std DL from 8 to 10"
                  className="w-full bg-[#131316] border border-[#524437] rounded p-2 text-[#e5e1e6] focus:border-[#ffb86b] outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#524437]/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#201f23] text-[#e5e1e6] rounded hover:bg-[#2a292d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ffb86b] text-[#492900] font-bold rounded font-['JetBrains_Mono'] hover:opacity-90"
                >
                  SUBMIT REQUEST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
