import React from 'react';

export default function Nav({ children }: { children: React.ReactNode }) {
  return (
    <nav className="border-r border-gray-200 px-4 py-6 max-h-screen">
      <ul className="flex flex-col h-full">{children}</ul>
    </nav>
  );
}
