/**
 * components/ui/Field.tsx — ช่องกรอกข้อมูล · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   <Field>     ครอบช่องกรอก: label ด้านบน + ข้อความช่วย/ข้อผิดพลาดด้านล่าง
 *   <Input>     ช่องกรอกข้อความ/ตัวเลข/วันที่ (props เหมือน <input> ทุกอย่าง + icon)
 *   <Textarea>  ช่องกรอกหลายบรรทัด
 *   <Select>    dropdown — options = [{ value, label }], placeholder = ข้อความตอนยังไม่เลือก
 *
 * Field props: label, htmlFor, required (แสดง *), hint, error (สีแดง, ทำให้ช่องขอบแดงด้วย invalid)
 *
 * @example
 * <Field label="จำนวนเงินขอเบิก" htmlFor="amount" required error={errors.amount}>
 *   <Input id="amount" type="number" invalid={!!errors.amount} value={amount} onChange={...} />
 * </Field>
 */
import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-md border-[1.5px] border-border-input bg-surface px-4 text-body text-text placeholder:text-text-muted/70 transition " +
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 " +
  "disabled:bg-primary-soft disabled:text-text-muted";
const INVALID = "border-danger focus:border-danger focus:ring-danger/15";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-body font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-caption text-danger">{error}</p>
      ) : (
        hint && <p className="text-caption text-text-muted">{hint}</p>
      )}
    </div>
  );
}

export function Input({
  icon,
  invalid,
  className,
  ...rest
}: ComponentProps<"input"> & { icon?: ReactNode; invalid?: boolean }) {
  if (!icon) return <input aria-invalid={invalid || undefined} className={cn(CONTROL, "h-12", invalid && INVALID, className)} {...rest} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted [&_svg]:size-5">{icon}</span>
      <input aria-invalid={invalid || undefined} className={cn(CONTROL, "h-12 pl-11", invalid && INVALID, className)} {...rest} />
    </div>
  );
}

export function Textarea({ invalid, className, ...rest }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea aria-invalid={invalid || undefined} className={cn(CONTROL, "min-h-28 py-3", invalid && INVALID, className)} {...rest} />;
}

export function Select({
  options,
  placeholder,
  invalid,
  className,
  ...rest
}: ComponentProps<"select"> & {
  options: { value: string; label: string }[];
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <select aria-invalid={invalid || undefined} className={cn(CONTROL, "h-12 appearance-none pr-10", invalid && INVALID, className)} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
    </div>
  );
}
