"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { get } from "@/lib/fetcher";

type Notification = {
  id: number;
  notification_type: string;
  message: string;
  send_date: string;
  status: string;
  reference_model?: string;
  reference_object_id?: number | null;
};

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || loading) return;
    setFetching(true);
    get("/api/notifications/")
      .then((data) => {
        setItems(data.results ?? data);
        setError(null);
      })
      .catch((err: Error & { payload?: { detail?: string } }) => {
        setError(err.payload?.detail || err.message || t("notificationsPage.error"));
      })
      .finally(() => setFetching(false));
  }, [user, loading, t]);

  if (loading) {
    return <LoadingState message={t("notificationsPage.loading")} />;
  }

  if (!user) {
    return (
      <EmptyState
        title={t("notificationsPage.signInTitle")}
        description={t("notificationsPage.signInDescription")}
      />
    );
  }

  if (fetching) {
    return <LoadingState message={t("notificationsPage.loading")} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-gold">{t("notificationsPage.title")}</h1>
        <p className="text-sm text-neutral-400">{t("notificationsPage.subtitle")}</p>
      </div>
      {error && (
        <div className="rounded-2xl border border-rose-600/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          title={t("notificationsPage.emptyTitle")}
          description={t("notificationsPage.emptyDescription")}
        />
      ) : (
        <div className="space-y-3">
          {items.map((note) => (
            <article
              key={note.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-glow"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-500">
                <span>{note.notification_type}</span>
                <span>{new Date(note.send_date).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm text-neutral-100">{note.message}</p>
              <span
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                  note.status === "sent"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : note.status === "failed"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                }`}
              >
                {note.status}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
