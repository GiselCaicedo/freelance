import React from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, description, action, children }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description ? <p className="text-sm text-gray-500">{description}</p> : null}
        </div>
        {action ? <div className="mt-2 sm:mt-0">{action}</div> : null}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
