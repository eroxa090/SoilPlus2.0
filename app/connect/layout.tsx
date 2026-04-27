import DeviceGate from "@/components/DeviceGate";

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeviceGate pathname="/connect">{children}</DeviceGate>;
}
