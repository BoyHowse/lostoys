"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { post } from "@/lib/fetcher";

export default function NewCarPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    brand: "",
    model: "",
    plate: "",
    year: new Date().getFullYear(),
    estimated_value: "",
    status: "active",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <LoadingState message={t("loading.loading")} />;
  }

  if (!user) {
    return <p className="text-neutral-400">{t("newCar.signInNotice")}</p>;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        estimated_value: Number(form.estimated_value || 0),
      };
      const car = await post("/api/cars/", payload);
      router.replace(`/cars/${car.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("newCar.feedback.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 rounded-3xl border border-neutral-800 bg-neutral-900/60 px-10 py-12 shadow-glow">
      <div>
        <h1 className="text-3xl font-semibold text-gold">{t("newCar.title")}</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {t("newCar.description")}
        </p>
      </div>
      <form className="grid gap-5" onSubmit={onSubmit}>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("newCar.fields.brand")}
            </label>
            <input
              required
              value={form.brand}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, brand: event.target.value }))
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("newCar.fields.model")}
            </label>
            <input
              required
              value={form.model}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, model: event.target.value }))
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("newCar.fields.plate")}
            </label>
            <input
              required
              value={form.plate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, plate: event.target.value.toUpperCase() }))
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("newCar.fields.year")}
            </label>
            <input
              type="number"
              min={1950}
              max={new Date().getFullYear() + 1}
              required
              value={form.year}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, year: Number(event.target.value) }))
              }
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("newCar.fields.estimatedValue")}
          </label>
          <input
            type="number"
            min={0}
            value={form.estimated_value}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, estimated_value: event.target.value }))
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("newCar.fields.status")}
          </label>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, status: event.target.value }))
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          >
            <option value="active">{t("newCar.statusOptions.active")}</option>
            <option value="sold">{t("newCar.statusOptions.sold")}</option>
            <option value="inactive">{t("newCar.statusOptions.inactive")}</option>
          </select>
        </div>
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
          {saving ? t("newCar.buttons.saving") : t("newCar.buttons.submit")}
        </button>
      </form>
    </div>
  );
}
