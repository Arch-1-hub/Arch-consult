"use client";

function toLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function Field({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === "") return null;

  if (Array.isArray(value)) {
    return (
      <div>
        <h4 className="text-sm text-paper-white">{label}</h4>
        <ul className="mt-2 flex flex-col gap-1.5">
          {value.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-ash">
              · {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div>
        <h4 className="text-sm text-paper-white">{label}</h4>
        <div className="mt-2 flex flex-col gap-3 border-l border-ink-line pl-4">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <Field key={k} label={toLabel(k)} value={v} />
          ))}
        </div>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        <h4 className="text-sm text-paper-white">{label}</h4>
        <p className="mt-1 text-sm text-gold">{value}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm text-paper-white">{label}</h4>
      <p className="mt-1 text-sm leading-relaxed text-ash">{String(value)}</p>
    </div>
  );
}

export default function ReportDataViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex flex-col gap-5">
      {Object.entries(data).map(([key, value]) => (
        <Field key={key} label={toLabel(key)} value={value} />
      ))}
    </div>
  );
}
