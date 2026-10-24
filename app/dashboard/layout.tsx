import DeviceGate from "@/components/DeviceGate";
import { titleFrom } from "@/lib/i18n/meta";
import { DASHBOARD } from "@/lib/i18n/pages/dashboard";

export const generateMetadata = titleFrom(DASHBOARD, (t) => t.crumb);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeviceGate pathname="/dashboard">{children}</DeviceGate>;
}
