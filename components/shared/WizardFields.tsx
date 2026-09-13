export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none placeholder:text-ash/60 focus-visible:border-gold"
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={2000}
        className="resize-none border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none placeholder:text-ash/60 focus-visible:border-gold"
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-paper-white">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-ink-line bg-ink px-4 py-3 text-sm text-paper-white outline-none focus-visible:border-gold"
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export type ScoredOption = { label: string; score: number };

export function RadioCardGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ScoredOption[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm text-paper-white">{label}</legend>
      {options.map((option) => (
        <label
          key={option.label}
          className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors ${
            value === option.label
              ? "border-gold text-paper-white"
              : "border-ink-line text-ash hover:border-ash"
          }`}
        >
          <input
            type="radio"
            name={label}
            value={option.label}
            checked={value === option.label}
            onChange={() => onChange(option.label)}
            className="accent-gold"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
