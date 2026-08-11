"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "koina-admin-nav-collapsed";

const nav = [
  { href: "/admin", label: "Dashboard", short: "D" },
  { href: "/admin/games", label: "Games", short: "G" },
  { href: "/admin/users", label: "Users", short: "U" },
  { href: "/admin/settings", label: "Settings", short: "S" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="border-b border-ink-08 bg-surface">
      <div
        className={`mx-auto grid max-w-[1180px] gap-6 px-6 py-10 lg:gap-8 ${
          collapsed
            ? "lg:grid-cols-[4.5rem_1fr]"
            : "lg:grid-cols-[13rem_1fr]"
        }`}
      >
        {/* Mobile: horizontal bar */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold tracking-[0.08em] text-ink-40 uppercase">
              Admin
            </p>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-[6px] border border-ink-15 px-3 py-1.5 text-xs font-semibold text-ink-70"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? "Hide menu" : "Menu"}
            </button>
          </div>
          {mobileOpen ? (
            <nav className="mt-3 flex flex-wrap gap-1">
              {nav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-[6px] px-3 py-2 text-sm font-semibold no-underline ${
                      active
                        ? "bg-inverse text-on-inverse"
                        : "text-ink-70 hover:bg-base hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/"
                className="rounded-[6px] px-3 py-2 text-sm font-semibold text-accent-600 no-underline"
              >
                ← Site
              </Link>
            </nav>
          ) : null}
        </div>

        {/* Desktop: left collapsible sidebar */}
        <aside className="hidden lg:flex lg:flex-col">
          <div
            className={`mb-4 flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!collapsed ? (
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold tracking-[0.08em] text-ink-40 uppercase">
                Admin
              </p>
            ) : null}
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? "Expand navigation" : "Collapse navigation"}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              className="rounded-[6px] border border-ink-15 px-2 py-1 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold text-ink-70 hover:bg-base hover:text-ink"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`rounded-[6px] text-sm font-semibold no-underline transition-colors ${
                    collapsed
                      ? "flex h-10 items-center justify-center px-0"
                      : "px-3 py-2"
                  } ${
                    active
                      ? "bg-inverse text-on-inverse"
                      : "text-ink-70 hover:bg-base hover:text-ink"
                  }`}
                >
                  {collapsed ? item.short : item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/"
            title="Back to site"
            className={`mt-6 text-xs font-semibold text-accent-600 no-underline ${
              collapsed ? "text-center" : "inline-block"
            }`}
          >
            {collapsed ? "←" : "← Back to site"}
          </Link>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
