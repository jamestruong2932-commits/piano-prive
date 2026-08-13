import Link from "next/link";
import InstallAppButton from "./InstallAppButton";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-background/80 backdrop-blur-md">
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
