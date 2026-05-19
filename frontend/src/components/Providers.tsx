"use client";

import { useState } from "react";
import { AuthProvider } from "@/lib/auth";
import { RiskContext, SAMPLE_RISKS, type Risk } from "@/lib/riskStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [risks, setRisks] = useState<Risk[]>(SAMPLE_RISKS);

  return (
    <AuthProvider>
      <RiskContext.Provider value={{ risks, setRisks }}>
        {children}
      </RiskContext.Provider>
    </AuthProvider>
  );
}
