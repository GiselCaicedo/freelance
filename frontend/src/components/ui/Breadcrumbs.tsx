'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm text-gray-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'px-1 font-medium text-gray-900' : 'px-1 text-gray-600'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
