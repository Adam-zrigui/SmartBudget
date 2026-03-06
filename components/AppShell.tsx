"use client"

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import Header, { HeaderProps } from './Header';

interface AppShellProps {
  children: ReactNode;
  tab?: string;
  txsLength?: number;
  exportCSV?: () => void;
  taxResult?: any;
  setTab?: (t: string) => void;
}

export default function AppShell({
  children,
  tab = '',
  txsLength = 0,
  exportCSV = () => {},
  taxResult = {},
  setTab = () => {},
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        taxResult={taxResult}
        txsLength={txsLength}
        tab={tab}
        setTab={(t) => {
          setTab(t);
        }}
      />
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar
          taxResult={taxResult}
          txsLength={txsLength}
          tab={tab}
          setTab={setTab}
          onNavigate={() => setDrawerOpen(false)}
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          tab={tab}
          txsLength={txsLength}
          exportCSV={exportCSV}
          onHamburger={() => setDrawerOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8 bg-base-100 transition-colors duration-200">
          <div className="ui-container mx-auto w-full max-w-none lg:max-w-7xl animate-in fade-in slide-in-from-bottom-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
