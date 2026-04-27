import DeviceGate from "@/components/DeviceGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeviceGate pathname="/dashboard">{children}</DeviceGate>;
}
