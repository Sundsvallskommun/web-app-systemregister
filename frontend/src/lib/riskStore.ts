"use client";

import { createContext, useContext } from "react";

export interface Risk {
  id: string;
  title: string;
  description: string;
  probability: string;
  impact: string;
  status: string;
  system: string;
  owner: string;
  dueDate: string;
}

export const SAMPLE_RISKS: Risk[] = [
  { id: "1", title: "Otillräcklig backup för Treserva", description: "Backup-rutin saknar verifiering", probability: "high", impact: "critical", status: "open", system: "SYS-003", owner: "Maria Björk", dueDate: "2026-04-15" },
  { id: "2", title: "Saknad MFA för ByggR", description: "Systemet saknar multifaktorautentisering", probability: "medium", impact: "high", status: "open", system: "SYS-002", owner: "Jonas Lindqvist", dueDate: "2026-05-01" },
];

interface RiskContextValue {
  risks: Risk[];
  setRisks: (risks: Risk[]) => void;
}

export const RiskContext = createContext<RiskContextValue>({
  risks: SAMPLE_RISKS,
  setRisks: () => {},
});

export function useRisks() {
  return useContext(RiskContext);
}
