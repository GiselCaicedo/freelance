'use client';
import { createContext, use } from 'react';

type EnterpriseContextProps = {
  empresaId: string | null;
  empresaName: string | null;
};

const EnterpriseContext = createContext<EnterpriseContextProps>({
  empresaId: null,
  empresaName: null,
});

export const useEnterprise = () => use(EnterpriseContext);

export const EnterpriseProvider = ({
  children,
  empresaId,
  empresaName,
}: {
  children: React.ReactNode;
  empresaId: string | null;
  empresaName: string | null;
}) => {
  return (
    <EnterpriseContext value={{ empresaId, empresaName }}>
      {children}
    </EnterpriseContext>
  );
};
