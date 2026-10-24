import { titleFrom } from "@/lib/i18n/meta";
import { IRRIGATION } from "@/lib/i18n/pages/irrigation";

export const generateMetadata = titleFrom(IRRIGATION, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
