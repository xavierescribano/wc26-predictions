"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, callback]);
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

  const isAdmin = session?.user?.role === "ADMIN";

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + "/");
  }

  function navLinkClass(path: string) {
    return isActive(path) ? "nav-link-active" : "nav-link";
  }

  function mobileNavLinkClass(path: string) {
    return isActive(path)
      ? "block px-3 py-2 rounded-md text-sm font-medium text-green-400 bg-slate-700"
      : "block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors";
  }

  const picksLinks = [
    { href: "/picks/groups", label: "Group Stage" },
    { href: "/picks/golden", label: "Golden Boot" },
    { href: "/picks/phase", label: "Knockout Phase" },
  ];

  const isPicksActive = picksLinks.some((l) => isActive(l.href));

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-xl select-none">⚽</span>
            <span className="text-green-400 text-lg font-extrabold tracking-tight">
              WC26
            </span>
            <span className="hidden sm:inline text-slate-400 text-xs font-medium border-l border-slate-600 pl-2 ml-1">
              Prediction League
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className={navLinkClass("/dashboard")}>
              Dashboard
            </Link>

            {/* Picks dropdown */}
            <div className="relative" ref={picksRef}>
              <button
                onClick={() => setPicksOpen((o) => !o)}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isPicksActive
                    ? "text-green-400 bg-slate-700"
                    : "text-slate-300 hover:text-green-400"
                }`}
              >
                Picks
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${picksOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {picksOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 z-50">
                  {picksLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setPicksOpen(false)}
                      className={`block px-4 py-2.5 text-sm transition-colors ${
                        isActive(link.href)
                          ? "text-green-400 bg-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <Link href="/admin" className={navLinkClass("/admin")}>
                Admin
              </Link>
            )}

            <Link href="/profile" className={navLinkClass("/profile")}>
              Profile
            </Link>

            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors duration-150"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            )}
          </div>

          {/* Mobile: hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div ref={mobileRef} className="md:hidden border-t border-slate-700 bg-slate-800">
          <div className="px-3 py-3 space-y-1">
            <Link
              href="/dashboard"
              className={mobileNavLinkClass("/dashboard")}
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </Link>

            {/* Picks section in mobile */}
            <div>
              <p className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Picks
              </p>
              {picksLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={mobileNavLinkClass(link.href)}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className={mobileNavLinkClass("/admin")}
                onClick={() => setMobileOpen(false)}
              >
                Admin
              </Link>
            )}

            <Link
              href="/profile"
              className={mobileNavLinkClass("/profile")}
              onClick={() => setMobileOpen(false)}
            >
              Profile
            </Link>

            {session?.user && (
              <div className="pt-2 border-t border-slate-700 mt-2">
                <div className="px-3 py-2 text-xs text-slate-500 truncate">
                  {session.user.name ?? session.user.email}
                  {isAdmin && (
                    <span className="ml-2 text-green-400 font-semibold">[Admin]</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                >
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
