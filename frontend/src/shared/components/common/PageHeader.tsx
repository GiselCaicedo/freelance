'use client';

import type { ReactNode } from 'react';
import Breadcrumbs from '@/shared/components/ui/Breadcrumbs';

type Crumb = { label: string; href?: string };

type Props = {
  breadcrumbs?: Crumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
  divider?: boolean;
  className?: string;
};

export default function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  divider = true,
  className,
}: Props) {
  return (
    <header className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}>
      <div className="space-y-3">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="space-y-3">
            <Breadcrumbs items={breadcrumbs} />
            {divider && <div className="border border-gray-200" />}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
