'use client';

import { usePermission } from '@/libs/acl/PermissionProvider';

export function Can({
  anyOf,
  allOf,
  children,
  elseRender = null,
}: {
  anyOf?: string[];
  allOf?: string[];
  children: React.ReactNode;
  elseRender?: React.ReactNode;
}) {
  const { canAny, canAll } = usePermission();
  const ok =
    (anyOf ? canAny(anyOf) : true) &&
    (allOf ? canAll(allOf) : true);

  return ok ? <>{children}</> : <>{elseRender}</>;
}
