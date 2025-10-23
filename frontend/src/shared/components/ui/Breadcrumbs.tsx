'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm text-gray-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1">
              {item.href && !isLast
                ? (
                    <Link
                      href={item.href}
                      className="rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                      {item.label}
                    </Link>
                  )
                : (
                    <span
                      className={isLast ? 'px-1 font-medium text-gray-900' : 'px-1 text-gray-600'}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
              {!isLast && <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
