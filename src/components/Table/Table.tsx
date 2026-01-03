"use client";

import { CarcasEntry } from "@/types/interfaces";
import styles from "./Table.module.scss";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon/Icon";
import Spinner from "../Spinner/Spinner";

const COUNTER_COLUMNS = [
  { key: "hair", displayName: "Hair", iconKey: "hair" },
  { key: "faceal", displayName: "Faceal", iconKey: "faceal" },
  { key: "grease_oil", displayName: "Grease/Oil", iconKey: "grease-oil" },
  { key: "metal", displayName: "Metal", iconKey: "metal" },
  { key: "rail_dust", displayName: "Rail Dust", iconKey: "rail-dust" },
  { key: "soft_plastic", displayName: "Soft Plastic", iconKey: "soft-plastic" },
  { key: "hard_plastic", displayName: "Hard Plastic", iconKey: "hard-plastic" },
  { key: "blood_clots", displayName: "Blood Clots", iconKey: "blood-clots" },
  { key: "other", displayName: "Other", iconKey: "other" },
  { key: "lymph_nodes", displayName: "Lymph Nodes", iconKey: "lymph-nodes" },
] as const;

const ZONE_NAMES: Record<number, string> = {
  1: "A - Chuck",
  2: "B - Brisket",
  3: "C - Rib",
  4: "D - Plate",
  5: "E - Loin 2/2",
  6: "F - Loin 1/2",
  7: "G - Flank",
  8: "H - Round",
};

const HIGHLIGHT_DURATION = 500;

export default function Table({
  data = [],
  selectedCarcasPart = "whole",
  isReadOnly = true,
  isLoading = false,
  increaseMode = true,
  updateAmount = 1,
  onValueUpdate,
  highlightRow = null,
  isDisabled = false,
  centeredMessage,
}: {
  data?: CarcasEntry[];
  selectedCarcasPart?: "upper" | "lower" | "whole";
  isReadOnly?: boolean;
  isLoading?: boolean;
  increaseMode?: boolean;
  updateAmount?: number;
  onValueUpdate?: (args: {
    id: number;
    counter_name: string;
    increment: boolean;
    amount: number;
  }) => void;
  highlightRow?: number | null;
  isDisabled?: boolean;
  centeredMessage?: string;
}) {
  const [highlightedIds, setHighlightedIds] = useState<number[]>([]);
  const timersMap = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const normalizedData = useMemo(() => {
    let processedData = [...data];

    if (processedData.length === 0) {
      processedData = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        date: new Date().toISOString(),
        batch_number: "N/A",
        zone_number: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        hair: 0,
        faceal: 0,
        grease_oil: 0,
        metal: 0,
        rail_dust: 0,
        soft_plastic: 0,
        hard_plastic: 0,
        blood_clots: 0,
        other: 0,
        lymph_nodes: 0,
      }));
    }

    if (selectedCarcasPart === "upper") {
      processedData = processedData.filter((c) => c.zone_number <= 4);
    } else if (selectedCarcasPart === "lower") {
      processedData = processedData.filter((c) => c.zone_number >= 5);
    }

    return processedData.sort((a, b) => a.zone_number - b.zone_number);
  }, [data, selectedCarcasPart]);

  useEffect(() => {
    if (highlightRow === null) return;

    const entry = normalizedData.find((c) => c.zone_number === highlightRow);
    if (!entry) return;

    if (timersMap.current.has(entry.id)) {
      clearTimeout(timersMap.current.get(entry.id));
    }

    requestAnimationFrame(() => {
      setHighlightedIds((prev) => {
        if (prev.includes(entry.id)) return prev;
        return [...prev, entry.id];
      });
    });

    const newTimerId = setTimeout(() => {
      setHighlightedIds((prev) => prev.filter((id) => id !== entry.id));
      timersMap.current.delete(entry.id);
    }, HIGHLIGHT_DURATION);

    timersMap.current.set(entry.id, newTimerId);
  }, [highlightRow, normalizedData]);

  // Nosakām, vai saturs ir jāpadara blāvs un neaktīvs.
  // Tas notiek, ja ir isDisabled VAI notiek ielāde.
  const contentOpacityClass =
    isDisabled || isLoading ? "opacity-50 pointer-events-none" : "";

  return (
    <div
      className={`
        ${styles.container}
        w-full h-full relative gap-x-[0.6rem] gap-y-[0.4rem]
        ${selectedCarcasPart !== "whole" ? styles.halfTable : ""}
      `}
      style={{
        gridTemplateRows: `max-content repeat(${COUNTER_COLUMNS.length}, 1fr)`,
      }}
    >
      <div
        className={`flex w-full h-full items-center justify-center text-[2rem] text-text-regular ${contentOpacityClass}`}
      ></div>

      {normalizedData.map((entry) => (
        <div
          key={entry.id}
          className={`flex w-full h-full items-center justify-center text-[2rem] text-text-regular ${contentOpacityClass}`}
        >
          {ZONE_NAMES[entry.zone_number]}
        </div>
      ))}

      {COUNTER_COLUMNS.map((col) => (
        <Fragment key={col.key}>
          <div
            className={`flex w-full h-full items-center justify-center ${contentOpacityClass}`}
          >
            <div className="w-max flex items-center justify-start gap-[0.8rem] pr-[0.6rem] text-[2rem] text-text-regular">
              <Icon
                name={col.iconKey}
                className={`${styles.icon} ${styles[col.iconKey]}`}
              />
              <span>{col.displayName}</span>
            </div>
          </div>

          {normalizedData.map((entry) => {
            const value = entry[col.key as keyof CarcasEntry] as number;
            const isHighlighted = highlightedIds.includes(entry.id);

            return (
              <div
                key={`${entry.id}-${col.key}`}
                className={`flex w-full h-full items-center justify-center ${contentOpacityClass}`}
              >
                <button
                  key={increaseMode.toString()}
                  className={`
                    ${styles.btn}
                    relative w-full h-full flex items-center justify-center
                    text-[2rem] font-medium rounded-[0.3rem] border border-border
                    ${!increaseMode ? styles.decrease : ""} 
                    ${isReadOnly ? styles.readonly : ""}
                    ${isHighlighted ? styles.highlighted : ""}
                  `}
                  onClick={() => {
                    if (isReadOnly || isLoading || !onValueUpdate) return;

                    onValueUpdate({
                      id: entry.id,
                      counter_name: col.key,
                      increment: increaseMode,
                      amount: updateAmount,
                    });
                  }}
                  disabled={isReadOnly || isLoading}
                >
                  {!isReadOnly && (
                    <div className="absolute top-[0.4rem] right-[0.4rem] text-[1.3rem] font-semibold pointer-events-none">
                      {increaseMode ? "+" : "-"}
                      {updateAmount}
                    </div>
                  )}
                  {value}
                </button>
              </div>
            );
          })}
        </Fragment>
      ))}

      {(isLoading || centeredMessage) && (
        <div
          className="absolute z-20 flex items-center justify-center w-full h-full pointer-events-none"
          style={{ gridColumn: "2 / -1", gridRow: "2 / -1" }}
        >
          {isLoading ? (
            <Spinner size={250} />
          ) : (
            <span className="text-8xl font-medium text-text-disabled bg-background/80 px-8 py-4 rounded-(--border-radius-regular) shadow-lg">
              {centeredMessage}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
