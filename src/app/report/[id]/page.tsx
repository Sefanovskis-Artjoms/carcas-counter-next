import { getBatchByNumber } from "@/actions/batch-actions";
import HistoricView from "./view";

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
