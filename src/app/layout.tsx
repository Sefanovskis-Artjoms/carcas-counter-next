import InternalNavigationTracker from "@/components/InternalNavigationTracker/InternalNavigationTracker";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import "./globals.scss";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-[1.8rem]" suppressHydrationWarning={true}>
        <ReactQueryProvider>
          <InternalNavigationTracker />
          <Toaster richColors position="top-center" duration={5000} />
          <div className="main-container">{children}</div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
