"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import VehicleCard from "@/components/VehicleCard";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { get } from "@/lib/fetcher";

type Document = {
  id: number;
  type: string;
  type_display?: string;
  expiry_date: string;
  status_indicator: string;
};

type Car = {
  id: number;
  brand: string;
  model: string;
  plate: string;
  year: number;
  estimated_value?: string;
  status: string;
  health_status: string;
  documents: Document[];
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [cars, setCars] = useState<Car[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || loading) {
      return;
    }
    setFetching(true);
    get("/api/cars/")
      .then((data) => {
        setCars(data.results ?? data);
        setError(null);
      })
      .catch((err: Error & { payload?: unknown }) => {
        setError(err.message || t("dashboard.error"));
      })
      .finally(() => setFetching(false));
  }, [user, loading, t]);

  const stats = useMemo(() => {
    const statusCount: Record<"total" | "green" | "yellow" | "red", number> = {
      total: cars.length,
      green: 0,
      yellow: 0,
      red: 0,
    };
    cars.forEach((car) => {
      if (car.health_status === "green") statusCount.green += 1;
      else if (car.health_status === "yellow") statusCount.yellow += 1;
      else if (car.health_status === "red") statusCount.red += 1;
    });
    return statusCount;
  }, [cars]);

  if (loading) {
    return <LoadingState message={t("loading.booting")} />;
  }

  if (!user) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-semibold text-gold">{t("dashboard.guestTitle")}</h1>
        <p className="max-w-xl text-neutral-300">
          {t("dashboard.guestDescription")}
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-full border border-gold px-6 py-2 text-sm font-semibold uppercase tracking-widest text-gold transition hover:bg-gold hover:text-black"
          >
            {t("dashboard.buttons.signIn")}
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-neutral-700 px-6 py-2 text-sm font-semibold uppercase tracking-widest text-neutral-200 transition hover:border-gold hover:text-gold"
          >
            {t("dashboard.buttons.createAccount")}
          </Link>
        </div>
      </div>
    );
  }

  if (fetching) {
    return <LoadingState message={t("loading.syncingVehicles")} />;
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-cover bg-center text-white"
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(0,0,0,0.92), rgba(0,0,0,0.85)), url('/backgrounds/dashboard-car.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "top left",
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12">
        <div className="space-y-10 rounded-3xl border border-white/5 bg-black/70 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div>
          <h1 className="text-4xl font-semibold text-gold">{t("dashboard.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            {t("dashboard.subtitle")}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-600/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("dashboard.stats.total")}
            </p>
            <p className="mt-3 text-3xl font-semibold text-neutral-100">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-900/20 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              {t("dashboard.stats.green")}
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-200">
              {stats.green}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-600/40 bg-amber-900/20 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200">
              {t("dashboard.stats.yellow")}
            </p>
            <p className="mt-3 text-3xl font-semibold text-amber-200">
              {stats.yellow}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-600/40 bg-rose-900/20 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-200">
              {t("dashboard.stats.red")}
            </p>
            <p className="mt-3 text-3xl font-semibold text-rose-200">
              {stats.red}
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-neutral-400">
              {t("dashboard.sections.overview")}
            </h2>
            <Link
              href="/cars/new"
              className="rounded-full border border-gold px-4 py-1 text-xs font-semibold uppercase tracking-widest text-gold transition hover:bg-gold hover:text-black"
            >
              {t("dashboard.buttons.addVehicle")}
            </Link>
          </div>
          {cars.length === 0 ? (
            <EmptyState
              title={t("dashboard.empty.title")}
              description={t("dashboard.empty.description")}
              action={
                <Link
                  href="/cars/new"
                  className="rounded-full border border-gold px-5 py-2 text-xs font-semibold uppercase tracking-widest text-gold transition hover:bg-gold hover:text-black"
                >
                  {t("dashboard.buttons.addVehicle")}
                </Link>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {cars.map((car) => (
                <VehicleCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  );
}
