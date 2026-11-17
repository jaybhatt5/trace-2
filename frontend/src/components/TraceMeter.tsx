// TRACE Credibility Consensus Meter - Un-slopped Editorial Truth Gauge
// Clean, journalistic design calibrated for empirical fact-checking & academic defense
import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Send,
  User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { TraceAuthUser } from '../utils/firebase';

export type TruthChoice = 'debunked' | 'misleading' | 'mostly_true' | 'verified';

export interface CommunityReviewItem {
  id: string;
  userName: string;
  handle: string;
  choice: TruthChoice;
  comment: string;
  timestamp: string;
  likes: number;
}

export interface TraceMeterProps {
  initialScore?: number;
  initialTotalVotes?: number;
  initialBreakdown?: {
    debunked: number;
    misleading: number;
    mostlyTrue: number;
    verified: number;
  };
  initialReviews?: CommunityReviewItem[];
  currentUser: TraceAuthUser | null;
  onOpenLoginModal?: () => void;
  reportId?: string;
  onVoteCast?: (newScore: number, choice: TruthChoice, comment: string) => void;
}

export const TraceMeter: React.FC<TraceMeterProps> = ({
  initialScore = 88,
  initialTotalVotes = 1420,
  initialBreakdown = {
    debunked: 2,
    misleading: 4,
    mostlyTrue: 16,
    verified: 78,
  },
  initialReviews = [],
  currentUser,
  onOpenLoginModal,
  reportId,
  onVoteCast,
}) => {
  // Meter State (manipulated dynamically by peer reviews)
  const [score, setScore] = useState<number>(initialScore);
  const [totalVotes, setTotalVotes] = useState<number>(initialTotalVotes);
  const [breakdown, setBreakdown] = useState(initialBreakdown);

  // Review Form State
  const [selectedChoice, setSelectedChoice] = useState<TruthChoice>('verified');
  const [reviewText, setReviewText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteNotice, setUserVoteNotice] = useState<string | null>(null);

  // Peer Reviews State
  const [reviews, setReviews] = useState<CommunityReviewItem[]>(() => {
    if (initialReviews && initialReviews.length > 0) return initialReviews;
    return [
      {
        id: 'rev-1',
        userName: 'Aarav Sharma',
        handle: '@aarav_factcheck',
        choice: 'verified',
        comment: 'Corroborated against the official gazette records and primary wire transcripts. Findings align 100%.',
        timestamp: '15m ago',
        likes: 18,
      },
      {
        id: 'rev-2',
        userName: 'Dr. Sarah Jenkins',
        handle: '@sjenkins_audit',
        choice: 'mostly_true',
        comment: 'Core quantitative statement is verified; chronological implementation schedule begins next quarter.',
        timestamp: '1h ago',
        likes: 11,
      },
      {
        id: 'rev-3',
        userName: 'Rajesh Verma',
        handle: '@rajesh_wire',
        choice: 'verified',
        comment: 'PIB Fact Check and Reuters have independently published cross-referencing dispatches.',
        timestamp: '2h ago',
        likes: 8,
      },
    ];
  });

  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Arc Gauge Geometry (Semi-Circle Precision Speedometer)
  // Radius = 84, Center at (120, 105).
  // Arc length for 180 degrees = PI * 84 ≈ 263.89
  const radius = 84;
  const strokeWidth = 12;
  const arcCircumference = Math.PI * radius;

  // Breakdown percentages
  const sumCounts = breakdown.debunked + breakdown.misleading + breakdown.mostlyTrue + breakdown.verified || 100;
  const pctDebunked = Math.round((breakdown.debunked / sumCounts) * 100);
  const pctMisleading = Math.round((breakdown.misleading / sumCounts) * 100);
  const pctMostlyTrue = Math.round((breakdown.mostlyTrue / sumCounts) * 100);
  const pctVerified = Math.max(0, 100 - pctDebunked - pctMisleading - pctMostlyTrue);

  // Arc stroke lengths
  const lenDebunked = (pctDebunked / 100) * arcCircumference;
  const lenMisleading = (pctMisleading / 100) * arcCircumference;
  const lenMostlyTrue = (pctMostlyTrue / 100) * arcCircumference;
  const lenVerified = (pctVerified / 100) * arcCircumference;

  // Dynamic score color
  const getScoreColor = (val: number) => {
    if (val >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (val >= 50) return 'text-sky-600 dark:text-sky-400';
    if (val >= 25) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasVoted) return;

    if (!currentUser && onOpenLoginModal) {
      onOpenLoginModal();
      return;
    }

    setIsPosting(true);

    const newBreakdown = {
      ...breakdown,
      [selectedChoice === 'mostly_true' ? 'mostlyTrue' : selectedChoice]:
        breakdown[selectedChoice === 'mostly_true' ? 'mostlyTrue' : selectedChoice] + 1,
    };

    const newTotal = totalVotes + 1;
    let weight = 95;
    if (selectedChoice === 'mostly_true') weight = 70;
    if (selectedChoice === 'misleading') weight = 35;
    if (selectedChoice === 'debunked') weight = 10;

    const currentWeightTotal = score * totalVotes;
    const recalculatedScore = Math.min(100, Math.max(1, Math.round((currentWeightTotal + weight) / newTotal)));

    const newReview: CommunityReviewItem = {
      id: `rev-${Date.now()}`,
      userName: currentUser?.displayName || 'Citizen Auditor',
      handle: currentUser?.email ? `@${currentUser.email.split('@')[0]}` : '@citizen_auditor',
      choice: selectedChoice,
      comment: reviewText.trim() || `Rated as ${selectedChoice.replace('_', ' ').toUpperCase()} in evidentiary peer review.`,
      timestamp: 'Just now',
      likes: 1,
    };

    setBreakdown(newBreakdown);
    setTotalVotes(newTotal);
    setScore(recalculatedScore);
    setReviews([newReview, ...reviews]);
    setHasVoted(true);
    setReviewText('');
    setUserVoteNotice(`Audit recorded. Consensus updated to ${recalculatedScore}% with your peer assessment.`);

    if (onVoteCast) {
      onVoteCast(recalculatedScore, selectedChoice, newReview.comment);
    }

    try {
      if (reportId) {
        await fetch(`/api/fact-check/${encodeURIComponent(reportId)}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            choice: selectedChoice,
            comment: newReview.comment,
            userName: newReview.userName,
            handle: newReview.handle,
          }),
        });
      }
    } catch {
      // Offline fallback
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = (id: string) => {
    setLikedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, likes: likedReviews[id] ? r.likes - 1 : r.likes + 1 };
        }
        return r;
      })
    );
  };

  const choicesConfig: Array<{ id: TruthChoice; label: string; activeColor: string }> = [
    { id: 'debunked', label: 'Debunked', activeColor: 'bg-rose-600 text-white shadow-xs' },
    { id: 'misleading', label: 'Misleading', activeColor: 'bg-amber-600 text-white shadow-xs' },
    { id: 'mostly_true', label: 'Needs Context', activeColor: 'bg-sky-600 text-white shadow-xs' },
    { id: 'verified', label: 'Verified True', activeColor: 'bg-emerald-600 text-white shadow-xs' },
  ];

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs font-sans space-y-5 text-zinc-900 dark:text-zinc-100">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wide text-zinc-900 dark:text-zinc-100 font-mono">
            Credibility Consensus Index
          </h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          Peer-Reviewed Wire Standard
        </span>
      </div>

      {/* 2. Precision Semi-Circle Arc Speedometer */}
      <div className="flex flex-col items-center text-center">
        <div className="relative w-56 sm:w-64 h-32 sm:h-36 flex items-end justify-center select-none pt-1">
          <svg
            viewBox="0 0 240 125"
            className="w-full h-full overflow-visible"
            aria-label={`Truth credibility score ${score}% based on ${totalVotes} votes`}
          >
            {/* Background Arc Track */}
            <path
              d="M 36 110 A 84 84 0 0 1 204 110"
              fill="none"
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Segment 1: Debunked (Rose) */}
            {lenDebunked > 0 && (
              <path
                d="M 36 110 A 84 84 0 0 1 204 110"
                fill="none"
                stroke="#E11D48"
                strokeWidth={strokeWidth}
                strokeDasharray={`${lenDebunked} ${arcCircumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Segment 2: Misleading (Amber) */}
            {lenMisleading > 0 && (
              <path
                d="M 36 110 A 84 84 0 0 1 204 110"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                strokeDasharray={`${lenMisleading} ${arcCircumference}`}
                strokeDashoffset={`-${lenDebunked}`}
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Segment 3: Needs Context (Sky) */}
            {lenMostlyTrue > 0 && (
              <path
                d="M 36 110 A 84 84 0 0 1 204 110"
                fill="none"
                stroke="#0EA5E9"
                strokeWidth={strokeWidth}
                strokeDasharray={`${lenMostlyTrue} ${arcCircumference}`}
                strokeDashoffset={`-${lenDebunked + lenMisleading}`}
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Segment 4: Verified True (Emerald) */}
            {lenVerified > 0 && (
              <path
                d="M 36 110 A 84 84 0 0 1 204 110"
                fill="none"
                stroke="#10B981"
                strokeWidth={strokeWidth}
                strokeDasharray={`${lenVerified} ${arcCircumference}`}
                strokeDashoffset={`-${lenDebunked + lenMisleading + lenMostlyTrue}`}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>

          {/* Center Arc Typography */}
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center pointer-events-none">
            <motion.span
              key={score}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-sans ${getScoreColor(score)}`}
            >
              {score}%
            </motion.span>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
              {totalVotes.toLocaleString()} Peer Audits
            </span>
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-4 gap-1.5 w-full pt-3 text-[10px] font-mono">
          <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col items-center">
            <span className="text-rose-600 dark:text-rose-400 font-semibold">False</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-bold">{pctDebunked}%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col items-center">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Misleading</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-bold">{pctMisleading}%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col items-center">
            <span className="text-sky-600 dark:text-sky-400 font-semibold">Context</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-bold">{pctMostlyTrue}%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col items-center">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-bold">{pctVerified}%</span>
          </div>
        </div>
      </div>

      {/* 3. Cast Peer Review Card */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Submit Peer Review
          </span>
          {hasVoted && (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Audit Recorded ✓
            </span>
          )}
        </div>

        {userVoteNotice && (
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{userVoteNotice}</span>
          </div>
        )}

        <form onSubmit={handlePostReview} className="space-y-2.5">
          {/* Segmented Choice Buttons */}
          <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-300/70 dark:border-zinc-800">
            {choicesConfig.map((choice) => {
              const isSelected = selectedChoice === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={hasVoted}
                  onClick={() => setSelectedChoice(choice.id)}
                  className={`py-1 px-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer truncate ${
                    isSelected
                      ? choice.activeColor
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>

          {/* Review Text */}
          <div className="relative">
            <textarea
              rows={2}
              maxLength={500}
              disabled={hasVoted}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Cite evidence, official release, or factual nuance..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-zinc-400 font-mono">
              Calibrates live score
            </span>
            <button
              type="submit"
              disabled={isPosting || hasVoted}
              className="py-1 px-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isPosting ? 'Updating...' : hasVoted ? 'Published' : 'Submit Audit'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Peer Reviews Feed */}
      <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-0.5">
          <span>Peer Review Log</span>
          <span>{reviews.length} Notes</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-2.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-[11px]">
                    {rev.userName}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate">
                    {rev.handle}
                  </span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                  rev.choice === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : rev.choice === 'mostly_true'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    : rev.choice === 'misleading'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {rev.choice.replace('_', ' ')}
                </span>
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                {rev.comment}
              </p>

              <div className="flex items-center justify-between pt-0.5 text-[10px] text-zinc-400">
                <span>{rev.timestamp}</span>
                <button
                  type="button"
                  onClick={() => toggleLike(rev.id)}
                  className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <ThumbsUp className={`w-3 h-3 ${likedReviews[rev.id] ? 'text-emerald-500 fill-emerald-500' : ''}`} />
                  <span>{rev.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
