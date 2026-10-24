import { titleFrom } from "@/lib/i18n/meta";
import { PROFILE } from "@/lib/i18n/pages/profile";

export const generateMetadata = titleFrom(PROFILE, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
