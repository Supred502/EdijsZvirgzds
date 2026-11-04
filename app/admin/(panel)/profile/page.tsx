import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { ProfileForm } from "./ProfileForm";

async function EditProfile() {
  const supabase = await requireUser();
  const { data, error } = await supabase.from("profile").select("*").eq("id", 1).single();
  if (error) throw error;
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">Profile</h1>
      <ProfileForm profile={data as Profile} />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-text-dim">Loading…</p>}>
      <EditProfile />
    </Suspense>
  );
}
