"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import InstallAppButton from "./InstallAppButton";

/** On the home page the navbar stays off-screen over the hero and only
 * fades/slides in once the user scrolls into the section below it — the
 * hero fills the viewport on its own, so a sticky bar reserving space above
 * it just added dead air. Every other route keeps the normal always-on
 * sticky bar. */
export default function AppHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [revealed, setRevealed] = useState(!isHome);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setRevealed(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header
      className={`z-20 w-full border-b border-hairline bg-background/80 backdrop-blur-md ${
        isHome
          ? `fixed top-0 transition-all duration-300 ${
              revealed ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
            }`
          : "sticky top-0"
      }`}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <div className="w-20" />
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gold font-display text-[11px] text-gold transition-transform duration-300 group-hover:scale-110">
            P
          </div>
          <span className="font-display text-base tracking-wide text-foreground transition-colors group-hover:text-gold">
            Piano Priv&eacute;
          </span>
        </Link>
        <div className="flex w-20 justify-end">
          <InstallAppButton />
        </div>
      </div>
    </header>
  );
}
