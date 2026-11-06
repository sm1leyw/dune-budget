/**
 * components/ui/Tabs.tsx — แท็บแบบปุ่มทรงแคปซูล (ตรงกับหน้า "รออนุมัติ / ประวัติ" ใน Figma) · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * Props:
 *   tabs      [{ value, label, count? }]  count จะแสดงเป็น "(3)" ต่อท้าย
 *   value     แท็บที่เลือกอยู่
 *   onChange  (value) => void
 *
 * @example
 * const [tab, setTab] = useState("pending");
 * <Tabs value={tab} onChange={setTab} tabs={[
 *   { value: "pending", label: "รอคุณพิจารณา", count: 3 },
 *   { value: "done", label: "พิจารณาแล้ว" },
 * ]} />
 */
import { cn } from "@/lib/cn";

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-4", className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "h-12 min-w-[200px] rounded-full border-[1.5px] border-primary px-6 text-base transition",
              active ? "bg-primary font-bold text-text-inverse" : "bg-surface font-medium text-text hover:bg-primary-soft",
            )}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        );
      })}
    </div>
  );
}
