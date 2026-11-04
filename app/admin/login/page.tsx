"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <form action={action} className="flex w-full max-w-sm flex-col gap-4 rounded-card bg-surface p-6">
        <h1 className="font-display text-2xl font-bold">Admin login</h1>
        <label className="field">
          Email
          <input name="email" type="email" autoComplete="email" required className="input" />
        </label>
        <label className="field">
          Password
          <input name="password" type="password" autoComplete="current-password" required className="input" />
        </label>
        {state?.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
        <button disabled={pending} className="btn btn-primary">{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
