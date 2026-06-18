"use client";

import {
  CONTAMINANT_COLUMNS,
  createEmptyContaminantCounts,
} from "@/data/contaminants";
import { CarcasZoneNumber, getZonesForPart } from "@/data/carcas-zone-data";
import { CarcasEntry } from "@/types/interfaces";
import { getZoneDisplayLabel } from "@/data/zone-display-names";
import styles from "./Table.module.scss";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon/Icon";
import Spinner from "../Spinner/Spinner";

const HIGHLIGHT_DURATION = 500;

/**
 * Contaminant grid: zones as columns, contaminant types as rows.
 *
 * Two non-obvious bits:
 *  - Placeholder rows: the selected FQ/HQ part always renders every zone, even
 *    ones missing from `data` (e.g. older batches saved before a zone existed).
 *    Missing zones get a synthetic entry with a negative `id` (`-zoneNumber`) so
 *    React keys stay unique; these cells render read-only and never call back to
 *    the server (you can't increment a row that has no DB record).
 *  - Highlight timers: clicking a carcass zone briefly flashes its column. Each
 *    flash is tracked per row id in `timersMap` so rapid repeated clicks on the
 *    same zone reset cleanly instead of leaving stale timeouts running.
 */

// MARK: Props

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
  selectedCarcasPart?: "fq" | "hq" | "whole";
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
  // MARK: State & refs

  const [highlightedIds, setHighlightedIds] = useState<number[]>([]);
  const timersMap = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // MARK: Derived values

  const activeZoneNumbers = useMemo(
    () => getZonesForPart(selectedCarcasPart),
    [selectedCarcasPart],
  );

  const normalizedData = useMemo(() => {
    const dataByZone = new Map(data.map((entry) => [entry.zone_number, entry]));
    const batchNumber = data[0]?.batch_number ?? "N/A";
    const batchDate = data[0]?.date ?? new Date().toISOString();

    return activeZoneNumbers.map((zoneNumber) => {
      const existing = dataByZone.get(zoneNumber as CarcasZoneNumber);
      if (existing) return existing;

      // Placeholder for zones not yet in DB (e.g. legacy 8-zone batches)
      return {
        id: -zoneNumber,
        date: batchDate,
        batch_number: batchNumber,
        zone_number: zoneNumber as CarcasZoneNumber,
        ...createEmptyContaminantCounts(),
      };
    });
  }, [data, activeZoneNumbers]);

  // MARK: Effects

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

  const contentOpacityClass =
    isDisabled || isLoading ? "opacity-50 pointer-events-none" : "";
  const isWholeMode = selectedCarcasPart === "whole";

  // MARK: HTML

  return (
    <div
      className={`${styles.container} ${isWholeMode ? styles.wholeMode : ""} w-full h-full relative gap-x-[0.6rem] gap-y-[0.4rem]`}
      style={{
        gridTemplateColumns: `var(--contaminant-col-width) repeat(${normalizedData.length}, minmax(0, 1fr))`,
        gridTemplateRows: `max-content repeat(${CONTAMINANT_COLUMNS.length}, 1fr)`,
      }}
    >
      {/* MARK: Top-left corner cell */}
      <div
        className={`flex w-full h-full items-center justify-center text-[2rem] text-text-regular ${contentOpacityClass}`}
      ></div>

      {/* MARK: Zone headers */}
      {normalizedData.map((entry, zoneIndex) => (
        <div
          key={entry.id}
          className={`
            ${styles.zoneHeader} flex w-full h-full items-center justify-center text-text-regular text-center
            ${zoneIndex % 2 === 1 ? styles.altColumn : ""}
            ${contentOpacityClass}
          `}
        >
          {getZoneDisplayLabel(entry.zone_number)}
        </div>
      ))}

      {/* MARK: Contaminant rows & cells */}
      {CONTAMINANT_COLUMNS.map((col) => (
        <Fragment key={col.key}>
          <div
            className={`${styles.contaminantCell} flex w-full h-full items-center ${contentOpacityClass}`}
          >
            <div className={`${styles.contaminantLabel} text-text-regular`}>
              <Icon
                name={col.iconKey}
                className={`${styles.icon} ${styles[col.iconKey]}`}
                style={
                  "iconSize" in col
                    ? { width: col.iconSize, height: col.iconSize }
                    : undefined
                }
              />
              <span>{col.displayName}</span>
            </div>
          </div>

          {normalizedData.map((entry, zoneIndex) => {
            const value = entry[col.key as keyof CarcasEntry] as number;
            const isHighlighted = highlightedIds.includes(entry.id);
            const isAltColumn = zoneIndex % 2 === 1;
            const isPlaceholder = entry.id < 0;

            return (
              <div
                key={`${entry.zone_number}-${col.key}`}
                className={`
                  flex w-full h-full items-center justify-center
                  ${isAltColumn ? styles.altColumn : ""}
                  ${contentOpacityClass}
                `}
              >
                <button
                  key={increaseMode.toString()}
                  className={`
                    ${styles.btn}
                    relative w-full h-full flex items-center justify-center
                    font-medium rounded-[0.3rem] border border-border
                    ${!increaseMode ? styles.decrease : ""}
                    ${isReadOnly || isPlaceholder ? styles.readonly : ""}
                    ${isHighlighted ? styles.highlighted : ""}
                  `}
                  onClick={() => {
                    if (
                      isReadOnly ||
                      isLoading ||
                      isPlaceholder ||
                      !onValueUpdate
                    )
                      return;

                    onValueUpdate({
                      id: entry.id,
                      counter_name: col.key,
                      increment: increaseMode,
                      amount: updateAmount,
                    });
                  }}
                  disabled={isReadOnly || isLoading || isPlaceholder}
                >
                  {!isReadOnly && (
                    <div
                      className={`${styles.counterBadge} absolute top-[0.4rem] right-[0.4rem] font-semibold pointer-events-none`}
                    >
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

      {/* MARK: Loading / empty overlay */}
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
