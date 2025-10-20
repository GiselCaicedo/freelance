"use client";

import React from 'react';
import ModuleLayout from '@/shared/components/layouts/ModuleLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleLayout variant="admin">{children}</ModuleLayout>;
}

