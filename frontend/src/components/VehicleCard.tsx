"use client";

import Link from "next/link";

import { useI18n } from "@/context/I18nContext";

const statusStyles: Record<string, string> = {
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  yellow: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  red: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

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

function nextDocument(documents: Document[]): Document | undefined {
  return [...documents].sort((a, b) =>
    new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime(),
  )[0];
}

export default function VehicleCard({ car }: { car: Car }) {
  const { t } = useI18n();
  const statusLabels: Record<string, string> = {
    green: t("vehicleCard.statuses.green"),
    yellow: t("vehicleCard.statuses.yellow"),
    red: t("vehicleCard.statuses.red"),
  };
  const indicator = statusStyles[car.health_status] || statusStyles.green;
  const label = statusLabels[car.health_status] || statusLabels.green;
  const document = nextDocument(car.documents);
  const carStatus =
    t(`common.statuses.car.${car.status}`) !== `common.statuses.car.${car.status}`
      ? t(`common.statuses.car.${car.status}`)
      : car.status;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-glow transition hover:border-gold/60 hover:shadow-[0_0_35px_rgba(212,175,55,0.25)]">
      <div className="border-b border-neutral-800 bg-neutral-900/80 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gold">
              {car.brand} {car.model}
            </h3>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
              {car.plate}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${indicator}`}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            {t("vehicleCard.labels.year")}
          </p>
          <p className="text-lg font-medium text-neutral-100">{car.year}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            {t("vehicleCard.labels.value")}
          </p>
          <p className="text-lg font-medium text-neutral-100">
            $
            {Number.parseFloat(car.estimated_value ?? "0").toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            {t("vehicleCard.labels.status")}
          </p>
          <p className="capitalize text-neutral-100">{carStatus}</p>
        </div>
        {document ? (
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              {t("vehicleCard.labels.nextDocument")}
            </p>
            <p className="text-neutral-100">
              {(document.type_display ?? document.type) || document.type} ·{" "}
              {new Date(document.expiry_date).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              {t("vehicleCard.labels.documents")}
            </p>
            <p className="text-neutral-500">{t("vehicleCard.labels.noDocuments")}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-900/60 px-6 py-4 text-sm text-neutral-300">
        <span className="uppercase tracking-[0.3em] text-neutral-500">
          {t("vehicleCard.labels.vehicle")} {car.id}
        </span>
        <Link
          href={`/cars/${car.id}`}
          className="rounded-full border border-gold px-4 py-1 text-xs font-semibold uppercase tracking-widest text-gold transition hover:bg-gold hover:text-black"
        >
          {t("vehicleCard.actions.details")}
        </Link>
      </div>
    </article>
  );
}
