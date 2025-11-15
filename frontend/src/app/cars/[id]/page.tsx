"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { del as delRequest, get, post } from "@/lib/fetcher";

type Document = {
  id: number;
  type: string;
  type_display?: string;
  issue_date: string;
  expiry_date: string;
  provider: string;
  amount: string;
  status_indicator: string;
  document_file?: string | null;
  ai_status?: string;
  ai_feedback?: string;
  is_license_valid?: boolean;
  license_validation_message?: string;
  external_payload?: Record<string, unknown> | null;
  external_status?: string | null;
  external_source?: string | null;
  external_fetched_at?: string | null;
  is_expired?: boolean;
};

type Credit = {
  id: number;
  bank: string;
  total_amount: string;
  monthly_payment: string;
  payment_day: number;
  remaining_balance: string;
  next_payment_date: string;
};

type Maintenance = {
  id: number;
  date: string;
  concept: string;
  cost: string;
  workshop: string;
  notes: string;
};

type CarDetail = {
  id: number;
  brand: string;
  model: string;
  plate: string;
  year: number;
  estimated_value?: string;
  status: string;
  health_status: string;
  documents: Document[];
  credits: Credit[];
  maintenances: Maintenance[];
};

type Notification = {
  id: number;
  message: string;
  send_date: string;
  notification_type: string;
  status: string;
  reference_object_id: number | null;
  reference_model?: string;
};

type SoatSnapshot = {
  document: Document | null;
  external: {
    status?: string;
    source?: string;
    fetched_at?: string | null;
    policy_number?: string | null;
    insurer?: string | null;
    issue_date?: string | null;
    expiry_date?: string | null;
    premium?: number | string | null;
    responsibilities?: string[];
    payload?: Record<string, unknown> | null;
  } | null;
  success?: boolean;
};

type TabKey =
  | "documents"
  | "soat"
  | "credits"
  | "maintenance"
  | "notifications"
  | "history";

const statusClasses: Record<string, string> = {
  red: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  yellow: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
};

const aiStatusClasses: Record<string, string> = {
  pending: "border-neutral-700 bg-neutral-900/40 text-neutral-200",
  processing: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  failed: "border-rose-500/40 bg-rose-500/10 text-rose-100",
};

