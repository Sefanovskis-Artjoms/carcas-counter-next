"use client";

import { CARCAS_PART_SELECT_OPTIONS } from "@/data/zone-display-names";
import { CONTAMINANT_KEYS } from "@/data/contaminants";
import { CarcasEntry } from "@/types/interfaces";
import { useMemo, useState } from "react";
import BatchTitle from "./_components/BatchTitle";
import Carcas from "@/components/Carcas/Carcas";
import Table from "@/components/Table/Table";
import { useAppBack } from "@/components/InternalNavigationTracker/InternalNavigationTracker";
import { useSearchParams } from "next/navigation";

export default function HistoricView({
  initialData,
}: {
  initialData: CarcasEntry[];
}) {
  const handleBack = useAppBack();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get("date") || "summary",
  );
  const [selectedPart, setSelectedPart] = useState<"upper" | "lower">("upper");
  const [highlightZone, setHighlightZone] = useState<number | null>(null);
  const [isCarcasVisible, setIsCarcasVisible] = useState(true);

  const uniqueDates = useMemo(() => {
    const allDates = initialData.map((entry) =>
      new Date(entry.date).toLocaleDateString("en-gb"),
    );
    return Array.from(new Set(allDates));
  }, [initialData]);

  const tableData = useMemo(() => {
    if (selectedDate !== "summary") {
      return initialData.filter(
        (entry) =>
          new Date(entry.date).toLocaleDateString("en-gb") === selectedDate,
      );
    }

    const aggregationMap = new Map<number, CarcasEntry>();

    initialData.forEach((entry) => {
      const existingEntry = aggregationMap.get(entry.zone_number);

      if (!existingEntry) {
        aggregationMap.set(entry.zone_number, { ...entry });
      } else {
        CONTAMINANT_KEYS.forEach((key) => {
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
    <div className="flex-1 grid grid-rows-[auto_1fr] max-h-screen w-full min-h-0">
      <div className="pb-[1.8rem]">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <BatchTitle />
            <button
              type="button"
              onClick={() => setIsCarcasVisible((visible) => !visible)}
              className="btn btn--color-neutral shrink-0"
            >
              {isCarcasVisible ? "Hide Carcas" : "Show Carcas"}
            </button>
          </div>
          <button
            onClick={handleBack}
            className="btn btn--color-neutral shrink-0"
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
      <div className="flex gap-7 flex-1 min-h-0">
        {isCarcasVisible && (
        <div className="flex flex-col gap-4 w-60 shrink-0 min-h-0">
          <div className="w-fit ml-auto mr-auto flex gap-4">
            {CARCAS_PART_SELECT_OPTIONS.map(({ value, label, title }) => (
              <button
                key={value}
                type="button"
                title={title}
                onClick={() => setSelectedPart(value)}
                className={`btn ${
                  selectedPart === value ? "btn--primary-light" : "btn--neutral"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center justify-center py-[1.8rem] min-h-0 min-w-0 self-stretch">
            <div className="w-full h-full min-h-0 min-w-0">
              <Carcas
                selectedCarcasPart={selectedPart}
                onZoneClick={handleZoneClick}
              />
            </div>
          </div>
        </div>
        )}

        <div className="flex-1 min-w-0">
          <Table
            data={tableData}
            selectedCarcasPart={selectedPart}
            highlightRow={highlightZone}
          />
        </div>
      </div>
    </div>
  );
}
