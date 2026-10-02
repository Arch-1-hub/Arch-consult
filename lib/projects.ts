export type Milestone = { title: string; done: boolean };

export const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  review: "In review",
  completed: "Completed",
  on_hold: "On hold",
};

export const STATUS_COLOR: Record<string, string> = {
  planning: "text-ash",
  in_progress: "text-gold",
  review: "text-gold",
  completed: "text-green-400",
  on_hold: "text-red-400",
};
