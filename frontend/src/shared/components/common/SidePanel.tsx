'use client';
import { X } from 'lucide-react';
import { useEffect } from 'react';

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  width?: number; // px
  gap?: number; // px entre panel y contenido
  children: React.ReactNode;
  className?: string;
  /** Elemento contenedor al que se le aplica padding-right cuando el panel está abierto (solo desktop) */
  reserveRef?: React.RefObject<HTMLElement>;
};

export default function SidePanel({
  title,
  open,
  onClose,
  width = 420,
  gap = 24,
  children,
  className,
  reserveRef,
}: Props) {
  // Reserva espacio en desktop (md+) aplicando padding-right al contenedor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:sidepanel', { detail: { open } }));
    }

    const el = reserveRef?.current;
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

    if (!el || !isDesktop) {
      return;
    }

    if (open) {
      el.style.paddingRight = `${width + gap}px`;
    } else {
      el.style.paddingRight = ''; // reset
    }

    return () => {
      if (el) {
        el.style.paddingRight = '';
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:sidepanel', { detail: { open: false } }));
      }
    };
  }, [open, width, gap, reserveRef]);

  return (
    <>
      {/* Desktop */}
      <aside
        className={`fixed top-0 right-0 z-50 hidden h-full border-l border-gray-200 bg-white text-gray-900 transition-transform duration-300 md:block ${open ? 'translate-x-0' : 'translate-x-full'} ${className ?? ''}`}
        style={{ width }}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
            <h3 className="text-base font-semibold">{title}</h3>
            <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100" aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </aside>

      {/* Móvil (overlay, no reserva espacio) */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex-1 bg-black/30" onClick={onClose} />
          <div className="animate-slide-in-right h-full w-[92%] max-w-md border-l border-gray-200 bg-white text-gray-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <h3 className="text-base font-semibold">{title}</h3>
              <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      )}

      <style jsx global>
        {`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: .6; }
          to { transform: translateX(0%); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right .22s ease-out; }
      `}
      </style>
    </>
  );
}
