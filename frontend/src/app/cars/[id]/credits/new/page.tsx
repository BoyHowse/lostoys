"use client";

import { useI18n } from "@/context/I18nContext";

export default function NewCreditPlaceholder() {
  const { t } = useI18n();

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 px-8 py-12 text-center text-neutral-300">
      {t("placeholders.credits")}
    </div>
  );
}
