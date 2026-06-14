import { Suspense } from "react";
import type { Metadata } from "next";
import Spinner from "@/components/Spinner/Spinner";
import HomeView from "./HomeView";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}): Promise<Metadata> {
  const { batch } = await searchParams;

  return {
    title: batch ? `Inspecting ${batch}` : "Carcas Counter",
  };
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Spinner size={60} />
        </div>
      }
    >
      <HomeView />
    </Suspense>
  );
}
