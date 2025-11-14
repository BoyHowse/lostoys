"use client";

import { FormEvent, useEffect, useState } from "react";

import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { patch } from "@/lib/fetcher";

export default function SettingsPage() {
  const { user, loading, refresh } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({
    receive_email_alerts: false,
    receive_sms_alerts: false,
    receive_whatsapp_alerts: false,
    phone_number: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        receive_email_alerts: Boolean(user.receive_email_alerts),
        receive_sms_alerts: Boolean(user.receive_sms_alerts),
        receive_whatsapp_alerts: Boolean(user.receive_whatsapp_alerts),
        phone_number: user.phone_number || "",
      });
    }
  }, [user]);

  if (loading) {
    return <LoadingState message={t("loading.loading")} />;
  }

  if (!user) {
    return <p className="text-neutral-400">{t("settings.signInNotice")}</p>;
  }

  const updateSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await patch("/api/accounts/me/", form);
      setMessage(t("settings.feedback.saved"));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.feedback.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gold">{t("settings.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          {t("settings.description")}
        </p>
      </div>
      <form className="space-y-6 rounded-3xl border border-neutral-800 bg-neutral-900/60 px-8 py-8 shadow-glow" onSubmit={updateSettings}>
        <div className="grid gap-6 sm:grid-cols-2">
          <ToggleField
            label={t("settings.toggles.email.title")}
            description={t("settings.toggles.email.description")}
            checked={form.receive_email_alerts}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, receive_email_alerts: value }))
            }
          />
          <ToggleField
            label={t("settings.toggles.sms.title")}
            description={t("settings.toggles.sms.description")}
            checked={form.receive_sms_alerts}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, receive_sms_alerts: value }))
            }
          />
          <ToggleField
            label={t("settings.toggles.whatsapp.title")}
            description={t("settings.toggles.whatsapp.description")}
            checked={form.receive_whatsapp_alerts}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, receive_whatsapp_alerts: value }))
            }
          />
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("settings.phone.label")}
            </label>
            <input
              value={form.phone_number}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone_number: event.target.value }))
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
              placeholder={t("settings.phone.placeholder")}
            />
            <p className="text-xs text-neutral-500">
              {t("settings.phone.helper")}
            </p>
          </div>
        </div>
        {message && (
          <p className="rounded-lg border border-emerald-600/60 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-rose-600/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full border border-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black disabled:opacity-60"
        >
          {saving ? t("settings.buttons.saving") : t("settings.buttons.save")}
        </button>
      </form>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:border-gold/60">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-100">{label}</span>
        <span
          className={`inline-flex h-6 w-12 items-center rounded-full border border-neutral-700 p-1 transition ${checked ? "border-gold bg-gold/30" : "bg-neutral-950"}`}
          role="switch"
          aria-checked={checked}
        >
          <span
            className={`h-4 w-4 rounded-full bg-neutral-300 transition ${checked ? "translate-x-6 bg-gold" : "translate-x-0"}`}
          />
        </span>
      </div>
      <p className="text-xs text-neutral-500">{description}</p>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="hidden"
      />
    </label>
  );
}
