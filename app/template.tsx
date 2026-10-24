/**
 * Remounts on every navigation, so each page settles onto the paper with a
 * short rise. Plain CSS: it also plays on the server-rendered first paint.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
