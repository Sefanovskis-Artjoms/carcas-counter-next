import type { Metadata } from "next";
import { getBatchByNumber } from "@/actions/batch-actions";
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

  return <HistoricView initialData={response.data || []} />;
}
