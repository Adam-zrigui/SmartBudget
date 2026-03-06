"use client"

import React from 'react';
import Sidebar, { SidebarProps } from './Sidebar';

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  taxResult: any;
  txsLength: number;
  tab: string;
  setTab: (t: string) => void;
}

export default function MobileDrawer({
  open,
  onClose,
  taxResult,
  txsLength,
  tab,
  setTab,
}: MobileDrawerProps) {
  return (
    <div className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* sliding panel */}
      <div
        className={`absolute left-0 top-0 h-full bg-sidebar w-full sm:w-[80vw] sm:max-w-xs transform transition-transform shadow-lg
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          className="absolute top-2 right-2 btn btn-ghost btn-sm btn-square"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 dark:scrollbar-thumb-base-700">
          <Sidebar
            taxResult={taxResult}
            txsLength={txsLength}
            tab={tab}
            setTab={(t) => {
              setTab(t);
              onClose();
            }}
            onNavigate={onClose}
          />
        </div>
      </div>
    </div>
  );
}
