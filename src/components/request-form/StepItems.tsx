"use client";
/**
 * components/request-form/StepItems.tsx — ขั้นตอนที่ 3: รายการค่าใช้จ่าย/ใบเสร็จ + แนบไฟล์ · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * Props:
 *   values, onChange(patch), errors   (errors ของแถว: "items.<rowId>.name|amount|date|fileName")
 *   today                             วันที่เริ่มต้นของแถวใหม่
 *
 * แต่ละแถว: ชื่อรายการ · ยอดเงิน · วันที่ · ไฟล์ (ปุ่ม "แนบเอกสาร" → AttachFileModal) · ปุ่มลบแถว
 * ด้านล่างแสดงยอดรวมเทียบกับยอดที่กรอกในขั้นที่ 2 (ต้องเท่ากันจึงไปต่อได้)
 */
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatBaht } from "@/lib/format";
import { newItemRow, parseAmount, sumItems, type ItemRow, type RequestFormValues } from "./formModel";
import type { FormErrors } from "./validation";
import { AttachFileModal } from "./AttachFileModal";

export function StepItems({
  values,
  onChange,
  errors,
  today,
}: {
  values: RequestFormValues;
  onChange: (patch: Partial<RequestFormValues>) => void;
  errors: FormErrors;
  today: string;
}) {
  const [attachRowId, setAttachRowId] = useState<string | null>(null);
  const isClearance = values.type === "CLEARANCE";
  const target = parseAmount(values.amount);
  const total = sumItems(values.items);
  const matched = !Number.isNaN(target) && Math.abs(total - target) < 0.001;

  function updateRow(id: string, patch: Partial<ItemRow>) {
    onChange({ items: values.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="secondary" icon={<Plus />} onClick={() => onChange({ items: [...values.items, newItemRow(today)] })}>
          {isClearance ? "เพิ่มใบเสร็จ" : "เพิ่มรายการเบิก"}
        </Button>
      </div>

      <div className="rounded-md bg-primary-soft p-5">
        <h3 className="mb-4 text-lg font-medium text-text">{isClearance ? "รายการคืนเงิน" : "ข้อมูลหลักฐาน"}</h3>

        {/* หัวคอลัมน์ (ซ่อนบนจอเล็ก) */}
        <div className="mb-2 grid grid-cols-[1.2fr_0.8fr_0.9fr_1.6fr_40px] gap-3 px-1 text-caption text-text-muted max-lg:hidden">
          <span>ชื่อรายการค่าใช้จ่าย</span>
          <span>ยอดเงิน (บาท)</span>
          <span>วันที่บนหลักฐาน</span>
          <span>ไฟล์หลักฐาน</span>
          <span className="sr-only">ลบ</span>
        </div>

        <ul className="space-y-3">
          {values.items.map((row, index) => {
            const key = `items.${row.id}`;
            const rowErrors = [errors[`${key}.name`], errors[`${key}.amount`], errors[`${key}.date`], errors[`${key}.fileName`]].filter(Boolean);
            return (
              <li key={row.id}>
                <div className="grid grid-cols-[1.2fr_0.8fr_0.9fr_1.6fr_40px] items-center gap-3 max-lg:grid-cols-2">
                  <Input
                    aria-label={`ชื่อรายการที่ ${index + 1}`}
                    placeholder="ชื่อรายการค่าใช้จ่าย"
                    value={row.name}
                    invalid={!!errors[`${key}.name`]}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  />
                  <Input
                    aria-label={`ยอดเงินรายการที่ ${index + 1}`}
                    inputMode="decimal"
                    placeholder="ยอดเงิน (บาท)"
                    value={row.amount}
                    invalid={!!errors[`${key}.amount`]}
                    onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                  />
                  <Input
                    aria-label={`วันที่รายการที่ ${index + 1}`}
                    type="date"
                    value={row.date}
                    invalid={!!errors[`${key}.date`]}
                    onChange={(e) => updateRow(row.id, { date: e.target.value })}
                  />
                  <div
                    className={cn(
                      "flex h-12 items-center rounded-md border-[1.5px] bg-surface px-3",
                      errors[`${key}.fileName`] ? "border-danger" : "border-border-input",
                    )}
                  >
                    {row.fileName ? (
                      <span className="flex max-w-full items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-caption text-primary">
                        <span className="truncate">{row.fileName}</span>
                        <button
                          type="button"
                          aria-label={`ลบไฟล์ ${row.fileName}`}
                          onClick={() => updateRow(row.id, { fileName: undefined })}
                          className="shrink-0 rounded-full hover:bg-surface"
                        >
                          <X className="size-3.5" />
                        </button>
                      </span>
                    ) : (
                      <Button variant="secondary" size="S" onClick={() => setAttachRowId(row.id)}>
                        แนบเอกสาร
                      </Button>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`ลบรายการที่ ${index + 1}`}
                    disabled={values.items.length === 1}
                    onClick={() => onChange({ items: values.items.filter((r) => r.id !== row.id) })}
                    className="flex size-10 items-center justify-center rounded-sm text-text-muted transition hover:bg-danger/5 hover:text-danger disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
                {rowErrors.length > 0 && <p className="mt-1 px-1 text-caption text-danger">{rowErrors.join(" · ")}</p>}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className={cn("text-body", errors.items ? "text-danger" : "text-text-muted")}>
            {errors.items ??
              (matched ? "ยอดรวมตรงกับยอดที่กรอกไว้แล้ว" : `ยอดรวมต้องเท่ากับ ${Number.isNaN(target) ? "ยอดในขั้นที่ 2" : formatBaht(target)}`)}
          </p>
          <p className="text-lg font-bold text-text">
            ยอดรวม <span className={matched ? "text-primary" : "text-text"}>{formatBaht(total)}</span>
          </p>
        </div>
      </div>

      <AttachFileModal
        open={attachRowId !== null}
        title={isClearance ? "แนบใบเสร็จ" : "แนบหลักฐานการเบิกจ่าย"}
        onClose={() => setAttachRowId(null)}
        onSave={(fileName) => attachRowId && updateRow(attachRowId, { fileName })}
      />
    </div>
  );
}
