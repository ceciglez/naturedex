"use client";

import { useSyncExternalStore } from "react";
import { getDexSnapshot, getServerDexSnapshot, subscribeDex } from "@/lib/dex/store";

export function useDex() {
  return useSyncExternalStore(subscribeDex, getDexSnapshot, getServerDexSnapshot);
}
