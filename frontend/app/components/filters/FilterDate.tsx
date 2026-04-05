// app/components/filters/FilterDate.tsx
import { IconCalendar } from "@tabler/icons-react";

type FilterDateProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function FilterDate({ label, value, onChange }: FilterDateProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 block">
        {label}
      </label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2  border border-slate-300 dark:border-[#505050] rounded-md text-sm bg-blue-100 dark:bg-[#424242] text-[#4D4D4D] dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        />
        {/* <IconCalendar
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4D4D4D] dark:text-slate-400 pointer-events-none"
        /> */}
      </div>
    </div>
  );
}