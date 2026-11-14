// src/components/common/SkeletonCard.jsx
import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100" />
          <div className="w-24 h-3 rounded-full bg-slate-100" />
        </div>
        <div className="w-16 h-5 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2 pt-1">
        <div className="w-3/4 h-4 rounded-full bg-slate-100" />
        <div className="w-full h-3 rounded-full bg-slate-100" />
      </div>
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <div className="w-14 h-5 rounded-full bg-slate-100" />
        <div className="w-16 h-4 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}

export default SkeletonCard;
