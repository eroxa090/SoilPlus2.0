import DeviceGate from "@/components/DeviceGate";

export default function IrrigationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeviceGate pathname="/irrigation">{children}</DeviceGate>;
}
