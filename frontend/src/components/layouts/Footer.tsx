import React from 'react';

export default function Footer() {
  return (
    <footer className="flex items-center justify-center py-3 text-sm text-gray-500 bg-white">
      <span>
        CIFRA PAY © {new Date().getFullYear()} — Todos los derechos reservados
      </span>
    </footer>
  );
}
