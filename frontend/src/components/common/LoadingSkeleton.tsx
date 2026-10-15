import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-5 bg-slate-200 rounded-md w-1/3" />
      <div className="h-4 bg-slate-100 rounded-full w-16" />
    </div>
    <div className="space-y-2 mb-6">
      <div className="h-3.5 bg-slate-100 rounded w-full" />
      <div className="h-3.5 bg-slate-100 rounded w-4/5" />
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <div className="h-4 bg-slate-100 rounded w-20" />
      <div className="h-8 bg-slate-100 rounded-xl w-24" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 border-b border-slate-100 animate-pulse">
    <div className="flex items-center gap-3 w-1/2">
      <div className="w-8 h-8 rounded-lg bg-slate-200" />
      <div className="space-y-1.5 flex-1">
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
    <div className="h-4 bg-slate-100 rounded w-20" />
    <div className="h-4 bg-slate-100 rounded w-16" />
  </div>
);

export const PageHeaderSkeleton: React.FC = () => (
  <div className="animate-pulse mb-8 space-y-3">
    <div className="h-7 bg-slate-200 rounded-lg w-48" />
    <div className="h-4 bg-slate-100 rounded w-80" />
  </div>
);
