"use client";

import { IconName } from "@/data/icon-data";
import styles from "./Carcas.module.scss";
import Icon from "../Icon/Icon";

type CarcasPart = "upper" | "lower" | "whole";

interface CarcasProps {
  isDisabled?: boolean;
  selectedCarcasPart?: CarcasPart;
  onZoneClick?: (zoneNumber: number) => void;
}

export default function Carcas({
  isDisabled = false,
  selectedCarcasPart = "whole",
  onZoneClick,
}: CarcasProps) {
  const zones = [1, 2, 3, 4, 5, 6, 7, 8];

  const isPieceDisabled = (zoneNumber: number): boolean => {
    if (isDisabled) return true;
    if (selectedCarcasPart === "upper" && zoneNumber > 4) return true;
    if (selectedCarcasPart === "lower" && zoneNumber <= 4) return true;
    return false;
  };

  const handleZoneClick = (zoneNumber: number) => {
    if (isPieceDisabled(zoneNumber)) return;
    if (onZoneClick) {
      onZoneClick(zoneNumber);
    }
  };
  return (
    <div className={styles.container}>
      {zones.map((zoneNum) => {
        return (
          <div
            key={zoneNum}
            className={`
              ${styles.piece} 
              ${isPieceDisabled(zoneNum) ? styles.pieceDisabled : ""}
            `}
            onClick={() => handleZoneClick(zoneNum)}
          >
            <Icon
              name={`silhuette-${zoneNum}` as IconName}
              className={styles.pieceIcon}
            />
          </div>
        );
      })}
    </div>
  );
}
