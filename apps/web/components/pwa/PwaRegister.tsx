"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.warn(
        "Installable app support could not be initialized; the online app remains available.",
        error,
      );
    });
  }, []);
  return null;
}
