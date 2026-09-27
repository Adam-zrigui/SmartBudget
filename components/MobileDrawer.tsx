"use client";

import { X } from "lucide-react";
import Sidebar from "./Sidebar";

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  taxResult: any;
  txsLength: number;
  tab: string;
  setTab: (tab: string) => void;
}

export default function MobileDrawer({ open, onClose, taxResult, txsLength, tab, setTab }: MobileDrawerProps) {
  return (
    <div className={`sb-mobile-drawer-overlay lg:hidden${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button className="absolute inset-0" onClick={onClose} aria-label="Close navigation" />
      <div className="sb-mobile-drawer">
        <button className="sb-mobile-close" onClick={onClose} aria-label="Close sidebar">
          <X className="size-4" />
        </button>
        <div className="h-full overflow-y-auto pr-12">
          <Sidebar
            taxResult={taxResult}
            txsLength={txsLength}
            tab={tab}
            setTab={(nextTab) => {
              setTab(nextTab);
              onClose();
            }}
            onNavigate={onClose}
          />
        </div>
      </div>
    </div>
  );
}
