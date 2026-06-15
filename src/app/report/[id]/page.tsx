import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBatchByNumber } from "@/actions/batch-actions";
import Spinner from "@/components/Spinner/Spinner";
import HistoricView from "./view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Report for ${id}`,
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const response = await getBatchByNumber(id);

  if (!response.success) {
    throw new Error(response.error);
  }

  if (!response.data?.length) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Spinner size={60} />
        </div>
      }
    >
      <HistoricView initialData={response.data} />
    </Suspense>
  );
}
