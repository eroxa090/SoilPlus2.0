import { titleFrom } from "@/lib/i18n/meta";
import { SHOP } from "@/lib/i18n/pages/shop";

export const generateMetadata = titleFrom(SHOP, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
