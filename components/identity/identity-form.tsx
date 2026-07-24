"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { LoadingKang } from "@/components/ui/loading-kang";
import { COPY } from "@/lib/constants";

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
          className="w-full rounded-2xl border-2 border-navy-100 bg-navy-50/40 px-4 py-3 text-base text-navy-900 outline-none transition focus:border-teal-500 focus:bg-white"
        />
        {fieldError.fullName ? <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldError.fullName}</p> : null}
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
          className="w-full rounded-2xl border-2 border-navy-100 bg-navy-50/40 px-4 py-3 text-base text-navy-900 outline-none transition focus:border-teal-500 focus:bg-white"
        />
        <p className="mt-1.5 text-xs text-navy-400">{COPY.identity.nipHint}</p>
        {fieldError.nip ? <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldError.nip}</p> : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-navy-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-navy-300 text-teal-600 focus:ring-teal-500"
        />
        <span>{COPY.identity.consent}</span>
      </label>
      {fieldError.consent ? <p className="-mt-3 text-xs font-semibold text-red-600">{fieldError.consent}</p> : null}

      {submitError ? <ErrorBanner message={submitError} /> : null}

      <Button type="submit" fullWidth>
        {COPY.identity.submit}
      </Button>
    </form>
  );
}
