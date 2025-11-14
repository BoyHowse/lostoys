"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const redirectTo = useMemo(() => params.get("redirect") ?? "/", [params]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return <LoadingState message={t("auth.loading")} />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login(form);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.login.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-8 rounded-3xl border border-neutral-800 bg-neutral-900/60 px-10 py-12 shadow-glow">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-gold">{t("auth.login.title")}</h1>
        <p className="text-sm text-neutral-400">{t("auth.login.description")}</p>
      </div>
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("auth.login.username")}
          </label>
          <input
            value={form.username}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, username: event.target.value }))
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
            placeholder="demo"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("auth.login.password")}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        {error && (
          <p className="rounded-lg border border-rose-600/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full border border-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black disabled:opacity-60"
        >
          {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>
      <p className="text-center text-xs text-neutral-500">
        {t("auth.login.needAccount")}{" "}
        <Link href="/register" className="text-gold hover:underline">
          {t("auth.login.createOne")}
        </Link>
      </p>
      <p className="text-center text-xs text-neutral-500">
        {t("auth.demoCredentials")}
      </p>
    </div>
  );
}
