import { z } from "zod";

// Validates the admin profile form. Pure so it can be unit tested.

export const SOCIALS = ["github", "linkedin", "email", "website"] as const;

const text = (max: number) => z.string().trim().max(max).transform((s) => s || null);
const empty = z.literal("").transform(() => null);
const webUrl = z.url({ protocol: /^https?$/ });

export function parseProfileForm(form: FormData, storagePrefix: string) {
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const file = z.union([empty, z.string().startsWith(storagePrefix, "Files must be uploaded here")]);
  return z
    .object({
      name: text(80),
      headline: text(160),
      avatar_url: file,
      cv_url: file,
      socials: z.object({
        github: z.union([empty, webUrl]),
        linkedin: z.union([empty, webUrl]),
        website: z.union([empty, webUrl]),
        email: z.union([empty, z.email()]),
      }),
    })
    .transform((p) => ({
      ...p,
      // keep only filled-in links so the site doesn't render empty buttons
      socials: Object.fromEntries(Object.entries(p.socials).filter(([, v]) => v)) as Record<string, string>,
    }))
    .safeParse({
      name: str("name"),
      headline: str("headline"),
      avatar_url: str("avatar_url"),
      cv_url: str("cv_url"),
      socials: Object.fromEntries(SOCIALS.map((k) => [k, str(k)])),
    });
}
