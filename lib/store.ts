import { create } from 'zustand';
import { SEED } from './utils';
import type { Language } from './translations';

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string;
  tag?: string;
}

export interface BudgetState {
  txs: Transaction[];
  addTx: (tx: Transaction) => void;
  updateTx: (tx: Transaction) => void;
  deleteTx: (id: string) => void;
}

export interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  txs: SEED as unknown as Transaction[],
  addTx: (tx) => set((s) => ({ txs: [...s.txs, tx] })),
  updateTx: (tx) =>
    set((s) => ({ txs: s.txs.map((t) => (t.id === tx.id ? tx : t)) })),
  deleteTx: (id) => set((s) => ({ txs: s.txs.filter((t) => t.id !== id) })),
}));

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'de' as Language,
  setLanguage: (lang: Language) => set({ language: lang }),
}));
