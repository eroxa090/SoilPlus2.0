import { titleFrom } from "@/lib/i18n/meta";
import { FORECAST } from "@/lib/i18n/pages/forecast";

export const generateMetadata = titleFrom(FORECAST, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
