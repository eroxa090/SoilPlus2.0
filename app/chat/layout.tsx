import { titleFrom } from "@/lib/i18n/meta";
import { CHAT } from "@/lib/i18n/pages/chat";

export const generateMetadata = titleFrom(CHAT, (t) => t.crumb);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
