import React, { createContext, useContext, useState, useEffect } from 'react';

interface ScenarioContextType {
  activeScenarioId: string;
  setActiveScenarioId: (id: string) => void;
}

const ScenarioContext = createContext<ScenarioContextType>({
  activeScenarioId: 'feni',
  setActiveScenarioId: () => {},
});

export const ScenarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScenarioId, setActiveScenarioIdState] = useState<string>(() => {
    return localStorage.getItem('reliefnet_active_scenario') || 'feni';
  });

  const setActiveScenarioId = (id: string) => {
    setActiveScenarioIdState(id);
    localStorage.setItem('reliefnet_active_scenario', id);
  };

  return (
    <ScenarioContext.Provider value={{ activeScenarioId, setActiveScenarioId }}>
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = () => useContext(ScenarioContext);
