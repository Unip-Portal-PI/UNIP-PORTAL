// app/components/filters/FilterDateRange.tsx
"use client";

interface FilterDateRangeProps {
  label: string;
  valueInicio: string;
  valueFim: string;
  onChangeInicio: (value: string) => void;
  onChangeFim: (value: string) => void;
}

export function FilterDateRange({
  label,
  valueInicio,
  valueFim,
  onChangeInicio,
  onChangeFim,
}: FilterDateRangeProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 block">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          value={valueInicio}
          onChange={(e) => onChangeInicio(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 dark:border-[#505050] rounded-md text-sm bg-blue-100 dark:bg-[#424242] text-[#4D4D4D] dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        />
        <input
          type="date"
          value={valueFim}
          onChange={(e) => onChangeFim(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 dark:border-[#505050] rounded-md text-sm bg-blue-100 dark:bg-[#424242] text-[#4D4D4D] dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        />
      </div>
    </div>
  );
}
