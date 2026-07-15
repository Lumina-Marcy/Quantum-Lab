import { createContext, useContext, useState } from 'react';

const MissionContext = createContext(null);
const STORAGE_KEY = 'qlab_vault';

export function MissionProvider({ children }) {
  const [vault, setVaultState] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const setVault = (data) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setVaultState(data);
  };

  const clearVault = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setVaultState(null);
  };

  return (
    <MissionContext.Provider value={{ vault, setVault, clearVault }}>
      {children}
    </MissionContext.Provider>
  );
}

export const useMission = () => useContext(MissionContext);
