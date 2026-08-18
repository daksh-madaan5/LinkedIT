import React from 'react';
import { Sparkles, RotateCcw, LayoutTemplate } from 'lucide-react';

interface AppHeaderProps {
  onLoadDemo: () => void;
  onReset: () => void;
  onResetLayout?: () => void;
  hasData: boolean;
  activeNavTab?: string;
  onNavTabChange?: (tab: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onLoadDemo,
  onReset,
  onResetLayout,
  hasData,
  activeNavTab = 'plan',
  onNavTabChange,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-5 flex items-center justify-between z-20 shrink-0 select-none shadow-xs">
      {/* Left: Branding */}
      <div className="flex items-center gap-3 shrink-0">
        <img
          src="/linkedIt-logo.png"
          alt="LinkedIT Logo"
          className="h-9 w-9 object-contain shrink-0"
        />
        <div>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none font-sans">
            LinkedIT
          </h1>
          <p className="text-[11px] text-slate-500 mt-1 leading-none">
            Vehicle Routing Optimization
          </p>
        </div>
      </div>

      {/* Center: Navigation Tabs with Generous Spacing */}
      <nav className="hidden md:flex items-center gap-8 h-full">
        <button
          type="button"
          onClick={() => onNavTabChange?.('plan')}
          className={`h-full px-2 text-xs font-semibold flex items-center border-b-2 transition-colors cursor-pointer ${
            activeNavTab === 'plan'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <span>Plan &amp; Optimize</span>
        </button>
        <button
          type="button"
          disabled
          className="h-full px-2 text-xs font-medium text-slate-400 border-b-2 border-transparent cursor-not-allowed flex items-center gap-1.5"
        >
          <span>Live Dispatch</span>
          <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200">Soon</span>
        </button>
        <button
          type="button"
          disabled
          className="h-full px-2 text-xs font-medium text-slate-400 border-b-2 border-transparent cursor-not-allowed flex items-center gap-1.5"
        >
          <span>Analytics</span>
          <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200">Soon</span>
        </button>
      </nav>

      {/* Right: Operational Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onResetLayout && (
          <button
            type="button"
            onClick={onResetLayout}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 h-8.5 bg-white text-slate-700 hover:bg-slate-50 rounded-md border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Reset workspace panels to default dimensions"
          >
            <LayoutTemplate className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Reset Layout</span>
          </button>
        )}

        <button
          type="button"
          onClick={onLoadDemo}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 h-8.5 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 rounded-md border border-blue-200 transition-colors shadow-xs cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>Load Bhubaneswar Demo</span>
        </button>

        {hasData && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 h-8.5 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-md border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Reset planning inputs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </header>
  );
};
