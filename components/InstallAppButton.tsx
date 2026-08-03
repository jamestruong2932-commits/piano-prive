"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isStandalone) return null;

  if (installEvent) {
    return (
      <button
        onClick={async () => {
          await installEvent.prompt();
          const { outcome } = await installEvent.userChoice;
          if (outcome === "accepted") setInstallEvent(null);
        }}
        className="rounded-full border border-gold px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-forest-deep"
      >
        Cài đặt
      </button>
    );
  }

  if (isIos) {
    return (
      <span className="text-[10px] uppercase tracking-widest text-muted">
        Chia sẻ → Thêm vào MH chính
      </span>
    );
  }

  return null;
}
