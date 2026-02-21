/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';

type HeaderActionsContextType = {
  action: ReactNode;
  setAction: (node: ReactNode) => void;
};

const HeaderActionsContext = createContext<HeaderActionsContextType>({
  action: null,
  setAction: () => {},
});

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<ReactNode>(null);
  return (
    <HeaderActionsContext.Provider value={{ action, setAction }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function useHeaderActions() {
  return useContext(HeaderActionsContext);
}
