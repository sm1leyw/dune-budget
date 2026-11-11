/**
 * components/request-form/formModel.ts — ข้อมูลในฟอร์มยื่นคำขอ · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * ฟอร์มเก็บค่าเป็น "ข้อความ" ตามที่ผู้ใช้พิมพ์ (เช่น amount = "22,500")
 * แล้วค่อยแปลงเป็นข้อมูลจริง (RequestInput) ตอนกดยืนยันด้วย toRequestInput()
 *
 * ส่งออก:
 *   RequestFormValues            type ค่าทั้งหมดในฟอร์ม
 *   ItemRow                      type แถวรายการค่าใช้จ่าย/ใบเสร็จ 1 แถว
 *   STEP_LABELS[type]            ชื่อ 4 ขั้นของ <Stepper> (ตาราง A / B ใช้คำต่างกันตาม Figma)
 *   emptyForm(today)             → ค่าเริ่มต้นของฟอร์มใหม่
 *   newItemRow(today)            → แถวว่าง 1 แถว
 *   fromRequest(request)         → ค่าในฟอร์มจากคำขอเดิม (ใช้ในหน้าแก้ไข)
 *   toRequestInput(values, advance?) → RequestInput ส่งให้ createRequest / resubmitRequest
 *   parseAmount("22,500")        → 22500 (พิมพ์ผิด/ว่าง → NaN)
 *   sumItems(items)              → ผลรวมยอดเงินทุกแถว (แถวที่พิมพ์ผิดนับเป็น 0)
 *   todayISO()                   → วันนี้แบบ "2026-11-07"
 */
import type { RequestInput } from "@/store/requests";
import type { ReimburseRequest, RefundMethod, RequestType } from "@/types";

export interface ItemRow {
  id: string;
  name: string;
  /** ข้อความที่พิมพ์ เช่น "4,000" */
  amount: string;
  /** ISO "2026-11-02" */
  date: string;
  /** ชื่อไฟล์หลักฐาน (ยังไม่มี backend จึงเก็บแค่ชื่อ) */
  fileName?: string;
}

export interface RequestFormValues {
  type: RequestType;
  // ---- ตาราง A ----
  projectId: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  // ---- ตาราง B ----
  /** คำขอตาราง A ที่ต้องการเคลียร์ */
  advanceRefId: string;
  refundMethod: RefundMethod | "";
  // ---- ใช้ทั้งสองแบบ ----
  /** A = จำนวนเงินขอเบิก · B = ยอดใช้จ่ายจริงตามใบเสร็จ */
  amount: string;
  /** A = รายละเอียดวัตถุประสงค์ · B = หมายเหตุ/คำอธิบายการคืนเงิน */
  purpose: string;
  items: ItemRow[];
}

export const STEP_LABELS: Record<RequestType, string[]> = {
  ADVANCE: ["เลือกประเภทการขอเบิก", "ข้อมูลคำขอ", "แนบหลักฐานคำขอ", "ตรวจสอบและยืนยัน"],
  CLEARANCE: ["เลือกประเภทรายการ", "ข้อมูลการคืนเงิน", "แนบใบเสร็จ", "ตรวจสอบและยืนยัน"],
};

let rowSeq = 0;
/** แถวว่าง 1 แถว — รับเข้า: วันที่เริ่มต้น (ISO) */
export function newItemRow(today: string): ItemRow {
  rowSeq += 1;
  return { id: `row-${Date.now()}-${rowSeq}`, name: "", amount: "", date: today };
}

/** ค่าเริ่มต้นของฟอร์มใหม่ — รับเข้า: วันนี้ (ISO) */
export function emptyForm(today: string): RequestFormValues {
  return {
    type: "ADVANCE",
    projectId: "",
    categoryId: "",
    startDate: today,
    endDate: today,
    advanceRefId: "",
    refundMethod: "TRANSFER",
    amount: "",
    purpose: "",
    items: [newItemRow(today)],
  };
}

/** แปลงคำขอเดิมเป็นค่าในฟอร์ม (หน้าแก้ไขคำขอที่ถูกส่งกลับ) */
export function fromRequest(request: ReimburseRequest): RequestFormValues {
  return {
    type: request.type,
    projectId: request.projectId,
    categoryId: request.categoryId,
    startDate: request.startDate,
    endDate: request.endDate,
    advanceRefId: request.advanceRefId ?? "",
    refundMethod: request.refundMethod ?? "TRANSFER",
    amount: String(request.totalAmount),
    purpose: request.purpose,
    items: request.items.map((i) => ({ ...i, amount: String(i.amount) })),
  };
}

/** "22,500" → 22500 · "" หรือพิมพ์ผิด → NaN */
export function parseAmount(text: string): number {
  const cleaned = text.replace(/,/g, "").trim();
  if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/** ผลรวมยอดเงินทุกแถว (แถวที่ยังพิมพ์ไม่ถูกนับเป็น 0) */
export function sumItems(items: ItemRow[]): number {
  return items.reduce((sum, i) => sum + (parseAmount(i.amount) || 0), 0);
}

/**
 * แปลงค่าในฟอร์ม → ข้อมูลที่ store ต้องการ
 * รับเข้า: ค่าในฟอร์ม (ผ่าน validate แล้ว), คำขอตาราง A ที่อ้างอิง (เฉพาะตาราง B)
 * ส่งออก: RequestInput — ตาราง B ใช้โครงการ/หมวด/ช่วงวันที่ของใบยืมเดิม
 */
export function toRequestInput(values: RequestFormValues, advance?: ReimburseRequest): RequestInput {
  const items = values.items.map((i) => ({
    id: i.id,
    name: i.name.trim(),
    amount: parseAmount(i.amount),
    date: i.date,
    fileName: i.fileName,
  }));

  if (values.type === "CLEARANCE") {
    if (!advance) throw new Error("ไม่พบใบคำขอเบิกเดิมที่อ้างอิง");
    return {
      type: "CLEARANCE",
      projectId: advance.projectId,
      categoryId: advance.categoryId,
      startDate: advance.startDate,
      endDate: advance.endDate,
      advanceRefId: advance.id,
      refundMethod: values.refundMethod || undefined,
      purpose: values.purpose.trim(),
      items,
    };
  }

  return {
    type: "ADVANCE",
    projectId: values.projectId,
    categoryId: values.categoryId,
    startDate: values.startDate,
    endDate: values.endDate,
    purpose: values.purpose.trim(),
    items,
  };
}

/** วันนี้ตามเวลาเครื่องผู้ใช้ เป็น ISO "2026-11-07" (ใช้เป็นค่าเริ่มต้นของช่องวันที่) */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
