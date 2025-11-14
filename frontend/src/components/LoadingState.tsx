"use client";

import { useI18n } from "@/context/I18nContext";

export default function LoadingState({ message }: { message?: string }) {
  const { t } = useI18n();
  const text = message ?? t("loading.default");

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-neutral-400">
      <span className="h-12 w-12 animate-spin rounded-full border-2 border-neutral-700 border-t-gold" />
      <p className="text-sm uppercase tracking-[0.3em]">{text}</p>
    </div>
  );
}
