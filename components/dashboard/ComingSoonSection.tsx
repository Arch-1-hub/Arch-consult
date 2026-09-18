import { LucideIcon } from "lucide-react";

export default function ComingSoonSection({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 border border-ink-line bg-ink-soft p-8">
      <Icon size={24} className="text-ash" strokeWidth={1.5} />
      <h2 className="font-display text-lg text-paper-white">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-ash">{description}</p>
    </div>
  );
}
