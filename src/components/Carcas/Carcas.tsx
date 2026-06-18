"use client";

import { CSSProperties } from "react";
import styles from "./Carcas.module.scss";
import {
  CARCAS_PART_CONFIG,
  CARCAS_ZONE_LABEL_FONT_SIZE_DEFAULT,
  CarcasZoneLabel,
  CarcasZoneNumber,
} from "@/data/carcas-zone-data";

// MARK: Types

type CarcasPart = "fq" | "hq" | "whole";

interface CarcasProps {
  isDisabled?: boolean;
  selectedCarcasPart?: CarcasPart;
  onZoneClick?: (zoneNumber: number) => void;
}

// MARK: Subcomponents

function CarcasPartSection({
  config,
  isDisabled,
  onZoneClick,
}: {
  config: (typeof CARCAS_PART_CONFIG)[keyof typeof CARCAS_PART_CONFIG];
  isDisabled: boolean;
  onZoneClick?: (zoneNumber: number) => void;
}) {
  const { aspectRatio } = config;

  const handleZoneClick = (zoneNumber: CarcasZoneNumber) => {
    if (isDisabled) return;
    onZoneClick?.(zoneNumber);
  };

  const partStyle = {
    aspectRatio: `${aspectRatio.width} / ${aspectRatio.height}`,
    "--aspect-w": aspectRatio.width,
    "--aspect-h": aspectRatio.height,
  } as CSSProperties;

  return (
    <div className={styles.partSection} style={partStyle}>
      {/* MARK: Zone pieces */}
      {config.zoneNumbers.map((zoneNum) => {
        const labels = config.labels as Record<CarcasZoneNumber, CarcasZoneLabel>;
        const paths = config.paths as Record<CarcasZoneNumber, string>;
        const label = labels[zoneNum];
        const fontSize = label.fontSize ?? CARCAS_ZONE_LABEL_FONT_SIZE_DEFAULT;

        return (
          <div
            key={zoneNum}
            className={`
              ${styles.piece}
              ${isDisabled ? styles.pieceDisabled : ""}
            `}
            onClick={() => handleZoneClick(zoneNum)}
          >
            <svg
              viewBox={config.viewBox}
              xmlns="http://www.w3.org/2000/svg"
              className={styles.pieceIcon}
            >
              <g transform={config.transform}>
                <path d={paths[zoneNum]} />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={styles.zoneLabel}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {label.letter}
                </text>
              </g>
            </svg>
          </div>
        );
      })}
    </div>
  );
}

// MARK: Main component

export default function Carcas({
  isDisabled = false,
  selectedCarcasPart = "whole",
  onZoneClick,
}: CarcasProps) {
  const partsToRender: ("fq" | "hq")[] =
    selectedCarcasPart === "whole"
      ? ["fq", "hq"]
      : [selectedCarcasPart];

  const isWhole = selectedCarcasPart === "whole";

  // MARK: HTML

  return (
    <div
      className={isWhole ? styles.containerWhole : styles.container}
    >
      {/* MARK: Carcas parts (FQ / HQ) */}
      {partsToRender.map((part) => (
        <CarcasPartSection
          key={part}
          config={CARCAS_PART_CONFIG[part]}
          isDisabled={isDisabled}
          onZoneClick={onZoneClick}
        />
      ))}
    </div>
  );
}
