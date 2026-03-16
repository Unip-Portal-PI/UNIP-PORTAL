// app/components/filters/FilterDateRange.tsx
"use client";

import { useRef } from "react";
import { IconCalendar } from "@tabler/icons-react";

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
  const inicioRef = useRef<HTMLInputElement>(null);
  const fimRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 block">
        {label}
      </label>
      <div className="flex items-center gap-1 border border-slate-300 dark:border-[#505050] rounded-md bg-blue-100 dark:bg-[#424242] px-3 py-2">
        <input
          ref={inicioRef}
          type="date"
          value={valueInicio}
          onChange={(e) => onChangeInicio(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[#4D4D4D] dark:text-slate-200 focus:outline-none w-0 min-w-0"
        />
        <span className="text-slate-400 dark:text-[#888888] mx-1 shrink-0 text-xs">—</span>
        <input
          ref={fimRef}
          type="date"
          value={valueFim}
          onChange={(e) => onChangeFim(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[#4D4D4D] dark:text-slate-200 focus:outline-none w-0 min-w-0"
        />
        <button
          type="button"
          onClick={() => inicioRef.current?.showPicker()}
          className="shrink-0 ml-1 text-[#4D4D4D] dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <IconCalendar size={15} />
        </button>
      </div>
    </div>
  );
}