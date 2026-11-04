// Mirrors supabase/schema.sql
export type Project = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  body: string | null;
  cover_url: string | null;
  gallery: string[];
  tech: string[];
  folder_id: string | null; // null = directly in Documents
  locked: boolean; // private: visitors only see title, tagline and cover
  repo_url: string | null;
  live_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  started_on: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: 1;
  name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cv_url: string | null;
  socials: Record<string, string>; // {"github": "https://...", "email": "me@x.com"}
};

export type Folder = {
  id: string;
  parent_id: string | null; // null = directly in Documents
  name: string;
  slug: string;
  color: string; // "#rrggbb"
  icon: string; // emblem name from ICON_NAMES, "" = none
  locked: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  folder_id: string | null;
  name: string; // e.g. "Aboutme.md"
  slug: string;
  body: string; // Markdown
  sort_order: number;
  created_at: string;
  updated_at: string;
};