export default function CarDetailPage() {
  const params = useParams();
  const carId = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
  const resolveFileUrl = (value?: string | null) => {
    if (!value) {
      return null;
    }
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    return `${apiBaseUrl}${value}`;
  };
  const [car, setCar] = useState<CarDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("documents");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docActionError, setDocActionError] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [actionsDoc, setActionsDoc] = useState<Document | null>(null);
  const [soatSnapshot, setSoatSnapshot] = useState<SoatSnapshot | null>(null);
  const [soatLoading, setSoatLoading] = useState(false);
  const [soatError, setSoatError] = useState<string | null>(null);
  const [refreshingSoat, setRefreshingSoat] = useState(false);

  const tabLabels: Record<TabKey, string> = {
    documents: t("carDetail.sections.documents"),
    soat: t("carDetail.sections.soat"),
    credits: t("carDetail.sections.credits"),
    maintenance: t("carDetail.sections.maintenance"),
    notifications: t("carDetail.sections.notifications"),
    history: t("carDetail.sections.history"),
  };

  const statusIndicatorLabels: Record<string, string> = {
    green: t("vehicleCard.statuses.green"),
    yellow: t("vehicleCard.statuses.yellow"),
    red: t("vehicleCard.statuses.red"),
  };

  const aiStatusLabels: Record<string, string> = {
    pending: t("documents.aiStatus.pending"),
    processing: t("documents.aiStatus.processing"),
    completed: t("documents.aiStatus.completed"),
    warning: t("documents.aiStatus.warning"),
    failed: t("documents.aiStatus.failed"),
  };

  const carStatusLabels: Record<string, string> = {
    active: t("common.statuses.car.active"),
    sold: t("common.statuses.car.sold"),
    inactive: t("common.statuses.car.inactive"),
  };

  const notificationTypeLabels: Record<string, string> = {
    email: t("common.statuses.notificationTypes.email"),
    whatsapp: t("common.statuses.notificationTypes.whatsapp"),
    sms: t("common.statuses.notificationTypes.sms"),
  };

  const notificationStatusLabels: Record<string, string> = {
    sent: t("common.statuses.alerts.sent"),
    failed: t("common.statuses.alerts.failed"),
    pending: t("common.statuses.alerts.pending"),
  };

  const formatCurrency = (value?: string | number | null) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    const numeric =
      typeof value === "number" ? value : Number.parseFloat(String(value));
    if (Number.isNaN(numeric)) {
      return String(value);
    }
    return numeric.toLocaleString();
  };

  const formatDateValue = (value?: string | null) => {
    if (!value) {
      return t("carDetail.soat.noDate");
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDocumentDate = (value?: string | null) => {
    if (!value) {
      return "—";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const soatDocument = soatSnapshot?.document || null;
  const soatExternal = soatSnapshot?.external || null;
  const soatResponsibilities =
    ((soatExternal?.responsibilities ?? []) as string[]).filter(Boolean);
  const soatStatusClass = (() => {
    const status = (soatExternal?.status || "").toLowerCase();
    if (status.includes("vigen")) {
      return statusClasses.green;
    }
    if (status.includes("expir") || status.includes("venc")) {
      return statusClasses.red;
    }
    return statusClasses.yellow;
  })();

  useEffect(() => {
    if (!user || loading || !carId) {
      return;
    }
    setFetching(true);
    setError(null);
    Promise.all([get(`/api/cars/${carId}/`), get("/api/notifications/")])
      .then(([carData, notificationsData]) => {
        setCar(carData);
        const records: Notification[] = notificationsData.results ?? notificationsData;
        setNotifications(records);
      })
      .catch((err: Error) => {
        setError(err.message || t("errors.loadCar"));
      })
      .finally(() => setFetching(false));
  }, [user, loading, carId, t]);

  useEffect(() => {
    if (activeTab !== "soat" || !carId) {
      return;
    }
    setSoatLoading(true);
    setSoatError(null);
    get(`/api/cars/${carId}/soat/`)
      .then((data) => {
        setSoatSnapshot(data);
      })
      .catch((err: Error & { status?: number; payload?: { message?: string } }) => {
        setSoatSnapshot(null);
        if (err.status === 404) {
          setSoatError(null);
          return;
        }
        setSoatError(err.payload?.message || err.message || t("errors.loadSoat"));
      })
      .finally(() => setSoatLoading(false));
  }, [activeTab, carId, t]);

  const carNotifications = useMemo(() => {
    if (!car) return [];
    const relatedIds = new Set<number>([
      car.id,
      ...car.documents.map((doc) => doc.id),
    ]);
    return notifications.filter((item) =>
      item.reference_object_id ? relatedIds.has(item.reference_object_id) : false,
    );
  }, [notifications, car]);

  const timeline = useMemo(() => {
    if (!car) return [];
    const expiresPrefix = t("carDetail.timeline.expiresPrefix");
    const events = [
      ...car.documents.map((doc) => ({
        id: `doc-${doc.id}`,
        label: doc.type_display ?? doc.type,
        date: doc.issue_date,
        detail: `${expiresPrefix} ${new Date(doc.expiry_date).toLocaleDateString()}`,
      })),
      ...car.maintenances.map((mt) => ({
        id: `mt-${mt.id}`,
        label: mt.concept,
        date: mt.date,
        detail: mt.notes || mt.workshop,
      })),
    ];
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [car, t]);

  const handleRefreshSoat = async () => {
    if (!carId) {
      return;
    }
    setRefreshingSoat(true);
    try {
      const data = await post(`/api/cars/${carId}/soat/`, {});
      setSoatSnapshot(data);
      setSoatError(null);
    } catch (error) {
      const err = error as Error & { status?: number; payload?: { message?: string } };
      if (err.status === 404) {
        setSoatSnapshot(null);
        setSoatError(null);
      } else {
        setSoatError(err.payload?.message || err.message || t("errors.loadSoat"));
      }
    } finally {
      setRefreshingSoat(false);
    }
  };

  const documentsWithWarnings = useMemo(
    () => car?.documents.filter((doc) => doc.ai_status === "warning") ?? [],
    [car],
  );

  const refreshCar = async () => {
    if (!carId) {
      return;
    }
    const updatedCar = await get(`/api/cars/${carId}/`);
    setCar(updatedCar);
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!carId) {
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(t("carDetail.documents.confirmDelete"))
    ) {
      return;
    }
    setDocActionError(null);
    setDeletingDocumentId(docId);
    try {
      await delRequest(`/api/documents/${docId}/`);
      await refreshCar();
    } catch (error) {
      const err = error as Error & { payload?: { detail?: string } };
      setDocActionError(
        err.payload?.detail || err.message || t("errors.documentDelete"),
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  if (loading || fetching) {
    return <LoadingState message={t("loading.loadingVehicle")} />;
  }

  if (!user) {
    return <p className="text-neutral-400">{t("carDetail.signInNotice")}</p>;
  }

  if (!carId) {
    return (
      <EmptyState
        title={t("carDetail.missingNotice.title")}
        description={t("carDetail.missingNotice.description")}
      />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-600/60 bg-rose-950/30 px-6 py-4 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  if (!car) {
    return (
      <EmptyState
        title={t("carDetail.notFound.title")}
        description={t("carDetail.notFound.description")}
      />
    );
  }

  const carStatusLabel = carStatusLabels[car.status] ?? car.status;
  const healthStatusLabel =
    statusIndicatorLabels[car.health_status] ?? car.health_status;

  return (
    <>
      <div className="space-y-8 px-3 pb-10 md:px-0">
      <div className="flex flex-col gap-6 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-glow lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("carDetail.vehicleCard.vehicleNumber")} {car.id}
          </p>
          <h1 className="text-4xl font-semibold text-gold">
            {car.brand} {car.model}
          </h1>
          <p className="text-sm uppercase tracking-[0.4em] text-neutral-400">
            {car.plate}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-neutral-400">
            <span className="rounded-full border border-neutral-700 px-3 py-1">
              {t("vehicleCard.labels.year")} {car.year}
            </span>
            <span className="rounded-full border border-neutral-700 px-3 py-1">
              {t("carDetail.vehicleCard.statusLabel")} {carStatusLabel}
            </span>
            <span
              className={`rounded-full border px-3 py-1 ${
                statusClasses[car.health_status] || statusClasses.green
              }`}
            >
              {healthStatusLabel}
            </span>
          </div>
        </div>
        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            {t("carDetail.vehicleCard.estimatedValue")}: $
            {Number.parseFloat(car.estimated_value ?? "0").toLocaleString()}
          </p>
          <Link
            href={`/cars/${car.id}/edit`}
            className="inline-flex items-center rounded-full border border-gold px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black"
          >
            {t("carDetail.vehicleCard.edit")}
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-full border border-neutral-800 bg-neutral-900/60 p-1 text-xs uppercase tracking-[0.3em] text-neutral-400">
        {(Object.keys(tabLabels) as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 transition ${
              activeTab === tab
                ? "bg-gold text-black"
                : "hover:text-gold"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === "documents" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-200">
              {t("carDetail.sections.documents")}
            </h2>
            <Link
              href={`/cars/${car.id}/documents/new`}
              className="rounded-full border border-gold px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black"
            >
              {t("carDetail.buttons.addDocument")}
            </Link>
          </div>
          {documentsWithWarnings.length > 0 && (
            <div className="rounded-2xl border border-amber-600/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
              <p className="font-semibold uppercase tracking-[0.3em]">
                {t("carDetail.documents.warningTitle")}
              </p>
              <p className="text-amber-50/90">
                {t("carDetail.documents.warningDescription")} · {documentsWithWarnings.length}{" "}
                {t("carDetail.documents.warningCountLabel")}
              </p>
            </div>
          )}
          {docActionError && (
            <div className="rounded-2xl border border-rose-600/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
              {docActionError}
            </div>
          )}
          {car.documents.length === 0 ? (
            <EmptyState
              title={t("carDetail.documents.emptyTitle")}
              description={t("carDetail.documents.emptyDescription")}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-800">
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-800 text-sm text-neutral-200">
                <thead className="bg-neutral-900/80 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      {t("carDetail.documents.columns.type")}
                    </th>
                    <th className="px-4 py-3 text-left">
                      {t("carDetail.documents.columns.provider")}
                    </th>
                    <th className="px-4 py-3 text-left">
                      {t("carDetail.documents.columns.issue")}
                    </th>
                    <th className="px-4 py-3 text-left">
                      {t("carDetail.documents.columns.expiry")}
                    </th>
                    <th className="px-4 py-3 text-left">
                      {t("carDetail.documents.columns.amount")}
                    </th>
                    <th className="px-4 py-3 text-left">
                      {t("carDetail.documents.columns.status")}
                    </th>
                    <th className="px-4 py-3 text-left">
                      {t("carDetail.documents.columns.validation")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {car.documents.map((doc) => {
                    const aiStatus = doc.ai_status ?? "pending";
                    const isValidLicense = Boolean(doc.is_license_valid);
                    const aiBadgeClass = isValidLicense
                      ? aiStatusClasses.completed
                      : aiStatusClasses[aiStatus] || aiStatusClasses.pending;
                    const aiLabel = isValidLicense
                      ? t("carDetail.documents.badges.valid")
                      : aiStatusLabels[aiStatus] || aiStatus;
                    const validationMessage =
                      doc.license_validation_message ||
                      doc.ai_feedback ||
                      (isValidLicense
                        ? t("carDetail.documents.validationMessages.valid")
                        : "");
                    const fileUrl = resolveFileUrl(doc.document_file);
                    return (
                      <tr
                        key={doc.id}
                        className="cursor-pointer hover:bg-neutral-900/70"
                        onClick={() => setActionsDoc(doc)}
                      >
                        <td className="px-4 py-3 text-neutral-100">
                          {(doc.type_display ?? doc.type) || doc.type}
                        </td>
                        <td className="px-4 py-3">{doc.provider || "—"}</td>
                        <td className="px-4 py-3">
                          {formatDocumentDate(doc.issue_date)}
                        </td>
                        <td className="px-4 py-3">
                          {formatDocumentDate(doc.expiry_date)}
                        </td>
                        <td className="px-4 py-3">
                          $
                          {Number.parseFloat(doc.amount || "0").toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                              statusClasses[doc.status_indicator] || statusClasses.green
                            }`}
                          >
                            {statusIndicatorLabels[doc.status_indicator] ||
                              doc.status_indicator}
                          </span>
                          {doc.is_expired && (
                            <p className="mt-1 text-xs font-bold uppercase text-rose-400">
                              {t("carDetail.documents.expiredBadge")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${aiBadgeClass}`}
                            >
                              {aiLabel}
                            </span>
                            {validationMessage && (
                              <p className="text-xs text-neutral-400">
                                {validationMessage}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "soat" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-200">
                {t("carDetail.soat.title")}
              </h2>
              <p className="text-sm text-neutral-400">
                {t("carDetail.soat.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefreshSoat}
              disabled={refreshingSoat || soatLoading}
              className="rounded-full border border-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black disabled:opacity-60"
            >
              {refreshingSoat
                ? t("carDetail.soat.refreshing")
                : t("carDetail.soat.refresh")}
            </button>
          </div>
          {soatLoading ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-6 py-10 text-center text-sm text-neutral-300">
              {t("carDetail.soat.loading")}
            </div>
          ) : soatError ? (
            <div className="rounded-2xl border border-rose-600/50 bg-rose-950/30 px-6 py-5 text-sm text-rose-100">
              <p className="font-semibold uppercase tracking-[0.3em]">
                {t("carDetail.soat.errorTitle")}
              </p>
              <p className="mt-1 text-rose-50/90">{soatError}</p>
            </div>
          ) : soatDocument ? (
            <div className="grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  {t("carDetail.soat.documentData")}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-gold">
                  {car.brand} {car.model} ({car.plate})
                </h3>
                <dl className="mt-4 space-y-2 text-sm text-neutral-300">
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.issueLabel")}</dt>
                    <dd>{formatDateValue(soatDocument.issue_date)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.expiryLabel")}</dt>
                    <dd>{formatDateValue(soatDocument.expiry_date)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.amountLabel")}</dt>
                    <dd>${formatCurrency(soatDocument.amount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.providerLabel")}</dt>
                    <dd>{soatDocument.provider || "—"}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  {t("carDetail.soat.statusLabel")}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                    statusClasses[soatDocument.status_indicator] ||
                    statusClasses.green
                  }`}
                >
                  {statusIndicatorLabels[soatDocument.status_indicator] ||
                    soatDocument.status_indicator}
                </span>
              </article>
              <article className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {t("carDetail.soat.officialData")}
                  </p>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${soatStatusClass}`}
                  >
                    {soatExternal?.status || t("carDetail.soat.statusUnknown")}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm text-neutral-300">
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.policyLabel")}</dt>
                    <dd>{soatExternal?.policy_number || "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.insurerLabel")}</dt>
                    <dd>{soatExternal?.insurer || soatDocument.provider || "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.issueLabel")}</dt>
                    <dd>
                      {formatDateValue(
                        soatExternal?.issue_date || soatDocument.issue_date,
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.expiryLabel")}</dt>
                    <dd>
                      {formatDateValue(
                        soatExternal?.expiry_date || soatDocument.expiry_date,
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("carDetail.soat.amountLabel")}</dt>
                    <dd>
                      $
                      {formatCurrency(
                        soatExternal?.premium ?? soatDocument.amount,
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {t("carDetail.soat.responsibilities")}
                  </p>
                  {soatResponsibilities.length > 0 ? (
                    <ul className="mt-2 space-y-2 text-sm text-neutral-300">
                      {soatResponsibilities.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-gold" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-400">
                      {t("carDetail.soat.noResponsibilities")}
                    </p>
                  )}
                </div>
                <div className="mt-4 text-xs text-neutral-500">
                  <p>
                    {t("carDetail.soat.providerSource")}:{" "}
                    {soatExternal?.source || t("carDetail.soat.statusUnknown")}
                  </p>
                  <p>
                    {t("carDetail.soat.lastSync")}:{" "}
                    {soatExternal?.fetched_at
                      ? new Date(soatExternal.fetched_at).toLocaleString()
                      : t("carDetail.soat.noSync")}
                  </p>
                </div>
              </article>
            </div>
          ) : (
            <EmptyState
              title={t("carDetail.soat.emptyTitle")}
              description={t("carDetail.soat.emptyDescription")}
            />
          )}
        </section>
      )}

      {activeTab === "credits" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-200">
              {t("carDetail.sections.credits")}
            </h2>
            <Link
              href={`/cars/${car.id}/credits/new`}
              className="rounded-full border border-gold px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black"
            >
              {t("carDetail.buttons.addCredit")}
            </Link>
          </div>
          {car.credits.length === 0 ? (
            <EmptyState
              title={t("carDetail.credits.emptyTitle")}
              description={t("carDetail.credits.emptyDescription")}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {car.credits.map((credit) => (
                <article
                  key={credit.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5"
                >
                  <h3 className="text-lg font-semibold text-gold">{credit.bank}</h3>
                  <div className="mt-3 space-y-2 text-sm text-neutral-300">
                    <p>
                      {t("carDetail.credits.totalAmount")}: $
                      {Number.parseFloat(credit.total_amount || "0").toLocaleString()}
                    </p>
                    <p>
                      {t("carDetail.credits.monthlyPayment")}: $
                      {Number.parseFloat(credit.monthly_payment || "0").toLocaleString()} -{" "}
                      {t("common.words.day")} {credit.payment_day}
                    </p>
                    <p>
                      {t("carDetail.credits.remainingBalance")}: $
                      {Number.parseFloat(credit.remaining_balance || "0").toLocaleString()}
                    </p>
                    <p>
                      {t("carDetail.credits.nextPayment")}:{" "}
                      {new Date(credit.next_payment_date).toLocaleDateString()}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "maintenance" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-200">
              {t("carDetail.sections.maintenanceLog")}
            </h2>
            <Link
              href={`/cars/${car.id}/maintenance/new`}
              className="rounded-full border border-gold px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black"
            >
              {t("carDetail.buttons.addMaintenance")}
            </Link>
          </div>
          {car.maintenances.length === 0 ? (
            <EmptyState
              title={t("carDetail.maintenance.emptyTitle")}
              description={t("carDetail.maintenance.emptyDescription")}
            />
          ) : (
            <div className="space-y-4">
              {car.maintenances.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5"
                >
                  <div className="flex items-center justify-between text-sm text-neutral-400">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span>
                      $
                      {Number.parseFloat(item.cost || "0").toLocaleString()} ·{" "}
                      {item.workshop || t("carDetail.maintenance.unknownWorkshop")}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-neutral-100">
                    {item.concept}
                  </h3>
                  {item.notes && <p className="mt-2 text-sm text-neutral-400">{item.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "notifications" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-200">
            {t("carDetail.sections.notifications")}
          </h2>
          {carNotifications.length === 0 ? (
            <EmptyState
              title={t("carDetail.notifications.emptyTitle")}
              description={t("carDetail.notifications.emptyDescription")}
            />
          ) : (
            <div className="space-y-3">
              {carNotifications.map((note) => (
                <article
                  key={note.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-500">
                    <span>
                      {notificationTypeLabels[note.notification_type] ?? note.notification_type}
                    </span>
                    <span>{new Date(note.send_date).toLocaleString()}</span>
                  </div>
                  <p className="mt-3 text-sm text-neutral-200">{note.message}</p>
                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                      note.status === "sent"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : note.status === "failed"
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    {notificationStatusLabels[note.status] ?? note.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "history" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-200">
            {t("carDetail.sections.timeline")}
          </h2>
          {timeline.length === 0 ? (
            <EmptyState
              title={t("carDetail.history.emptyTitle")}
              description={t("carDetail.history.emptyDescription")}
            />
          ) : (
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-gold" />
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                    <h3 className="text-sm font-semibold text-neutral-100">
                      {event.label}
                    </h3>
                    {event.detail && (
                      <p className="text-sm text-neutral-400">{event.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      </div>
      {actionsDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-neutral-700 bg-neutral-950/90 p-6 text-sm text-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {actionsDoc.type_display ?? actionsDoc.type}
              </h3>
              <button
                type="button"
                onClick={() => setActionsDoc(null)}
                className="text-xs uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-200"
              >
                {t("common.close")}
              </button>
            </div>
            <p className="text-xs text-neutral-400">{t("carDetail.documents.actions.description")}</p>
            <div className="flex flex-col gap-3">
              {actionsDoc.document_file ? (
                <a
                  href={resolveFileUrl(actionsDoc.document_file) || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-neutral-700 px-4 py-2 text-center text-xs uppercase tracking-[0.3em] text-neutral-200 transition hover:border-gold hover:text-gold"
                >
                  {t("carDetail.documents.actions.viewFile")}
                </a>
              ) : (
                <span className="text-neutral-500">
                  {t("carDetail.documents.actions.noFile")}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (actionsDoc) {
                    handleDeleteDocument(actionsDoc.id);
                    setActionsDoc(null);
                  }
                }}
                disabled={deletingDocumentId === actionsDoc.id}
                className="rounded-full border border-rose-600/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-rose-200 transition hover:border-rose-400 disabled:opacity-50"
              >
                {deletingDocumentId === actionsDoc.id
                  ? t("carDetail.documents.actions.deleting")
                  : t("carDetail.documents.actions.delete")}
              </button>
            </div>
              </table>
              </div>
            </div>
          )}
    </>
  );
}
