"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface TeamContextValue {
  selectedTeamId: string | null;
  selectTeam: (teamId: string) => void;
  clearTeam: () => void;
}

const TeamContext = createContext<TeamContextValue>({
  selectedTeamId: null,
  selectTeam: () => {},
  clearTeam: () => {},
});

const STORAGE_KEY = "kick-summit-team";

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSelectedTeamId(stored);
    setLoaded(true);
  }, []);

  const selectTeam = useCallback((teamId: string) => {
    localStorage.setItem(STORAGE_KEY, teamId);
    setSelectedTeamId(teamId);
  }, []);

  const clearTeam = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedTeamId(null);
  }, []);

  if (!loaded) return null;

  return (
    <TeamContext.Provider value={{ selectedTeamId, selectTeam, clearTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  return useContext(TeamContext);
}
