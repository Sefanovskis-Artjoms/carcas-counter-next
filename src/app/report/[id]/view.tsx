"use client";

import { CarcasEntry } from "@/types/interfaces";
import { useMemo, useState } from "react";
import BatchTitle from "./_components/BatchTitle";
import Carcas from "@/components/Carcas/Carcas";
import Table from "@/components/Table/Table";
import { useRouter, useSearchParams } from "next/navigation";

const COUNTER_KEYS = [
  "hair",
  "faceal",
  "grease_oil",
  "metal",
  "rail_dust",
  "soft_plastic",
  "hard_plastic",
  "blood_clots",
  "other",
  "lymph_nodes",
] as const;

export default function HistoricView({
  initialData,
}: {
  initialData: CarcasEntry[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get("date") || "summary"
  );
  const [highlightZone, setHighlightZone] = useState<number | null>(null);

  const uniqueDates = useMemo(() => {
    const allDates = initialData.map((entry) =>
      new Date(entry.date).toLocaleDateString("en-gb")
    );
    return Array.from(new Set(allDates));
  }, [initialData]);

  const tableData = useMemo(() => {
    if (selectedDate !== "summary") {
      return initialData.filter(
        (entry) =>
          new Date(entry.date).toLocaleDateString("en-gb") === selectedDate
      );
    }

    const aggregationMap = new Map<number, CarcasEntry>();

    initialData.forEach((entry) => {
      const existingEntry = aggregationMap.get(entry.zone_number);

      if (!existingEntry) {
        aggregationMap.set(entry.zone_number, { ...entry });
      } else {
        COUNTER_KEYS.forEach((key) => {
          (existingEntry[key] as number) += entry[key] as number;
        });
      }
    });
    return Array.from(aggregationMap.values());
  }, [initialData, selectedDate]);

  const handleZoneClick = (zoneNumber: number) => {
    setHighlightZone(zoneNumber);
    setTimeout(() => {
      setHighlightZone(null);
    }, 20);
  };

  return (
    <div className="flex-1 grid grid-rows-[auto_1fr]">
      <div className="pb-[3.2rem]">
        <div className="flex justify-between items-center mb-4">
          <BatchTitle />
          <button
            onClick={() => router.back()}
            className="btn btn--color-neutral"
          >
            Back
          </button>
        </div>
        {uniqueDates.length > 1 && (
          <div className="flex gap-[1.2rem] flex-wrap">
            <button
              className={`btn ${
                selectedDate === "summary" ? "btn--primary" : ""
              }`}
              onClick={() => setSelectedDate("summary")}
            >
              Summary
            </button>

            {uniqueDates.map((dateString) => (
              <button
                key={dateString}
                className={`btn ${
                  selectedDate === dateString ? "btn--primary" : ""
                }`}
                onClick={() => setSelectedDate(dateString)}
              >
                {dateString}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 grid grid-cols-[auto_1fr] gap-[5.8rem]">
        <div className="h-full m-auto pt-[4.8rem] pb-[3.2rem]">
          <Carcas onZoneClick={handleZoneClick} />
        </div>
        <Table data={tableData} highlightRow={highlightZone} />
      </div>
    </div>
  );
}
