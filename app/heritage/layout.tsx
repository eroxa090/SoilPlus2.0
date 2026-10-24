import { titleFrom } from "@/lib/i18n/meta";
import { HERITAGE } from "@/lib/i18n/pages/heritage";

export const generateMetadata = titleFrom(HERITAGE, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
