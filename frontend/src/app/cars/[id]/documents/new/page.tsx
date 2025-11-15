"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { get, postForm } from "@/lib/fetcher";

type CarSummary = {
  id: number;
  brand: string;
  model: string;
  plate: string;
};

const DOCUMENT_OPTIONS = [
  { value: "transit_license", labelKey: "documentForm.types.transitLicense" },
  { value: "SOAT", labelKey: "documentForm.types.soat" },
  { value: "Tecnomecanica", labelKey: "documentForm.types.technomechanical" },
  { value: "Insurance", labelKey: "documentForm.types.insurance" },
  { value: "Registration", labelKey: "documentForm.types.registration" },
];

export default function NewDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const carId = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [car, setCar] = useState<CarSummary | null>(null);
  const [fetchingCar, setFetchingCar] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isColombia = (user?.country || "co").toLowerCase() === "co";

  const defaultType = useMemo(
    () => (isColombia ? "transit_license" : "SOAT"),
    [isColombia],
  );

  const [form, setForm] = useState({
    type: defaultType,
    provider: "",
    issue_date: "",
    expiry_date: "",
    amount: "",
    notes: "",
  });
  const [extraDetails, setExtraDetails] = useState({
    owner: "",
    document_number: "",
    vin: "",
    service: "",
    details: "",
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, type: defaultType }));
  }, [defaultType]);

  useEffect(() => {
    if (!user || loading || !carId) {
      return;
    }
    setFetchingCar(true);
    get(`/api/cars/${carId}/`)
      .then((data) =>
        setCar({
          id: data.id,
          brand: data.brand,
          model: data.model,
          plate: data.plate,
        }),
      )
      .catch(() => setCar(null))
      .finally(() => setFetchingCar(false));
  }, [user, loading, carId]);

  if (loading || fetchingCar) {
    return <LoadingState message={t("loading.scanningDocuments")} />;
  }

  if (!user) {
    return (
      <EmptyState
        title={t("carDetail.signInNotice")}
        description=""
      />
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

  const licenseLocked = isColombia;
  const requiresFile = form.type === "transit_license";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requiresFile && !file) {
      setFormError(t("documentForm.errors.fileRequired"));
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("car", `${carId}`);
      payload.append("type", form.type);
      payload.append("provider", form.provider);
      payload.append("issue_date", form.issue_date);
      payload.append("expiry_date", form.expiry_date);
      payload.append("amount", form.amount || "0");
      const formattedExtras = Object.entries(extraDetails)
        .filter(([, value]) => value.trim().length > 0)
        .map(([key, value]) => {
          const labels: Record<string, string> = {
            owner: t("documentForm.manualFields.owner"),
            document_number: t("documentForm.manualFields.documentNumber"),
            vin: t("documentForm.manualFields.vin"),
            service: t("documentForm.manualFields.service"),
            details: t("documentForm.manualFields.extraNotes"),
          };
          return `${labels[key] ?? key}: ${value.trim()}`;
        })
        .join("\n");
      const finalNotes =
        [form.notes, formattedExtras].filter((segment) => segment && segment.trim()).join("\n") ||
        "";
      payload.append("notes", finalNotes);
      if (file) {
        payload.append("document_file", file);
      }
      await postForm("/api/documents/", payload);
      router.replace(`/cars/${carId}`);
    } catch (error) {
      const err = error as Error & { payload?: { detail?: string } };
      setFormError(err.payload?.detail || err.message || "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 px-8 py-10 shadow-glow">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {t("documentForm.title")}
          </p>
          <h1 className="text-3xl font-semibold text-gold">
            {car.brand} {car.model} ({car.plate})
          </h1>
          <p className="text-sm text-neutral-400">{t("documentForm.description")}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200">
            {t("documentForm.aiNote")}
          </p>
          {licenseLocked && (
            <p className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {t("documentForm.licenseHint")}
            </p>
          )}
        </div>
        <form className="mt-8 grid gap-6" onSubmit={onSubmit}>
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("documentForm.fields.file")}
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 px-6 py-10 text-center text-neutral-400 hover:border-gold hover:text-gold">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  if (selected && !showManualForm) {
                    setShowManualForm(true);
                  }
                }}
              />
              {file ? (
                <>
                  <span className="text-sm text-neutral-100">{file.name}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm text-neutral-200">
                    {t("documentForm.fileHelp")}
                  </span>
                  {requiresFile && !file && (
                    <span className="text-xs uppercase tracking-[0.3em] text-amber-200">
                      {t("documentForm.errors.fileRequired")}
                    </span>
                  )}
                </>
              )}
            </label>
          </div>

          {formError && (
            <p className="rounded-xl border border-rose-600/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
              {formError}
            </p>
          )}

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {t("documentForm.manualHint")}
            </p>
            <button
              type="button"
              onClick={() => setShowManualForm((prev) => !prev)}
              className="text-xs uppercase tracking-[0.3em] text-gold transition hover:text-neutral-100"
            >
              {showManualForm
                ? t("documentForm.buttons.hideManual")
                : t("documentForm.buttons.manualEntry")}
            </button>
          </div>

          {showManualForm && (
            <div className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5">
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  {t("documentForm.fields.type")}
                </label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, type: event.target.value }))
                  }
                  disabled={licenseLocked}
                  className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none disabled:opacity-60"
                >
                  {DOCUMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {t("documentForm.fields.provider")}
                  </label>
                  <input
                    value={form.provider}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, provider: event.target.value }))
                    }
                    placeholder={t("documentForm.placeholders.provider")}
                    className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {t("documentForm.fields.amount")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {t("documentForm.fields.issueDate")}
                  </label>
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, issue_date: event.target.value }))
                    }
                    className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {t("documentForm.fields.expiryDate")}
                  </label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, expiry_date: event.target.value }))
                    }
                    className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  {t("documentForm.fields.notes")}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder={t("documentForm.placeholders.notes")}
                  className="min-h-[120px] rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {t("documentForm.advancedHint")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="text-xs uppercase tracking-[0.3em] text-gold transition hover:text-neutral-100"
                  >
                    {showAdvanced
                      ? t("documentForm.buttons.hideAdvanced")
                      : t("documentForm.buttons.moreDetails")}
                  </button>
                </div>
                {showAdvanced && (
                  <div className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                    <div className="grid gap-2">
                      <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        {t("documentForm.manualFields.owner")}
                      </label>
                      <input
                        value={extraDetails.owner}
                        onChange={(event) =>
                          setExtraDetails((prev) => ({ ...prev, owner: event.target.value }))
                        }
                        className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        {t("documentForm.manualFields.documentNumber")}
                      </label>
                      <input
                        value={extraDetails.document_number}
                        onChange={(event) =>
                          setExtraDetails((prev) => ({
                            ...prev,
                            document_number: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                      <div className="grid gap-2">
                        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                          {t("documentForm.manualFields.vin")}
                        </label>
                        <input
                          value={extraDetails.vin}
                          onChange={(event) =>
                            setExtraDetails((prev) => ({ ...prev, vin: event.target.value }))
                          }
                          className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                          {t("documentForm.manualFields.service")}
                        </label>
                        <input
                          value={extraDetails.service}
                          onChange={(event) =>
                            setExtraDetails((prev) => ({
                              ...prev,
                              service: event.target.value,
                            }))
                          }
                          className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        {t("documentForm.manualFields.extraNotes")}
                      </label>
                      <textarea
                        value={extraDetails.details}
                        onChange={(event) =>
                          setExtraDetails((prev) => ({
                            ...prev,
                            details: event.target.value,
                          }))
                        }
                        className="min-h-[80px] rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full border border-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black disabled:opacity-60"
            >
              {isSubmitting ? t("documentForm.buttons.saving") : t("documentForm.buttons.submit")}
            </button>
            <Link
              href={`/cars/${carId}`}
              className="flex-1 rounded-full border border-neutral-700 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-neutral-200 transition hover:border-gold hover:text-gold"
            >
              {t("documentForm.buttons.back")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
