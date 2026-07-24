export interface QuestGameProps<TConfig> {
  config: TConfig;
  maxScore: number;
  onFinish: (answer: unknown) => void;
}
