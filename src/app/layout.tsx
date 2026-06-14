import InternalNavigationTracker from "@/components/InternalNavigationTracker/InternalNavigationTracker";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.scss";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Carcas Counter",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-[1.8rem]" suppressHydrationWarning={true}>
        <ReactQueryProvider>
          <Suspense fallback={null}>
            <InternalNavigationTracker />
          </Suspense>
          <Toaster richColors position="top-center" duration={5000} />
          <div className="main-container">{children}</div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
