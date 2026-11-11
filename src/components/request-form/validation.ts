/**
 * components/request-form/validation.ts — ตรวจความถูกต้องของแต่ละขั้น · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * ฟังก์ชันล้วน (ไม่แตะ store) จึงเขียน test ได้ง่าย → ดู validation.test.ts
 *
 * ส่งออก:
 *   FormErrors                 { [ชื่อช่อง]: ข้อความผิดพลาด } — ชื่อช่องของรายการใช้ "items.<rowId>.<field>"
 *   ValidationContext          ข้อมูลที่ต้องใช้ตรวจ แต่ไม่ได้อยู่ในฟอร์ม (งบคงเหลือ, ใบยืมเดิม)
 *   validateStep(step, values, ctx) → FormErrors  (ว่าง = ผ่าน ไปขั้นถัดไปได้)
 *   validateAll(values, ctx)        → FormErrors  (ตรวจทุกขั้นก่อนกดยืนยัน)
 *   MAX_FILE_SIZE, ACCEPTED_FILE_TYPES, validateFile(file) → ข้อความผิดพลาด | null
 */
import type { ReimburseRequest } from "@/types";
import { parseAmount, sumItems, type RequestFormValues } from "./formModel";
import { formatBaht } from "@/lib/format";

export type FormErrors = Record<string, string>;

export interface ValidationContext {
  /** งบคงเหลือของหมวดที่เลือก (ตาราง A) — ยังไม่ได้เลือกหมวด = undefined */
  categoryRemaining?: number;
  /** ใบยืมเดิมที่เลือก (ตาราง B) */
  advance?: ReimburseRequest;
  /** มีใบยืมให้เลือกเคลียร์ไหม (ตาราง B) */
  hasEligibleAdvance: boolean;
}

function validateType(values: RequestFormValues, ctx: ValidationContext): FormErrors {
  if (values.type === "CLEARANCE" && !ctx.hasEligibleAdvance) {
    return { type: "ยังไม่มีใบคำขอเบิกที่จ่ายเงินแล้วให้เคลียร์" };
  }
  return {};
}

function validateDetails(values: RequestFormValues, ctx: ValidationContext): FormErrors {
  const e: FormErrors = {};
  const amount = parseAmount(values.amount);

  if (values.type === "ADVANCE") {
    if (!values.projectId) e.projectId = "กรุณาเลือกโครงการ";
    if (!values.categoryId) e.categoryId = "กรุณาเลือกหมวดค่าใช้จ่าย";
    if (Number.isNaN(amount) || amount <= 0) e.amount = "กรุณากรอกจำนวนเงินเป็นตัวเลขมากกว่า 0";
    else if (ctx.categoryRemaining !== undefined && amount > ctx.categoryRemaining) {
      e.amount = `เกินงบคงเหลือของหมวดนี้ (คงเหลือ ${formatBaht(ctx.categoryRemaining)})`;
    }
    if (!values.startDate) e.startDate = "กรุณาเลือกวันที่เริ่ม";
    if (!values.endDate) e.endDate = "กรุณาเลือกวันที่สิ้นสุด";
    else if (values.startDate && values.endDate < values.startDate) e.endDate = "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม";
    if (!values.purpose.trim()) e.purpose = "กรุณากรอกรายละเอียดวัตถุประสงค์";
  } else {
    if (!values.advanceRefId || !ctx.advance) e.advanceRefId = "กรุณาเลือกใบคำขอเบิกเดิม";
    if (Number.isNaN(amount) || amount <= 0) e.amount = "กรุณากรอกยอดใช้จ่ายจริงเป็นตัวเลขมากกว่า 0";
    if (!values.refundMethod) e.refundMethod = "กรุณาเลือกวิธีการคืนเงิน";
    if (!values.purpose.trim()) e.purpose = "กรุณากรอกหมายเหตุ / คำอธิบายการคืนเงิน";
  }
  return e;
}

function validateItems(values: RequestFormValues): FormErrors {
  const e: FormErrors = {};
  if (values.items.length === 0) {
    e.items = "กรุณาเพิ่มอย่างน้อย 1 รายการ";
    return e;
  }
  for (const row of values.items) {
    const key = `items.${row.id}`;
    const amount = parseAmount(row.amount);
    if (!row.name.trim()) e[`${key}.name`] = "กรอกชื่อรายการ";
    if (Number.isNaN(amount) || amount <= 0) e[`${key}.amount`] = "กรอกยอดเงิน";
    if (!row.date) e[`${key}.date`] = "เลือกวันที่";
    if (!row.fileName) e[`${key}.fileName`] = "แนบเอกสาร";
  }
  const target = parseAmount(values.amount);
  const total = sumItems(values.items);
  if (!Number.isNaN(target) && Math.abs(total - target) > 0.001) {
    const word = values.type === "ADVANCE" ? "จำนวนเงินขอเบิก" : "ยอดใช้จ่ายจริง";
    e.items = `ยอดรวมรายการ ${formatBaht(total)} ไม่ตรงกับ${word} ${formatBaht(target)}`;
  }
  return e;
}

/**
 * ตรวจขั้นเดียว
 * รับเข้า: ขั้น (1–4), ค่าในฟอร์ม, context · ส่งออก: FormErrors (ว่าง = ผ่าน)
 */
export function validateStep(step: number, values: RequestFormValues, ctx: ValidationContext): FormErrors {
  switch (step) {
    case 1:
      return validateType(values, ctx);
    case 2:
      return validateDetails(values, ctx);
    case 3:
      return validateItems(values);
    default:
      return {};
  }
}

/** ตรวจทุกขั้น — ใช้ก่อนกด "ยืนยันและยื่นคำขอ" */
export function validateAll(values: RequestFormValues, ctx: ValidationContext): FormErrors {
  return { ...validateStep(1, values, ctx), ...validateStep(2, values, ctx), ...validateStep(3, values, ctx) };
}

// ------------------------------------------------------------------ ไฟล์แนบ
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png";

/** ตรวจไฟล์แนบ — ส่งออก: ข้อความผิดพลาด หรือ null ถ้าใช้ได้ */
export function validateFile(file: { name: string; type: string; size: number }): string | null {
  const okType = ACCEPTED_FILE_TYPES.includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!okType) return "รองรับเฉพาะไฟล์ PDF, JPG และ PNG";
  if (file.size > MAX_FILE_SIZE) return "ไฟล์มีขนาดเกิน 10 MB";
  return null;
}
