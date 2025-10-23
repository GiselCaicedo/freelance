import React from 'react';

export default function Footer() {
  return (
    <footer className="flex items-center justify-center bg-white py-3 text-sm text-gray-500">
      <span>
        CIFRA PAY ©
        {' '}
        {new Date().getFullYear()}
        {' '}
        — Todos los derechos reservados
      </span>
    </footer>
  );
}
