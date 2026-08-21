/**
 * The section-heading pattern used site-wide: an accent kicker, a display
 * title, and an optional one-line blurb. `as="h1"` makes it a page header.
 */
export default function SectionHeader({
  kicker,
  title,
  blurb,
  as: Tag = "h2",
}: {
  kicker: string;
  title: string;
  blurb?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent-dark">{kicker}</p>
      <Tag className="mt-1 font-display text-4xl font-semibold uppercase tracking-wide text-slate-900">
        {title}
      </Tag>
      {blurb && <p className="mt-2 text-slate-600">{blurb}</p>}
    </div>
  );
}
