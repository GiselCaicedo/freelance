'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  width?: number;          // px
  gap?: number;            // px entre panel y contenido
  children: React.ReactNode;
  className?: string;
  /** Elemento contenedor al que se le aplica padding-right cuando el panel está abierto (solo desktop) */
  reserveRef?: React.RefObject<HTMLElement>;
};

export default function SidePanel({
  title, open, onClose, width = 420, gap = 24, children, className, reserveRef
}: Props) {
  // Reserva espacio en desktop (md+) aplicando padding-right al contenedor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:sidepanel', { detail: { open } }));
    }

    const el = reserveRef?.current;
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

    if (!el || !isDesktop) return;

    if (open) {
      el.style.paddingRight = `${width + gap}px`;
    } else {
      el.style.paddingRight = ''; // reset
    }

    return () => {
      if (el) el.style.paddingRight = '';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:sidepanel', { detail: { open: false } }));
      }
    };
  }, [open, width, gap, reserveRef]);

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden md:block fixed top-0 right-0 h-full bg-white text-gray-900 border-l border-gray-200 transition-transform duration-300 z-50 ${open ? 'translate-x-0' : 'translate-x-full'} ${className ?? ''}`}
        style={{ width }}
        aria-hidden={!open}
      >
        <div className="flex flex-col h-full">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
            <h3 className="text-base font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </aside>

      {/* Móvil (overlay, no reserva espacio) */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex-1 bg-black/30" onClick={onClose} />
          <div className="w-[92%] max-w-md h-full bg-white text-gray-900 border-l border-gray-200 animate-slide-in-right">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
              <h3 className="text-base font-semibold">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: .6; }
          to { transform: translateX(0%); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right .22s ease-out; }
      `}</style>
    </>
  );
}
