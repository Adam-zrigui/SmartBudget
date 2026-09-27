"use client"

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import Header from './Header';

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
    <div className="app-frame">
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
      <div className="sb-workspace">
        <Header
          tab={tab}
          txsLength={txsLength}
          exportCSV={exportCSV}
          onHamburger={() => setDrawerOpen((o) => !o)}
        />
        <main className="sb-content">
          <div className="sb-content-inner animate-in fade-in slide-in-from-bottom-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
