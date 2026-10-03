"use client";

export type SemesterSelection = "all" | string[];

type SemesterCheckboxGroupProps = {
  id: string;
  labels: string[];
  value: SemesterSelection;
  onChange: (value: SemesterSelection) => void;
  label?: string;
};

function Check({
  checked,
  onChange,
  children,
  strong = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <label className="group inline-flex cursor-pointer select-none items-baseline whitespace-pre hover:bg-neutral-200 hover:text-black has-[:focus-visible]:bg-neutral-200 has-[:focus-visible]:text-black">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-neutral-600 group-hover:text-black">[</span>
      <span className={checked ? "text-term-accent-bright group-hover:text-black" : "text-neutral-700 group-hover:text-black"}>
        {checked ? "x" : " "}
      </span>
      <span className="text-neutral-600 group-hover:text-black">] </span>
      <span className={strong ? "text-neutral-100 group-hover:text-black" : checked ? "text-neutral-300 group-hover:text-black" : "text-neutral-500 group-hover:text-black"}>
        {children}
      </span>
    </label>
  );
}

/** `[x] all  [x] Fall 2024  [ ] Spring 2025` checkbox row. */
export function SemesterCheckboxGroup({
  id,
  labels,
  value,
  onChange,
  label = "Semesters",
}: SemesterCheckboxGroupProps) {
  if (!labels.length) return null;

  const selected = value === "all" ? labels : value.filter((semester) => labels.includes(semester));
  const allSelected = selected.length === labels.length;

  const toggleSemester = (semester: string) => {
    const next = selected.includes(semester)
      ? selected.filter((item) => item !== semester)
      : [...selected, semester];
    onChange(next.length === labels.length ? "all" : next);
  };

  return (
    <fieldset id={id} className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Check checked={allSelected} onChange={(checked) => onChange(checked ? "all" : [])} strong>
          all
        </Check>
        {labels.map((semester) => (
          <Check key={semester} checked={selected.includes(semester)} onChange={() => toggleSemester(semester)}>
            {semester.toLowerCase()}
          </Check>
        ))}
      </div>
    </fieldset>
  );
}
