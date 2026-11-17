import React from 'react';
import { Sliders } from 'lucide-react';
import { OverviewStatsResponse } from '../../types';

interface AdminControlsTabProps {
  systemData: OverviewStatsResponse | null;
  isUpdatingControl: boolean;
  onUpdateControls: (updates: any) => Promise<void>;
}

export const AdminControlsTab: React.FC<AdminControlsTabProps> = ({
  systemData,
  isUpdatingControl,
  onUpdateControls,
}) => {
  const controls = systemData?.controls;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
        <div>
          <h3 className="text-base font-bold text-zinc-100 font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            REAL-TIME PLATFORM CONTROLS
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Direct operational overrides for TRACE Sentinel. Adjustments apply immediately across all client sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Control 1: Maintenance Mode */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-xs text-zinc-200 font-mono">
                System Maintenance Mode
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                When enabled, public submissions to AI analysis desks return a 503 maintenance notice. Master admins can continue verification.
              </p>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  controls?.maintenanceMode
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                Current: {controls?.maintenanceMode ? 'ACTIVE (PUBLIC PAUSED)' : 'NORMAL TRAFFIC ALLOWED'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onUpdateControls({ maintenanceMode: !controls?.maintenanceMode })}
              disabled={isUpdatingControl}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                controls?.maintenanceMode
                  ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {controls?.maintenanceMode ? 'Deactivate' : 'Activate'}
            </button>
          </div>

          {/* Control 2: Deepfake Sensitivity Cutoff Slider */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-zinc-200 font-mono">
                  Deepfake Sensitivity Threshold
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Minimum confidence cutoff to flag media as manipulated.
                </p>
              </div>
              <span className="text-base font-bold font-mono text-purple-400">
                {controls?.deepfakeConfidenceThreshold ?? 60}%
              </span>
            </div>

            <input
              type="range"
              min="35"
              max="90"
              step="5"
              value={controls?.deepfakeConfidenceThreshold ?? 60}
              onChange={(e) =>
                onUpdateControls({ deepfakeConfidenceThreshold: Number(e.target.value) })
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>Aggressive (35%)</span>
              <span>Standard (60%)</span>
              <span>Conservative (90%)</span>
            </div>
          </div>

          {/* Control 3: AI Engine Routing */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-3">
            <div>
              <p className="font-bold text-xs text-zinc-200 font-mono">
                AI Engine Routing Mode
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Select which inference tier executes incoming multimodal audits.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['hybrid', 'gemini_only', 'local_only'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateControls({ aiEngineMode: mode })}
                  className={`py-2 px-2 rounded-lg text-[10px] font-mono uppercase font-semibold transition-all cursor-pointer ${
                    controls?.aiEngineMode === mode
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Control 4: Emergency Cache & Wire Flush */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-xs text-zinc-200 font-mono">
                Emergency Cache &amp; Wire Flush
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Flushes cached wire articles and prompts in-memory reload from disk datastores.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onUpdateControls({ clearCache: true })}
              disabled={isUpdatingControl}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 text-zinc-300 text-xs font-mono font-semibold transition-all cursor-pointer shrink-0"
            >
              Flush Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
