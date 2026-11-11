"use client";
/**
 * components/request-form/StepType.tsx — ขั้นตอนที่ 1: เลือกตาราง A (ขอเบิก) หรือ B (คืนเงิน) · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * Props:
 *   value      ประเภทที่เลือก
 *   onChange   (type) => void
 *   locked     true = เปลี่ยนประเภทไม่ได้ (หน้าแก้ไขคำขอ)
 *   error      ข้อความผิดพลาด เช่น ยังไม่มีใบยืมให้เคลียร์
 *
 * หน้าตาตาม Figma: การ์ดพื้นเขียวอ่อน 2 ใบ วงกลม radio มุมขวาบน
 * ใช้ <input type="radio"> จริงซ่อนไว้ → กดแป้น Tab/ลูกศรเลือกได้ และ screen reader อ่านได้
 */
import { cn } from "@/lib/cn";
import { REQUEST_TYPE_CARD } from "@/constants/request";
import type { RequestType } from "@/types";

const TYPES: RequestType[] = ["ADVANCE", "CLEARANCE"];

export function StepType({
  value,
  onChange,
  locked = false,
  error,
}: {
  value: RequestType;
  onChange: (type: RequestType) => void;
  locked?: boolean;
  error?: string;
}) {
  return (
    <div>
      <div role="radiogroup" aria-label="ประเภทการทำรายการ" className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
        {TYPES.map((type) => {
          const card = REQUEST_TYPE_CARD[type];
          const selected = value === type;
          const disabled = locked && !selected;
          return (
            <label
              key={type}
              className={cn(
                "relative flex min-h-[188px] cursor-pointer flex-col rounded-md border-2 bg-primary-soft p-6 transition",
                selected ? "border-primary" : "border-transparent hover:border-border",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name="request-type"
                value={type}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(type)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "absolute right-5 top-5 flex size-6 items-center justify-center rounded-full border-2 bg-surface",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
                  selected ? "border-primary" : "border-border-input",
                )}
              >
                {selected && <span className="size-3 rounded-full bg-primary" />}
              </span>
              <span className="text-lg font-medium text-primary">{card.table}</span>
              <span className="mt-4 text-[32px] font-bold leading-tight text-text">{card.title}</span>
              <span className="mt-2 text-caption text-text-muted">{card.description}</span>
            </label>
          );
        })}
      </div>
      {locked && <p className="mt-4 text-caption text-text-muted">คำขอที่ส่งกลับแก้ไขเปลี่ยนประเภทไม่ได้ หากต้องการเปลี่ยนให้ยกเลิกคำขอนี้แล้วยื่นใหม่</p>}
      {error && (
        <p role="alert" className="mt-4 text-body text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
