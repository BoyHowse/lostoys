"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingState message={t("auth.loading")} />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const response = await register(form);
      setSuccessMessage(
        response?.message || t("auth.register.successMessage"),
      );
      setForm({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone_number: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.register.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="mx-auto max-w-xl space-y-8 rounded-3xl border border-emerald-700/40 bg-emerald-900/20 px-10 py-16 text-center shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
        <h1 className="text-3xl font-semibold text-emerald-200">
          {t("auth.register.successTitle")}
        </h1>
        <p className="text-sm text-neutral-300">{successMessage}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="flex-1 rounded-full border border-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black"
          >
            {t("auth.register.goToLogin")}
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 rounded-full border border-neutral-700 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-neutral-200 transition hover:border-gold hover:text-gold"
          >
            {t("auth.register.backHome")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 rounded-3xl border border-neutral-800 bg-neutral-900/60 px-10 py-12 shadow-glow">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-gold">{t("auth.register.title")}</h1>
        <p className="text-sm text-neutral-400">{t("auth.register.description")}</p>
      </div>
      <form className="grid gap-5" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("auth.register.username")}
          </label>
          <input
            required
            value={form.username}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, username: event.target.value }))
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("auth.register.email")}
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("auth.register.password")}
          </label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("auth.register.firstName")}
            </label>
            <input
              value={form.first_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, first_name: event.target.value }))
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("auth.register.lastName")}
            </label>
            <input
              value={form.last_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, last_name: event.target.value }))
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("auth.register.phone")}
          </label>
          <input
            value={form.phone_number}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone_number: event.target.value }))
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
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
          {isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
        </button>
      </form>
      <p className="text-center text-xs text-neutral-500">
        {t("auth.register.haveAccount")}{" "}
        <Link href="/login" className="text-gold hover:underline">
          {t("auth.register.signIn")}
        </Link>
      </p>
    </div>
  );
}
