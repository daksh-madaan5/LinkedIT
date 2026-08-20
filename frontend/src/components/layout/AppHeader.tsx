import React from 'react';
import { Sparkles, RotateCcw, LayoutTemplate } from 'lucide-react';

interface AppHeaderProps {
  onLoadDemo: () => void;
  onReset: () => void;
  onResetLayout?: () => void;
  hasData: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onLoadDemo,
  onReset,
  onResetLayout,
  hasData,
}) => {
  return (
    <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Branding */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-[200px]">
        <img
          src="/linkedIt-logo.png"
          alt="LinkedIT Logo"
          className="h-7 w-7 object-contain shrink-0"
        />
        <div className="flex flex-col">
          <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none font-sans">
            LinkedIT
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-none font-sans">
            Vehicle Routing Optimization
          </p>
        </div>
      </div>

      {/* Center: Centered Navigation Tab */}
      <nav className="flex items-center justify-center h-full">
        <div className="h-full px-3 text-[13px] font-bold text-blue-600 border-b-2 border-blue-600 flex items-center">
          Plan &amp; Optimize
        </div>
      </nav>

      {/* Right: Operational Actions */}
      <div className="flex items-center gap-2 shrink-0 min-w-[200px] justify-end">
        {onResetLayout && (
          <button
            type="button"
            onClick={onResetLayout}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 h-7.5 bg-white text-slate-700 hover:bg-slate-50 rounded border border-slate-200 transition-colors cursor-pointer"
            title="Reset workspace panels to default dimensions"
          >
            <LayoutTemplate className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Reset Layout</span>
          </button>
        )}

        <button
          type="button"
          onClick={onLoadDemo}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-7.5 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 rounded border border-blue-200 transition-colors cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>Load Bhubaneswar Demo</span>
        </button>

        {hasData && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 h-7.5 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded border border-slate-200 transition-colors cursor-pointer"
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


