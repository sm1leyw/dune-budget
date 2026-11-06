/**
 * components/ui/FilterBar.tsx — แถบค้นหาและตัวกรอง (ตรงกับหน้า "รออนุมัติ / ประวัติ" ใน Figma) · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ตัวนี้แสดงผลอย่างเดียว ไม่กรองข้อมูลให้ → หน้าของแต่ละคนเก็บค่าไว้ใน useState
 * แล้วกรองข้อมูลเองใน useMemo
 *
 * Props:
 *   search, onSearchChange, searchPlaceholder   ช่องค้นหา
 *   filters   [{ key, label, value, options, onChange }]  dropdown กี่อันก็ได้ ("" = ทั้งหมด)
 *   dateFrom, dateTo, onDateChange(from, to)   ช่วงวันที่ (ISO "2026-11-01") — ไม่ส่งมาจะไม่แสดง
 *   onClear   ปุ่ม "ล้างตัวกรอง" — ไม่ส่งมาจะไม่แสดง
 *
 * @example
 * <FilterBar search={q} onSearchChange={setQ} searchPlaceholder="ค้นหาเลขที่คำขอ หรือ ชื่อโครงการ"
 *   filters={[{ key: "project", label: "โครงการ", value: pid, onChange: setPid, options: projectOptions }]}
 *   onClear={() => { setQ(""); setPid(""); }} />
 */
import { Search } from "lucide-react";
import { Button } from "./Button";
import { Input, Select } from "./Field";

export interface FilterOption {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "ค้นหา",
  filters = [],
  dateFrom,
  dateTo,
  onDateChange,
  onClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  dateFrom?: string;
  dateTo?: string;
  onDateChange?: (from: string, to: string) => void;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-[280px] flex-1">
        <Input
          icon={<Search />}
          type="search"
          value={search}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {filters.map((f) => (
        <div key={f.key} className="w-56">
          <Select
            aria-label={f.label}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            placeholder={`${f.label} : ทั้งหมด`}
            options={f.options}
          />
        </div>
      ))}
      {onDateChange && (
        <div className="flex items-center gap-2">
          <Input type="date" aria-label="ตั้งแต่วันที่" value={dateFrom ?? ""} onChange={(e) => onDateChange(e.target.value, dateTo ?? "")} className="w-44" />
          <span className="text-text-muted">–</span>
          <Input type="date" aria-label="ถึงวันที่" value={dateTo ?? ""} onChange={(e) => onDateChange(dateFrom ?? "", e.target.value)} className="w-44" />
        </div>
      )}
      {onClear && (
        <Button variant="secondary" onClick={onClear}>
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  );
}
