import "@/app/globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin layout is now just a passthrough
  // Individual routes handle their own shells
  return <>{children}</>;
}

