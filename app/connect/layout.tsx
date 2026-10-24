import { titleFrom } from "@/lib/i18n/meta";
import { CONNECT } from "@/lib/i18n/pages/connect";

export const generateMetadata = titleFrom(CONNECT, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
