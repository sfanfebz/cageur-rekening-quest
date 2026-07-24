"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sound";
import type { SimulationConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

export function SimulationGame({ config, onFinish }: QuestGameProps<SimulationConfig>) {
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null);

  const step = config.steps[stepIndex];

  function choose(optionId: string) {
    if (pickedOptionId) return;
    setPickedOptionId(optionId);
    sfx.pop();
  }

  function next() {
    const updated = { ...choices, [step.id]: pickedOptionId! };
    setChoices(updated);
    setPickedOptionId(null);
    if (stepIndex + 1 >= config.steps.length) {
      onFinish({ choices: updated });
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-navy-600">{config.instruction}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
        Langkah {stepIndex + 1} dari {config.steps.length}
      </p>
      <p className="text-sm font-semibold text-navy-800">{step.label}</p>
      <div className="flex flex-col gap-2">
        {step.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={Boolean(pickedOptionId)}
            onClick={() => choose(option.id)}
            className={`rounded-2xl border-2 p-3 text-left text-sm font-semibold transition ${
              pickedOptionId === option.id ? "border-teal-500 bg-teal-50 text-teal-800" : "border-navy-100 bg-white text-navy-700 active:scale-95"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <Button disabled={!pickedOptionId} onClick={next} fullWidth>
        {stepIndex + 1 >= config.steps.length ? "Selesai" : "Lanjut"}
      </Button>
    </div>
  );
}
