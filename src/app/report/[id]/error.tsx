"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import BatchTitle from "./_components/BatchTitle";
import Carcas from "@/components/Carcas/Carcas";
import Table from "@/components/Table/Table";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDelaying, setIsDelaying] = useState(false);

  const handleRetry = () => {
    setIsDelaying(true);
    setTimeout(() => {
      startTransition(() => {
        reset();
        setIsDelaying(false);
      });
    }, 500);
  };

  const isLoading = isPending || isDelaying;

  return (
    <div className="flex-1 grid grid-rows-[auto_1fr]">
      <div className="pb-[3.2rem]">
        <div className="flex justify-between items-center mb-4">
          <BatchTitle />
          <div className="flex gap-4">
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="btn btn--highlight"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </button>
            <Link href="/history" className="btn btn--color-neutral">
              Back
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-[auto_1fr] gap-[5.8rem]">
        <div className="h-full m-auto pt-[4.8rem] pb-[3.2rem]">
          <Carcas isDisabled={true} />
        </div>
        <Table isDisabled={true} centeredMessage="Failed to load report data" />
      </div>
    </div>
  );
}
