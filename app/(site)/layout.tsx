import { Suspense } from "react";
import { InfoPanel, type Me, PathBar, Places, StatusBar } from "@/components/Explorer";
import { getProfile, getTree } from "@/lib/data";

// Public site = one file-manager window: Places | path bar, page, status bar | info panel
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [profile, tree] = await Promise.all([getProfile(), getTree()]);
  const me: Me = { name: profile?.name ?? "Edijs Zvirgzds", avatar: profile?.avatar_url ?? null };

  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 overflow-y-auto border-r border-line md:block">
        <Suspense fallback={null}>
          <Places tree={tree} me={me} />
        </Suspense>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-[53px] border-b border-line" />}>
          <PathBar tree={tree} me={me} />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={<div className="h-8 border-t border-line" />}>
          <StatusBar tree={tree} me={me} />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <InfoPanel tree={tree} />
      </Suspense>
    </div>
  );
}
