"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "../actions";

type Step = { kind: "loading" } | { kind: "setup"; factorId: string; qr: string; secret: string } | { kind: "verify"; factorId: string } | { kind: "error"; message: string };

// Runs in the browser: the Supabase browser client upgrades the session cookie to "aal2" after a correct code.
export default function TwoFactorPage() {
  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // dev mode runs effects twice; two enrolls would clash
    started.current = true;
    (async () => {
      const mfa = createClient().auth.mfa;
      const { data, error } = await mfa.listFactors();
      if (error) return setStep({ kind: "error", message: error.message });

      const verified = data.totp[0];
      if (verified) return setStep({ kind: "verify", factorId: verified.id });

      // First time: drop half-finished setups from earlier visits, then show a fresh QR code
      for (const f of data.all.filter((f) => f.status === "unverified")) await mfa.unenroll({ factorId: f.id });
      const res = await mfa.enroll({ factorType: "totp", friendlyName: "Authenticator app" });
      if (res.error) return setStep({ kind: "error", message: res.error.message });
      setStep({ kind: "setup", factorId: res.data.id, qr: res.data.totp.qr_code.trimEnd(), secret: res.data.totp.secret });
    })();
  }, []);

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (step.kind !== "setup" && step.kind !== "verify") return;
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: step.factorId, code });
    if (error) {
      setError("Wrong or expired code. Try the newest one from the app.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh(); // drop cached pages so the server re-checks the upgraded session
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-card bg-surface p-6">
        <h1 className="font-display text-2xl font-bold">Two-factor login</h1>

        {step.kind === "loading" && <p className="text-text-dim">Loading…</p>}
        {step.kind === "error" && <p role="alert" className="text-sm text-red-400">{step.message}</p>}

        {step.kind === "setup" && (
          <>
            <p className="text-sm text-text-dim">Scan this with Google Authenticator (tap <b>+</b> → <b>Scan a QR code</b>), then enter the 6-digit code it shows.</p>
            <Image src={step.qr} alt="QR code for your authenticator app" width={200} height={200} unoptimized className="self-center rounded-md bg-white p-2" />
            <details className="text-sm text-text-dim">
              <summary className="cursor-pointer">Can&apos;t scan? Enter this key instead</summary>
              <code className="mt-2 block break-all rounded-md bg-surface-2 p-2 text-text">{step.secret}</code>
            </details>
          </>
        )}
        {step.kind === "verify" && <p className="text-sm text-text-dim">Enter the 6-digit code from Google Authenticator.</p>}

        {(step.kind === "setup" || step.kind === "verify") && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              aria-label="6-digit code"
              placeholder="123456"
              className="input text-center font-mono text-2xl tracking-[0.4em]"
            />
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button disabled={busy || code.length !== 6} className="btn btn-primary">{busy ? "Checking…" : "Verify"}</button>
          </form>
        )}

        <form action={signOut}>
          <button className="text-sm text-text-dim hover:text-accent">Log out</button>
        </form>
      </div>
    </main>
  );
}
