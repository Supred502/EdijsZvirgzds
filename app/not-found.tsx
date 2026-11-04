import Link from "next/link";
import { FolderIcon } from "@/components/FolderIcon";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <FolderIcon color="#ff4f9a" icon="" className="w-24 opacity-60" />
      <h1 className="font-display text-2xl font-bold">This folder doesn&apos;t exist</h1>
      <p className="text-text-dim">It may have been moved, renamed or deleted.</p>
      <Link href="/" className="btn btn-lg btn-primary">Go to Documents</Link>
    </main>
  );
}
