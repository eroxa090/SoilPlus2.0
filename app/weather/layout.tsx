import { titleFrom } from "@/lib/i18n/meta";
import { WEATHER } from "@/lib/i18n/pages/weather";

export const generateMetadata = titleFrom(WEATHER, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
