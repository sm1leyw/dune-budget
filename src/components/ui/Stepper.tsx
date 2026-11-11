/**
 * components/ui/Stepper.tsx — แถบขั้นตอน 1–4 ของฟอร์มยื่นคำขอ (ตรงกับ Figma) · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * Props:
 *   steps    ชื่อแต่ละขั้น เช่น ["เลือกประเภทการขอเบิก", "ข้อมูลคำขอ", "แนบหลักฐานคำขอ", "ตรวจสอบและยืนยัน"]
 *   current  ขั้นปัจจุบัน เริ่มที่ 1 — ขั้นก่อนหน้าแสดงเครื่องหมายถูก ขั้นถัดไปเป็นสีเทา
 *
 * @example
 * <Stepper steps={REQUEST_STEPS} current={2} />
 */
import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-start", className)} aria-label="ขั้นตอน">
      {steps.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <Fragment key={label}>
            {index > 0 && (
              <li aria-hidden className={cn("mx-3 mt-[22px] h-1 flex-1 rounded-full", step <= current ? "bg-primary" : "bg-border")} />
            )}
            <li className="flex w-40 flex-col items-center gap-2 text-center" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full border-[3px] text-lg font-bold",
                  done && "border-primary bg-primary text-text-inverse",
                  active && "border-primary bg-surface text-primary",
                  !done && !active && "border-border bg-surface text-text-muted",
                )}
              >
                {done ? <Check className="size-5" strokeWidth={3} /> : step}
              </span>
              <span className={cn("text-caption", step <= current ? "text-text" : "text-text-muted")}>{label}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
