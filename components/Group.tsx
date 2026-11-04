// A titled group of items, like the headers in a file manager's icon view
export function Group({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id && `${id}-title`} className="scroll-mt-20 py-6">
      <h2 id={id && `${id}-title`} className="mb-3 flex items-center gap-3 text-sm text-text-dim">
        {title}
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </h2>
      {children}
    </section>
  );
}
