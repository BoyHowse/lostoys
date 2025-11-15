"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = user
    ? `${(user.first_name || user.username || "").trim()} ${(user.last_name || "").trim()}`.trim().toUpperCase()
    : "";

  const toggleLocale = () => {
    setLocale(locale === "es" ? "en" : "es");
  };

  const actionButtons = (
    <>
      {user && (
        <span className="rounded-full border border-amber-400 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
          {displayName}
        </span>
      )}
      <Link
        href="/"
        className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest transition ${
          pathname === "/"
            ? "border-gold bg-gold/10 text-gold"
            : "border-neutral-700 text-neutral-200 hover:border-gold hover:text-gold"
        }`}
      >
        {t("header.nav.dashboard")}
      </Link>
      <Link
        href="/settings"
        className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest transition ${
          pathname.startsWith("/settings")
            ? "border-gold bg-gold/10 text-gold"
            : "border-neutral-700 text-neutral-200 hover:border-gold hover:text-gold"
        }`}
      >
        {t("header.nav.settings")}
      </Link>
      <button
        type="button"
        onClick={toggleLocale}
        className="rounded-full border border-neutral-700 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-200 transition hover:border-gold hover:text-gold"
        aria-label={t("header.language")}
      >
        {locale === "es"
          ? t("header.languageShort.es")
          : t("header.languageShort.en")}
      </button>
      {user ? (
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            void logout();
          }}
          className="rounded-full border border-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold transition hover:bg-gold hover:text-black"
        >
          {t("header.logout")}
        </button>
      ) : (
        <Link
          href="/login"
          className="rounded-full border border-gold px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gold transition hover:bg-gold hover:text-black"
        >
          {t("header.signIn")}
        </Link>
      )}
    </>
  );

  return (
    <header className="border-b border-gold/30 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-semibold tracking-wide">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold bg-neutral-950 text-gold">
            <span className="relative inline-flex h-6 w-7 items-center justify-center">
              <span className="absolute top-1/2 left-1/2 h-3 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold" />
              <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-gold bg-neutral-950" />
              <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-gold bg-neutral-950" />
            </span>
          </span>
          <span className="font-semibold text-gold">LosToys</span>
        </Link>
        <button
          type="button"
          className="rounded-full border border-neutral-700 p-2 text-neutral-200 transition hover:border-gold hover:text-gold md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden items-center gap-3 text-sm md:flex">{actionButtons}</div>
      </div>
      {mobileOpen && (
        <div className="border-t border-neutral-800 bg-neutral-950/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">{actionButtons}</div>
        </div>
      )}
    </header>
  );
}
