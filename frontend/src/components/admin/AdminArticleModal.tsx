import React from 'react';
import { FileEdit, X } from 'lucide-react';
import { FactCheckItem, ContentCategory } from '../../types';

interface AdminArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: FactCheckItem | null;
  formTitle: string;
  setFormTitle: (val: string) => void;
  formClaim: string;
  setFormClaim: (val: string) => void;
  formVerdict: string;
  setFormVerdict: (val: string) => void;
  formCategory: ContentCategory;
  setFormCategory: (val: ContentCategory) => void;
  formSummary: string;
  setFormSummary: (val: string) => void;
  formFindings: string;
  setFormFindings: (val: string) => void;
  formImageUrl: string;
  setFormImageUrl: (val: string) => void;
  articleError: string | null;
  isSavingArticle: boolean;
  onSaveArticle: (e: React.FormEvent) => Promise<void>;
}

export const AdminArticleModal: React.FC<AdminArticleModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  formTitle,
  setFormTitle,
  formClaim,
  setFormClaim,
  formVerdict,
  setFormVerdict,
  formCategory,
  setFormCategory,
  formSummary,
  setFormSummary,
  formFindings,
  setFormFindings,
  formImageUrl,
  setFormImageUrl,
  articleError,
  isSavingArticle,
  onSaveArticle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="font-bold text-base text-zinc-100 font-mono flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-blue-400" />
            {editingItem ? 'Edit Published Investigation' : 'Publish New Investigation to Public Wire'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {articleError && (
          <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-200 text-xs">
            {articleError}
          </div>
        )}

        <form onSubmit={onSaveArticle} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Headline (Title)</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Health Ministry Debunks Viral Vaccine Claims"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Claim Statement</label>
            <textarea
              required
              rows={2}
              value={formClaim}
              onChange={(e) => setFormClaim(e.target.value)}
              placeholder="Specific claim statement under review..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Credibility Compass Verdict</label>
              <select
                value={formVerdict}
                onChange={(e) => setFormVerdict(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono"
              >
                <option value="SUPPORTED_BY_EVIDENCE">Supported By Evidence</option>
                <option value="MOSTLY_TRUE_NEEDS_CONTEXT">Mostly True (Needs Context)</option>
                <option value="MISLEADING">Misleading Narrative</option>
                <option value="DEBUNKED">Debunked False</option>
                <option value="UNVERIFIED">Inconclusive / Unverified</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Desk / Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ContentCategory)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono"
              >
                <option value="Politics">Politics</option>
                <option value="Health & Science">Health &amp; Science</option>
                <option value="World News">World News</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Executive Summary</label>
            <textarea
              rows={2}
              value={formSummary}
              onChange={(e) => setFormSummary(e.target.value)}
              placeholder="Brief summary of findings for card previews..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Key Findings (one per line)</label>
            <textarea
              rows={3}
              value={formFindings}
              onChange={(e) => setFormFindings(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Cover Image URL</label>
            <input
              type="url"
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingArticle}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-blue-950/40"
            >
              {isSavingArticle ? 'Publishing...' : editingItem ? 'Save Updates' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
