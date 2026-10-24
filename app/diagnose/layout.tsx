import { titleFrom } from "@/lib/i18n/meta";
import { DIAGNOSE } from "@/lib/i18n/pages/diagnose";

export const generateMetadata = titleFrom(DIAGNOSE, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
