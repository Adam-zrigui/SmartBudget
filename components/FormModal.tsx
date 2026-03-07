import { useLanguageStore } from '@/lib/store';
import { useTranslations } from '@/lib/translations';

export interface FormData {
  type: 'expense' | 'income';
  amount: string;
  category: string;
  description: string;
  date: string;
  tag: '' | 'recurring' | 'annual';
}

export interface FormModalProps {
  showForm: boolean;
  form: FormData;
  setForm: (f: FormData | ((prev: FormData) => FormData)) => void;
  cur: string;
  save: () => void | Promise<void>;
  setShowForm: (b: boolean) => void;
  editId: string | null;
  CATEGORIES: Array<{ type: string; name: string; icon: string }>;
  IC: { x: string; ok: string };
}

export default function FormModal({
  showForm,
  form,
  setForm,
  cur,
  save,
  setShowForm,
  editId,
  CATEGORIES,
  IC,
}: FormModalProps) {
  if (!showForm) return null;

  const language = useLanguageStore((s) => s.language);
  const t = useTranslations(language);

  const cats = CATEGORIES.filter((ct) => ct.type === form.type);

  return (
    <div className="modal modal-open">
      <div
        className="modal-box w-11/12 max-w-md sm:max-w-lg bg-base-100 rounded-2xl shadow-2xl border border-base-200 p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Mobile optimized */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-base-200 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold tracking-tight">
              {editId ? (language === 'de' ? 'Buchung bearbeiten' : 'Edit entry') : t.form.newEntry}
            </h3>
            <p className="text-xs opacity-40 mt-0.5">{t.form.fillAllFields}</p>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-square -mr-1 -mt-1 flex-shrink-0"
            onClick={() => setShowForm(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-4">
          {/* Type toggle - Better mobile layout */}
          <div className="flex rounded-xl overflow-hidden border border-base-300 p-1 bg-base-200">
            {[{ key: 'expense', label: t.form.expense }, { key: 'income', label: t.form.income }].map((opt) => (
              <button
                key={opt.key}
                className={`flex-1 py-2.5 sm:py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                  form.type === opt.key
                    ? opt.key === 'expense'
                      ? 'bg-error text-error-content shadow-sm'
                      : 'bg-success text-success-content shadow-sm'
                    : 'opacity-40 hover:opacity-60'
                }`}
                onClick={() =>
                  setForm((f: any) => ({
                    ...f,
                    type: opt.key,
                    category: opt.key === 'income' ? 'Gehalt' : 'Lebensmittel',
                  }))
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Amount - Larger on mobile for easier input */}
          <div>
            <label className="text-xs font-medium opacity-50 uppercase tracking-wider block mb-2">
              {t.form.amount} ({cur})
            </label>
            <div className="relative">
              <input
                className="input input-bordered w-full text-lg sm:text-xl font-bold tabular-nums pr-12 py-3 sm:py-2"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f: any) => ({ ...f, amount: e.target.value }))}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-40 font-medium">
                {cur}
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium opacity-50 uppercase tracking-wider">{t.form.category}</label>
            <select
              className="select select-bordered w-full mt-1.5 text-sm"
              value={form.category}
              onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))}
            >
              {cats.map((ct) => (
                <option key={ct.name} value={ct.name}>
                  {ct.icon} {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium opacity-50 uppercase tracking-wider">{t.form.description}</label>
            <input
              className="input input-bordered w-full mt-1.5 text-sm"
              type="text"
              placeholder={t.form.enterDescription}
              value={form.description}
              onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Date + Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium opacity-50 uppercase tracking-wider">{t.form.dateLabel}</label>
              <input
                className="input input-bordered w-full mt-1.5 text-sm"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f: any) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium opacity-50 uppercase tracking-wider">{t.form.tagLabel}</label>
              <select
                className="select select-bordered w-full mt-1.5 text-sm"
                value={form.tag}
                onChange={(e) => setForm((f: any) => ({ ...f, tag: e.target.value }))}
              >
                <option value="">{t.form.noTag}</option>
                <option value="recurring">{t.form.recurring}</option>
                <option value="annual">{t.form.annual}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-base-200 flex items-center justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
            {t.form.cancel}
          </button>
          <button className="btn btn-primary btn-sm gap-2 font-semibold" onClick={save}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {editId ? (language === 'de' ? 'Speichern' : 'Save') : t.form.create}
          </button>
        </div>
      </div>

      {/* Backdrop click to close */}
      <div className="modal-backdrop" onClick={() => setShowForm(false)} />
    </div>
  );
}
