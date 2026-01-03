import { Suspense } from "react";
import Spinner from "@/components/Spinner/Spinner";
import HomeView from "./HomeView";

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
