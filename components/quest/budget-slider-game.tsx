"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BudgetSliderConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

type Zone = "green" | "yellow" | "red";

function zoneOf(value: number, cat: BudgetSliderConfig["categories"][number]): Zone {
  if (value >= cat.idealMin && value <= cat.idealMax) return "green";
  if (value >= cat.warningMin && value <= cat.warningMax) return "yellow";
  return "red";
}

const ZONE_LABEL: Record<Zone, string> = { green: "Pas", yellow: "Perlu Dicek", red: "Kurang Pas" };
const ZONE_BAR: Record<Zone, string> = { green: "bg-teal-500", yellow: "bg-gold-400", red: "bg-red-400" };
const ZONE_TEXT: Record<Zone, string> = { green: "text-teal-700", yellow: "text-gold-700", red: "text-red-600" };

export function BudgetSliderGame({ config, onFinish }: QuestGameProps<BudgetSliderConfig>) {
  const [allocations, setAllocations] = useState<Record<string, number>>(() =>
    Object.fromEntries(config.categories.map((c) => [c.id, 0]))
  );

  const total = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const remaining = config.totalCoins - total;

  function setValue(id: string, value: number) {
    setAllocations((prev) => ({ ...prev, [id]: Math.max(0, Math.min(config.totalCoins, value)) }));
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-navy-600">{config.instruction}</p>

      <div className="flex items-center justify-between rounded-2xl bg-navy-50 px-4 py-3">
        <span className="text-sm font-bold text-navy-700">Sisa koin</span>
        <span className={`text-xl font-extrabold ${remaining === 0 ? "text-teal-600" : "text-navy-800"}`}>
          🪙 {remaining}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {config.categories.map((cat) => {
          const value = allocations[cat.id] ?? 0;
          const zone = zoneOf(value, cat);
          return (
            <div key={cat.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-sm font-bold text-navy-700">{cat.label}</p>
                <span className={`text-xs font-bold ${ZONE_TEXT[zone]}`}>{ZONE_LABEL[zone]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValue(cat.id, value - 5)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-lg font-bold text-navy-600 active:scale-90"
                >
                  −
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={config.totalCoins}
                    step={5}
                    value={value}
                    onChange={(e) => setValue(cat.id, Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
                    <div
                      className={`h-full rounded-full transition-all ${ZONE_BAR[zone]}`}
                      style={{ width: `${(value / config.totalCoins) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValue(cat.id, value + 5)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-lg font-bold text-navy-600 active:scale-90"
                >
                  +
                </button>
                <span className="w-10 shrink-0 text-right text-sm font-extrabold text-navy-800">{value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Button disabled={remaining !== 0} onClick={() => onFinish({ allocations })} fullWidth>
        {remaining === 0 ? "Selesai" : `Sisakan ${remaining} koin lagi`}
      </Button>
    </div>
  );
}
