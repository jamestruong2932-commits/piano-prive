import Link from "next/link";
import InstallAppButton from "./InstallAppButton";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <div className="w-20" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gold font-display text-[11px] text-gold">
            P
          </div>
          <Link
            href="/"
            className="font-display text-base tracking-wide text-foreground"
          >
            Piano Priv&eacute;
          </Link>
        </div>
        <div className="flex w-20 justify-end">
          <InstallAppButton />
        </div>
      </div>
    </header>
  );
}
