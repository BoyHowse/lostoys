"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

const navLinks = [
  { href: "/", key: "header.nav.dashboard" },
  { href: "/upcoming", key: "header.nav.upcoming" },
  { href: "/settings", key: "header.nav.settings" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();

  const toggleLocale = () => {
    setLocale(locale === "es" ? "en" : "es");
  };

  return (
    <header className="border-b border-gold/30 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
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
        <nav className="flex items-center gap-6 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`uppercase tracking-wide transition hover:text-gold ${isActive ? "text-gold" : "text-neutral-200"}`}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4 text-sm text-neutral-200">
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
            <>
              <div className="flex flex-col leading-tight">
                <span className="text-xs uppercase tracking-widest text-neutral-400">
                  {t("header.loggedAs")}
                </span>
                <span className="text-gold">
                  {user.first_name || user.username} {user.last_name || ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
                className="rounded-full border border-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold transition hover:bg-gold hover:text-black"
              >
                {t("header.logout")}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-gold px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gold transition hover:bg-gold hover:text-black"
            >
              {t("header.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
