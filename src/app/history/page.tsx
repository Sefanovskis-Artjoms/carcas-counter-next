import { Suspense } from "react";
import Spinner from "@/components/Spinner/Spinner";
import HistoryView from "./HistoryView";
import { getAllHistoryItems } from "@/actions/batch-actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "History | Mans Projekts",
};

export default async function HistoryPage() {
  let initialData;

  try {
    const response = await getAllHistoryItems();
    if (response?.success) initialData = response.data;
  } catch (error) {
    console.error("Failed to fetch initial history data:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Spinner size={60} />
        </div>
      }
    >
      <HistoryView initialData={initialData} />
    </Suspense>
  );
}
