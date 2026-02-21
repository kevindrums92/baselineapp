import { useEffect, useRef, useState } from "react";

type Props = {
  onEdit: () => void;
  onDelete: () => void;
};

export default function RowMenu({ onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (btnRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border px-2 py-1 text-sm font-semibold hover:bg-gray-50"
        aria-label="Abrir menú"
        title="Opciones"
      >
        ⋮
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border bg-white shadow-lg"
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
