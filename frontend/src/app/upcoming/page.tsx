"use client";

import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
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
  documents: Document[];
};

type Upcoming = Document & {
  carId: number;
  carLabel: string;
  daysLeft: number;
};

function diffInDays(dateString: string) {
  const target = new Date(dateString);
  const today = new Date();
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function UpcomingPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<Upcoming[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user || loading) {
      return;
    }
    setFetching(true);
    get("/api/cars/")
      .then((data) => {
        const cars: Car[] = data.results ?? data;
        const mapped: Upcoming[] = cars
          .flatMap((car) =>
            car.documents.map((doc) => ({
              ...doc,
              carId: car.id,
              carLabel: `${car.brand} ${car.model} (${car.plate})`,
              daysLeft: diffInDays(doc.expiry_date),
            })),
          )
          .filter((doc) => doc.daysLeft <= 30)
          .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
        setItems(mapped);
      })
      .finally(() => setFetching(false));
  }, [user, loading]);

  const breakdown = useMemo(() => {
    return items.reduce(
      (acc, doc) => {
        if (doc.status_indicator === "red") acc.red += 1;
        else if (doc.status_indicator === "yellow") acc.yellow += 1;
        else acc.green += 1;
        return acc;
      },
      { green: 0, yellow: 0, red: 0 },
    );
  }, [items]);

  if (loading) {
    return <LoadingState message={t("loading.loading")} />;
  }

  if (!user) {
    return <p className="text-neutral-400">{t("upcoming.signInNotice")}</p>;
  }

  if (fetching) {
    return <LoadingState message={t("loading.scanningDocuments")} />;
  }

  const statusLabels: Record<string, string> = {
    green: t("vehicleCard.statuses.green"),
    yellow: t("vehicleCard.statuses.yellow"),
    red: t("vehicleCard.statuses.red"),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gold">{t("upcoming.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            {t("upcoming.description")}
          </p>
        </div>
        <div className="flex gap-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
            {t("dashboard.stats.green")} {breakdown.green}
          </span>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-200">
            {t("dashboard.stats.yellow")} {breakdown.yellow}
          </span>
          <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-rose-200">
            {t("dashboard.stats.red")} {breakdown.red}
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title={t("upcoming.empty.title")}
          description={t("upcoming.empty.description")}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60">
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800 text-sm text-neutral-200">
            <thead className="bg-neutral-900/80 text-xs uppercase tracking-[0.3em] text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">{t("upcoming.table.vehicle")}</th>
                <th className="px-4 py-3 text-left">{t("upcoming.table.document")}</th>
                <th className="px-4 py-3 text-left">{t("upcoming.table.expiry")}</th>
                <th className="px-4 py-3 text-left">{t("upcoming.table.daysLeft")}</th>
                <th className="px-4 py-3 text-left">{t("upcoming.table.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {items.map((doc) => (
                <tr key={doc.id} className="hover:bg-neutral-900">
                  <td className="px-4 py-3 text-neutral-100">{doc.carLabel}</td>
                  <td className="px-4 py-3">
                    {(doc.type_display ?? doc.type) || doc.type}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(doc.expiry_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {doc.daysLeft < 0
                      ? t("common.words.expired")
                      : `${doc.daysLeft} ${
                          Math.abs(doc.daysLeft) === 1
                            ? t("common.words.day")
                            : t("common.words.days")
                        }`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                        doc.status_indicator === "red"
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                          : doc.status_indicator === "yellow"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      }`}
                    >
                      {statusLabels[doc.status_indicator] || doc.status_indicator}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
