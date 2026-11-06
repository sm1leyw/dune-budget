/**
 * lib/format.ts — แปลงตัวเลขและวันที่เป็นข้อความแสดงผล (เจ้าของ: คนที่ 1)
 * -----------------------------------------------------------------------------
 * มาตรฐานของระบบ (ใช้ให้เหมือนกันทุกหน้า):
 *   - เงิน:    "12,000 บาท"   → formatBaht()
 *   - วันที่:  "02/11/2569"   → formatThaiDate()   (เก็บข้อมูลเป็น ISO "2026-11-02")
 *   - วันที่ยาว: "2 พ.ย. 2569" → formatThaiDateLong()
 */

/**
 * ตัวเลขมีจุลภาค
 * รับเข้า: number · ส่งออก: string เช่น 12000 → "12,000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value);
}

/**
 * จำนวนเงินบาท
 * รับเข้า: number, ตัวเลือก withUnit (ค่าเริ่มต้น true)
 * ส่งออก: string เช่น 12000 → "12,000 บาท" หรือ "12,000" ถ้า withUnit=false
 */
export function formatBaht(value: number, { withUnit = true }: { withUnit?: boolean } = {}): string {
  const text = formatNumber(value);
  return withUnit ? `${text} บาท` : text;
}

function toDate(input: string | Date): Date | null {
  const date = typeof input === "string" ? new Date(input) : input;
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * วันที่แบบสั้น พ.ศ.
 * รับเข้า: ISO string หรือ Date · ส่งออก: "02/11/2569" (ถ้าแปลงไม่ได้คืน "-")
 */
export function formatThaiDate(input: string | Date): string {
  const date = toDate(input);
  if (!date) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * วันที่แบบยาว พ.ศ.
 * รับเข้า: ISO string หรือ Date · ส่งออก: "2 พ.ย. 2569"
 */
export function formatThaiDateLong(input: string | Date): string {
  const date = toDate(input);
  if (!date) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * วันที่วันนี้แบบ ISO (ใช้ตอนสร้างข้อมูลใหม่)
 * ส่งออก: "2026-11-06T11:30:00.000Z"
 */
export function nowISO(): string {
  return new Date().toISOString();
}
