import { titleFrom } from "@/lib/i18n/meta";
import { AUTH } from "@/lib/i18n/pages/auth";

export const generateMetadata = titleFrom(AUTH, (t) => t.signupTitle);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
