"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { get, post } from "@/lib/fetcher";

type VerifyStatus = "loading" | "success" | "invalid" | "expired" | "error";

export default function VerifyPage() {
  const params = useParams<{ token: string }>();
  const tokenValue = params?.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue || "";
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    setStatus("loading");
    get(`/api/accounts/verify/${token}/`)
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setStatus("success");
        setMessage(data?.message || "Cuenta verificada correctamente.");
      })
      .catch((error: Error & { payload?: { error?: string } }) => {
        if (!isMounted) {
          return;
        }
        const serverMessage = error.payload?.error || error.message || "No pudimos verificar el enlace.";
        if (serverMessage.toLowerCase().includes("inválido")) {
          setStatus("invalid");
        } else if (serverMessage.toLowerCase().includes("expir")) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
        setMessage(serverMessage);
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const resendEmail = async () => {
    setResending(true);
    try {
      const response = await post("/api/accounts/email/verify/resend/", {});
      setToast({
        type: "success",
        message: response?.message || "Correo reenviado",
      });
    } catch (error) {
      const err = error as Error & { payload?: { message?: string; error?: string } };
      setToast({
        type: "error",
        message: err.payload?.message || err.payload?.error || err.message || "No se pudo reenviar el correo",
      });
    } finally {
      setResending(false);
    }
  };

  const cardStyles = useMemo(() => {
    if (status === "success") {
      return "border-emerald-500/60 bg-emerald-900/20 text-emerald-100";
    }
    if (status === "invalid") {
      return "border-rose-500/60 bg-rose-950/30 text-rose-100";
    }
    if (status === "expired") {
      return "border-amber-500/60 bg-amber-900/30 text-amber-100";
    }
    if (status === "error") {
      return "border-neutral-600 bg-neutral-900/40 text-neutral-100";
    }
    return "border-neutral-800 bg-neutral-950/40 text-neutral-100";
  }, [status]);

  const showResendButton = status === "invalid" || status === "expired" || status === "error";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-neutral-950 to-black px-4 py-16 text-white">
      {toast && (
        <div
          className={`fixed top-6 right-6 rounded-2xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-500/50 bg-emerald-900/40 text-emerald-100"
              : "border-rose-500/50 bg-rose-950/40 text-rose-100"
          }`}
        >
          {toast.message}
        </div>
      )}
      <div
        className={`w-full max-w-lg space-y-6 rounded-3xl border ${cardStyles} p-10 text-center shadow-[0_25px_120px_rgba(0,0,0,0.7)]`}
      >
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Verificación</p>
          <h1 className="text-3xl font-semibold">
            {status === "success"
              ? "Cuenta verificada"
              : status === "invalid"
                ? "Enlace no válido"
                : status === "expired"
                  ? "Enlace expirado"
                  : status === "error"
                    ? "Ups, algo falló"
                    : "Verificando"}
          </h1>
          <p className="text-sm text-neutral-300">{message || "Validando el enlace..."}</p>
        </div>

        {status === "loading" && (
          <div className="flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        )}

        {status === "success" && (
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full border border-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black"
          >
            Ir al login
          </Link>
        )}

        {showResendButton && (
          <button
            type="button"
            disabled={resending}
            onClick={resendEmail}
            className="inline-flex w-full items-center justify-center rounded-full border border-neutral-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-neutral-100 transition hover:border-gold hover:text-gold disabled:opacity-50"
          >
            {resending ? "Enviando..." : "Reenviar correo"}
          </button>
        )}
      </div>
    </div>
  );
}
