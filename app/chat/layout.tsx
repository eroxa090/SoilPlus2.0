import DeviceGate from "@/components/DeviceGate";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeviceGate pathname="/chat">{children}</DeviceGate>;
}
