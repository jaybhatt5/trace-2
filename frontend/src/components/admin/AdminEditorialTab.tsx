import React, { useState } from 'react';
import { Search, PlusCircle, FileEdit, Trash2 } from 'lucide-react';
import { FactCheckItem } from '../../types';

interface AdminEditorialTabProps {
  feedItems: FactCheckItem[];
  onOpenCreate: () => void;
  onOpenEdit: (item: FactCheckItem) => void;
  onDeleteArticle: (id: string, title: string) => Promise<void>;
}

export const AdminEditorialTab: React.FC<AdminEditorialTabProps> = ({
  feedItems,
  onOpenCreate,
  onOpenEdit,
  onDeleteArticle,
}) => {
  const [manageSearch, setManageSearch] = useState('');
  const [manageCategory, setManageCategory] = useState('All');

  const filteredFeed = feedItems.filter((item) => {
    const matchSearch =
      !manageSearch ||
      item.title.toLowerCase().includes(manageSearch.toLowerCase()) ||
      item.claim.toLowerCase().includes(manageSearch.toLowerCase());
    const matchCategory = manageCategory === 'All' || item.category === manageCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* CMS Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles..."
              value={manageSearch}
              onChange={(e) => setManageSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          <select
            value={manageCategory}
            onChange={(e) => setManageCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none font-mono"
          >
            <option value="All">All Desks</option>
            <option value="Politics">Politics</option>
            <option value="Health & Science">Health &amp; Science</option>
            <option value="Technology">Technology</option>
            <option value="World News">World News</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-blue-950/40"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Investigation</span>
        </button>
      </div>

      {/* Articles Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Headline / Claim</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Desk</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {filteredFeed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500 font-sans">
                    No articles match the current filter.
                  </td>
                </tr>
              ) : (
                filteredFeed.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans max-w-md">
                      <p className="font-semibold text-zinc-100 line-clamp-1">{item.title}</p>
                      <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{item.claim}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          item.verdict === 'SUPPORTED_BY_EVIDENCE' ||
                          item.verdict === 'VERIFIED_TRUE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.verdict === 'DEBUNKED' || item.verdict === 'DEBUNKED_FAKE'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {item.verdict.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{item.category}</td>
                    <td className="py-3.5 px-4 text-zinc-500">{item.timestamp}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                        title="Edit Article"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteArticle(item.id, item.title)}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors cursor-pointer"
                        title="Delete from Wire"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
