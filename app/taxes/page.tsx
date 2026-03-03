'use client'

import { useEffect, useState } from 'react';
// avoiding Next.js Link due to runtime bug

import PageAnimationWrapper from '@/components/PageAnimationWrapper';

type StateTax = {
  name: string;
  abbr?: string;
  vat_standard?: number;
  vat_reduced?: number;
  church_tax_rate?: number;
  municipal_tax_range?: { min: number; max: number };
  notes?: string;
};

export default function TaxesPage() {
  const [data, setData] = useState<StateTax[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StateTax | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/taxes')
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (!j.ok) throw new Error(j.error || 'Failed to load');
        const items = Array.isArray(j.data) ? j.data : Object.values(j.data ?? {});
        setData(items);
        if (items.length > 0) setSelected(items[0]);
      })
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="spinner spinner-lg"></div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-base-100 py-12">
        <div className="ui-container mx-auto px-6 max-w-md">
          <div className="alert alert-error rounded-2xl">
            <span>Error loading tax data: {error}</span>
          </div>
        </div>
      </div>
    );

  if (!data || data.length === 0)
    return (
      <div className="min-h-screen bg-base-100 py-12">
        <div className="ui-container mx-auto px-6 max-w-md">
          <div className="alert alert-info rounded-2xl">
            <span>No tax data available.</span>
          </div>
        </div>
      </div>
    );

  return (
    <PageAnimationWrapper>
    <div className="min-h-screen bg-base-100 py-12">
      <div className="ui-container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content">Bundesländer Tax Rates</h1>
            <p className="text-sm text-base-content/70 mt-2">Official VAT, church tax, and municipal tax information for all German states</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <aside className="md:col-span-1">
              <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6 sticky top-6">
                <h2 className="font-semibold text-base-content mb-4">States</h2>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {data.map((state) => (
                    <button
                      key={state.name}
                      onClick={() => setSelected(state)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                        selected?.name === state.name
                          ? 'bg-primary text-primary-content shadow-lg'
                          : 'hover:bg-base-200/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{state.name}</div>
                      <div className={`text-xs ${selected?.name === state.name ? 'opacity-80' : 'opacity-60'}`}>{state.abbr}</div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <section className="md:col-span-3">
              {selected && (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="bg-base-100 border border-base-200/50 rounded-2xl p-8">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <h2 className="text-3xl font-bold text-base-content">{selected.name}</h2>
                        {selected.notes && <p className="text-sm text-base-content/70 mt-2">{selected.notes}</p>}
                      </div>
                      <div className="text-4xl font-bold text-primary bg-primary/10 rounded-xl px-6 py-4">{selected.abbr}</div>
                    </div>
                  </div>

                  {/* Tax Rates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* VAT Standard */}
                    <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                      <div className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">VAT Standard Rate</div>
                      <div className="mt-3">
                        <div className="text-4xl font-bold text-primary">{selected.vat_standard}%</div>
                        <p className="text-xs text-base-content/70 mt-2">Standard rate for most goods and services</p>
                      </div>
                    </div>

                    {/* VAT Reduced */}
                    <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                      <div className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">VAT Reduced Rate</div>
                      <div className="mt-3">
                        <div className="text-4xl font-bold text-secondary">{selected.vat_reduced}%</div>
                        <p className="text-xs text-base-content/70 mt-2">Books, food, medicine, and essentials</p>
                      </div>
                    </div>

                    {/* Church Tax */}
                    <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                      <div className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">Church Tax</div>
                      <div className="mt-3">
                        <div className="text-4xl font-bold text-accent">{selected.church_tax_rate}%</div>
                        <p className="text-xs text-base-content/70 mt-2">For registered church members only</p>
                      </div>
                    </div>

                    {/* Municipal Tax */}
                    {selected.municipal_tax_range && (
                      <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                        <div className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">Municipal Trade Tax</div>
                        <div className="mt-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm text-base-content/70">Multiplier Range:</span>
                            <span className="text-2xl font-bold text-base-content">{selected.municipal_tax_range.min}% – {selected.municipal_tax_range.max}%</span>
                          </div>
                          <p className="text-xs text-base-content/70 mt-2">Varies by municipality (Hebesatz)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-warning/10 border border-warning/30 rounded-2xl p-6">
                    <p className="text-sm text-base-content/80 leading-relaxed">
                      <strong>Disclaimer:</strong> Tax regulations change frequently and may have local variations. This information is provided for reference only. For accurate tax calculations and official filings, please consult your state's finance office (Finanzbehörde) or a qualified tax advisor.
                    </p>
                  </div>

                  {/* Back Link */}
                  <div className="flex justify-start">
                    <a href="/" className="btn btn-outline rounded-xl">
                      Back to dashboard
                    </a>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
    </PageAnimationWrapper>
  );
}
