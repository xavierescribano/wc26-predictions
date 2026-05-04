"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [picksOpen, setPicksOpen] = useState(false);
  const picksRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  useOutsideClick(picksRef, () => setPicksOpen(false));
  useOutsideClick(mobileRef, () => setMobileOpen(false));

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + "/");
  }

  const picksLinks = [
    { href: "/picks/groups", label: "🏟️ Group Stage" },
    { href: "/picks/special", label: "⭐ Special Picks" },
    { href: "/picks/countries-fight", label: "⚔️ Countries Fight" },
  ];
  const isPicksActive = picksLinks.some((l) => isActive(l.href)) || isActive("/picks");

  const navBase = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150";
  const link = `${navBase} text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400`;
  const active = `${navBase} text-green-600 dark:text-green-400 bg-green-50 dark:bg-slate-700`;

  const mobileLink = `block px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors`;
  const mobileActive = `block px-3 py-2 rounded-md text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-slate-700`;

  return (
    <nav className="sticky top-0 z-50 shadow-sm border-b bg-[var(--nav-bg)] border-[var(--nav-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0" onClick={() => setMobileOpen(false)}>
            <span className="text-xl">⚽</span>
            <span className="text-green-600 dark:text-green-400 text-lg font-extrabold tracking-tight">WC26</span>
            <span className="hidden sm:inline text-slate-400 text-xs font-medium border-l border-slate-300 dark:border-slate-600 pl-2 ml-1">
              Prediction League
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className={isActive("/dashboard") ? active : link}>Dashboard</Link>

            {/* Picks dropdown */}
            <div className="relative" ref={picksRef}>
              <button
                onClick={() => setPicksOpen((o) => !o)}
                className={`flex items-center gap-1 ${isPicksActive ? active : link}`}
              >
                Picks
                <svg className={`h-3.5 w-3.5 transition-transform ${picksOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {picksOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-xl shadow-xl py-1 z-50 bg-[var(--card-bg)] border border-[var(--card-border)]">
                  {picksLinks.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setPicksOpen(false)}
                      className={`block px-4 py-2.5 text-sm transition-colors ${
                        isActive(l.href)
                          ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-slate-700"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {l.label}
                    </Link>
                  ))}
                  <div className="border-t border-[var(--card-border)] mt-1 pt-1">
                    <Link href="/picks/r32" onClick={() => setPicksOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      🏆 Knockout Rounds
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {isAdmin && <Link href="/admin" className={isActive("/admin") ? active : link}>Admin</Link>}
            <Link href="/profile" className={isActive("/profile") ? active : link}>Profile</Link>

            <ThemeToggle />

            {session?.user && (
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            )}
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => setMobileOpen((o) => !o)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              {mobileOpen
                ? <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div ref={mobileRef} className="md:hidden border-t bg-[var(--nav-bg)] border-[var(--nav-border)]">
          <div className="px-3 py-3 space-y-1">
            <Link href="/dashboard" className={isActive("/dashboard") ? mobileActive : mobileLink} onClick={() => setMobileOpen(false)}>Dashboard</Link>

            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Picks</p>
            {picksLinks.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? mobileActive : mobileLink} onClick={() => setMobileOpen(false)}>{l.label}</Link>
            ))}
            <Link href="/picks/r32" className={mobileLink} onClick={() => setMobileOpen(false)}>🏆 Knockout Rounds</Link>

            {isAdmin && <Link href="/admin" className={isActive("/admin") ? mobileActive : mobileLink} onClick={() => setMobileOpen(false)}>Admin</Link>}
            <Link href="/profile" className={isActive("/profile") ? mobileActive : mobileLink} onClick={() => setMobileOpen(false)}>Profile</Link>

            {session?.user && (
              <div className="pt-2 border-t border-[var(--card-border)] mt-2">
                <div className="px-3 py-2 text-xs text-slate-400 truncate">
                  {(session.user as { name?: string; email?: string }).name ?? (session.user as { email?: string }).email}
                  {isAdmin && <span className="ml-2 text-green-500 font-semibold">[Admin]</span>}
                </div>
                <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/login" }); }}
                  className="w-full text-left block px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
