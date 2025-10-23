'use client';

import ModuleLayout from '@shared/components/layouts/ModuleLayout';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleLayout variant="client">{children}</ModuleLayout>;
}
