import React from 'react';

export default function Nav({ children }: { children: React.ReactNode }) {
  return (
    <nav className="sticky top-0 z-20 flex h-screen min-h-screen flex-shrink-0 border-r border-gray-200 bg-white">
      <div className="flex h-full w-full flex-col overflow-hidden">{children}</div>
    </nav>
  );
}
