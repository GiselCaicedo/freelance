'use client';
import { createContext, useContext } from 'react';

interface EnterpriseContextProps {
  empresaId: string | null;
  empresaName: string | null;
}

const EnterpriseContext = createContext<EnterpriseContextProps>({
  empresaId: null,
  empresaName: null,
});

export const useEnterprise = () => useContext(EnterpriseContext);

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
    <EnterpriseContext.Provider value={{ empresaId, empresaName }}>
      {children}
    </EnterpriseContext.Provider>
  );
};
