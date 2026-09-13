"use client";

import { createContext, useContext, type ReactNode } from "react";

const Ctx = createContext("/mitra");

export function DasarMitraProvider({ dasar, children }: { dasar: string; children: ReactNode }) {
  return <Ctx.Provider value={dasar}>{children}</Ctx.Provider>;
}

/** Prefix for owner-surface links in client components. */
export function useDasarMitra() {
  return useContext(Ctx);
}
