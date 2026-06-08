import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../Button";

/**
 * Shared decision row for ConflictResolver (and any custom merge UI shells).
 */
export default function ResolutionStrategy({ value, onChange }) {
  const { t } = useTranslation();

  const choices =
    /** @type {const} */ ([
      ["source", "mergeConflict.strategy.source"],
      ["target", "mergeConflict.strategy.target"],
      ["both", "mergeConflict.strategy.both"],
      ["custom", "mergeConflict.strategy.custom"],
    ]);

  return (
    <div className="flex flex-wrap gap-2">
      {choices.map(([key, labelKey]) => (
        <Button
          key={key}
          type="button"
          variant={value === key ? "primary" : "secondary"}
          onClick={() => onChange(key)}
        >
          {t(labelKey)}
        </Button>
      ))}
    </div>
  );
}
