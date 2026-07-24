"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sound";
import { cardTone } from "@/lib/card-palette";
import type { ScenarioChoiceConfig } from "@/lib/quest-config-schemas";
import type { QuestGameProps } from "@/components/quest/types";

export function ScenarioChoiceGame({ config, onFinish }: QuestGameProps<ScenarioChoiceConfig>) {
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null);

  const scenario = config.scenarios[index];
  const pickedOption = scenario.options.find((o) => o.id === pickedOptionId) ?? null;

  function choose(optionId: string) {
    if (pickedOptionId) return;
    setPickedOptionId(optionId);
    const option = scenario.options.find((o) => o.id === optionId);
    if (option?.correct) sfx.ding();
    else sfx.error();
  }

  function next() {
    const updated = { ...choices, [scenario.id]: pickedOptionId! };
    setChoices(updated);
    setPickedOptionId(null);
    if (index + 1 >= config.scenarios.length) {
      onFinish({ choices: updated });
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
        Skenario {index + 1} dari {config.scenarios.length}
      </p>
      <p className="text-sm font-semibold text-navy-800">{scenario.prompt}</p>

      <div className="flex flex-col gap-2">
        {scenario.options.map((option, optionIndex) => {
          const isPicked = pickedOptionId === option.id;
          const showState = Boolean(pickedOptionId);
          const tone = cardTone(optionIndex);
          return (
            <button
              key={option.id}
              type="button"
              disabled={showState}
              onClick={() => choose(option.id)}
              className={`rounded-2xl border-2 p-3 text-left text-sm font-semibold transition ${
                showState && isPicked
                  ? option.correct
                    ? "border-teal-500 bg-teal-100 text-teal-800"
                    : "border-red-300 bg-red-50 text-red-600"
                  : showState && option.correct
                    ? "border-teal-300 bg-teal-50/50 text-teal-700"
                    : `${tone.border} ${tone.bg} ${tone.text} active:scale-95`
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {pickedOption ? (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${pickedOption.correct ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600"}`}>
          {pickedOption.correct ? "NICE! " : "CEK DEUI! "}
          {pickedOption.feedback ?? ""}
        </div>
      ) : null}

      <Button disabled={!pickedOptionId} onClick={next} fullWidth>
        {index + 1 >= config.scenarios.length ? "Selesai" : "Lanjut"}
      </Button>
    </div>
  );
}
