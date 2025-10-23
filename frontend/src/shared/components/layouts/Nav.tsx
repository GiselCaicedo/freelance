import React from 'react';

export default function Nav({ children }: { children: React.ReactNode }) {
  return (
    <nav className="max-h-screen border-r border-gray-200 px-4 py-6">
      <ul className="flex h-full flex-col">{children}</ul>
    </nav>
  );
}
