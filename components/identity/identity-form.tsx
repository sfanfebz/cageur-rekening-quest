"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { LoadingKang } from "@/components/ui/loading-kang";
import { COPY } from "@/lib/constants";
import { primeBgmAudio } from "@/lib/bgm-engine";

const ONLY_DIGITS = /^\d+$/;

export function IdentityForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [nip, setNip] = useState("");
  const [consent, setConsent] = useState(false);
  const [fieldError, setFieldError] = useState<{ fullName?: string; nip?: string; consent?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validateClientSide(): boolean {
    const errors: typeof fieldError = {};
    const trimmedName = fullName.trim().replace(/\s+/g, " ");
    const onlyDigitsName = ONLY_DIGITS.test(trimmedName.replace(/\s+/g, ""));
    const onlySymbols = /^[^a-zA-Z]*$/.test(trimmedName);
    if (trimmedName.length < 3 || onlyDigitsName || onlySymbols) {
      errors.fullName = COPY.identity.nameError;
    }
    if (!nip.trim() || !ONLY_DIGITS.test(nip.trim())) {
      errors.nip = COPY.identity.nipError;
    }
    if (!consent) {
      errors.consent = COPY.identity.consentError;
    }
    setFieldError(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Interaksi pertama yang dijamin terjadi di seluruh aplikasi -- buka
    // gerbang autoplay audio di sini, sinkron di dalam gesture klik, supaya
    // AudioContext sudah "running" jauh sebelum Game Hub sempat mount.
    primeBgmAudio();
    setSubmitError(null);
    if (!validateClientSide()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, nip, consent }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        setSubmitError(body.message || COPY.errors.validation);
        setSubmitting(false);
        return;
      }
      router.push("/hub");
      router.refresh();
    } catch {
      setSubmitError(COPY.errors.saveFailed);
      setSubmitting(false);
    }
  }

  if (submitting) {
    return <LoadingKang message={COPY.identity.loading} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-bold text-navy-700">
          Nama Lengkap
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder={COPY.identity.namePlaceholder}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-navy-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
        />
        {fieldError.fullName ? <p className="mt-1.5 text-xs font-semibold text-red-500">{fieldError.fullName}</p> : null}
      </div>

      <div>
        <label htmlFor="nip" className="mb-1.5 block text-sm font-bold text-navy-700">
          NIP
        </label>
        <input
          id="nip"
          name="nip"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={COPY.identity.nipPlaceholder}
          value={nip}
          onChange={(e) => setNip(e.target.value.replace(/[^\d]/g, ""))}
          className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-navy-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
        />
        <p className="mt-1.5 text-xs text-gray-500">{COPY.identity.nipHint}</p>
        {fieldError.nip ? <p className="mt-1.5 text-xs font-semibold text-red-500">{fieldError.nip}</p> : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-navy-900">
        <span
          onClick={() => setConsent((prev) => !prev)}
          className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 text-white transition ${
            consent ? "border-teal-500 bg-teal-500" : "border-gray-200 bg-white"
          }`}
        >
          {consent ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L19 7" />
            </svg>
          ) : null}
        </span>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="sr-only" />
        <span>{COPY.identity.consent}</span>
      </label>
      {fieldError.consent ? <p className="-mt-3 text-xs font-semibold text-red-500">{fieldError.consent}</p> : null}

      {submitError ? <ErrorBanner message={submitError} /> : null}

      <Button type="submit" fullWidth>
        {COPY.identity.submit}
      </Button>
    </form>
  );
}
