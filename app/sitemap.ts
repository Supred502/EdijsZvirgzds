import type { MetadataRoute } from "next";
import { getTree } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { allItems, hrefOf } from "@/lib/tree";

// Every page a visitor can open: Documents, folders, documents and (unlocked) projects
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tree = await getTree();
  const pages = allItems(tree).flatMap((i) => {
    const href = hrefOf(tree, i);
    return href ? [{ url: SITE_URL + href, lastModified: i.updated_at }] : [];
  });
  return [{ url: SITE_URL }, ...pages];
}
