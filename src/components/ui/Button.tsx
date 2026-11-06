/**
 * components/ui/Button.tsx — ปุ่มมาตรฐาน (ตรงกับ component "Button" ใน Figma) · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   <Button>        ปุ่มกด (onClick, type="submit")
 *   <ButtonLink>    ลิงก์ที่หน้าตาเหมือนปุ่ม (ไปหน้าอื่นด้วย next/link)
 *   buttonClasses() class ของปุ่ม เผื่อต้องใช้กับ element อื่น
 *
 * Props:
 *   variant  "primary"      การกระทำหลัก — 1 ปุ่มต่อหน้า/ต่อ popup อยู่ขวาสุด (ขั้นตอนถัดไป, อนุมัติ, ยืนยัน)
 *            "secondary"    ย้อนกลับ, ยกเลิก, กลับไปหน้าหลัก, ดูรายละเอียด
 *            "danger"       ส่งกลับแก้ไข, ยกเลิกคำขอ (บนหน้า)
 *            "dangerSolid"  ยืนยันยกเลิกคำขอ / ยืนยันส่งกลับแก้ไข (ใน popup เท่านั้น)
 *   size     "L" (สูง 48) ปุ่มท้ายฟอร์ม/popup/หัวหน้า · "S" (สูง 32) ปุ่มในแถวตาราง
 *   loading  true = แสดงวงหมุนและกดซ้ำไม่ได้ (กันส่งข้อมูลซ้ำ)
 *   icon     ไอคอนด้านหน้า เช่น <Plus />
 *   fullWidth ปุ่มเต็มความกว้าง
 *   disabled ปุ่มสีเทา กดไม่ได้ (ตรงกับ Style=Disabled ใน Figma)
 *
 * @example
 * <Button variant="secondary" onClick={back}>ย้อนกลับ</Button>
 * <Button loading={saving} onClick={submit}>ยืนยันและยื่นคำขอเบิก</Button>
 * <ButtonLink href="/requests/new" icon={<Plus />}>สร้างคำขอเบิก</ButtonLink>
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "dangerSolid";
export type ButtonSize = "L" | "S";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-text-inverse hover:brightness-110",
  secondary: "bg-surface text-primary border-[1.5px] border-primary hover:bg-primary-soft",
  danger: "bg-surface text-danger border-[1.5px] border-danger hover:bg-danger/5",
  dangerSolid: "bg-danger text-text-inverse hover:brightness-110",
};

const SIZE: Record<ButtonSize, string> = {
  L: "h-12 min-w-[120px] px-7 text-base rounded-md gap-2",
  S: "h-8 px-3.5 text-sm rounded-sm gap-1.5",
};

/**
 * สร้าง class ของปุ่ม
 * รับเข้า: { variant, size, fullWidth, className } · ส่งออก: string
 */
export function buttonClasses({
  variant = "primary",
  size = "L",
  fullWidth = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-bold transition",
    "disabled:pointer-events-none disabled:border-0 disabled:bg-disabled disabled:text-text-inverse",
    "[&_svg]:size-[1.1em]",
    VARIANT[variant],
    SIZE[size],
    fullWidth && "w-full",
    className,
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
};

export type ButtonProps = ComponentProps<"button"> & CommonProps & { loading?: boolean };

export function Button({
  variant,
  size,
  icon,
  fullWidth,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <LoaderCircle className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export type ButtonLinkProps = ComponentProps<typeof Link> & CommonProps;

export function ButtonLink({ variant, size, icon, fullWidth, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
