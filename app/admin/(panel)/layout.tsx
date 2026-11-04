import Link from "next/link";
import { signOut } from "../actions";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-surface-2">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="font-display font-bold">Admin</Link>
          <div className="flex items-center gap-2">
            <Link href="/admin/profile" className="btn">Profile</Link>
            <Link href="/" className="btn">View site</Link>
            <form action={signOut}>
              <button className="btn">Log out</button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
