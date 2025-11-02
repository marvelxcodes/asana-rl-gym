import Providers from "@/components/providers";

export default function AsanaGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No Header - pure Asana UI only
  return <Providers>{children}</Providers>;
}
