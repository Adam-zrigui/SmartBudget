export interface DeleteModalProps {
  delId: string | null;
  setDelId: (id: string | null) => void;
  del: (id: string) => void;
}

export default function DeleteModal({ delId, setDelId, del }: DeleteModalProps) {
  if (!delId) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm rounded-2xl border border-base-200 bg-base-100 p-6 shadow-2xl">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error/10 mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4h8v3" />
          </svg>
        </div>

        <h3 className="text-base font-bold text-center mb-1">Buchung löschen?</h3>
        <p className="text-sm text-center opacity-40 mb-6">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>

        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-sm flex-1"
            onClick={() => setDelId(null)}
          >
            Abbrechen
          </button>
          <button
            className="btn btn-error btn-sm flex-1 font-semibold"
            onClick={() => del(delId)}
          >
            Löschen
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={() => setDelId(null)} />
    </div>
  );
}