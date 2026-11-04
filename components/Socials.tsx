// Renders the profile's socials map as buttons; "email" becomes a mailto link.
export function Socials({ socials }: { socials: Record<string, string> }) {
  const entries = Object.entries(socials).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return (
    <ul className="contents">
      {entries.map(([name, value]) => (
        <li key={name}>
          <a
            href={name === "email" ? `mailto:${value}` : value}
            target={name === "email" ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="btn btn-lg capitalize"
          >
            {name}
          </a>
        </li>
      ))}
    </ul>
  );
}
