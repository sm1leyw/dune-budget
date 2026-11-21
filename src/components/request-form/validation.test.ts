/**
 * ทดสอบ validation + formModel ของฟอร์มยื่นคำขอ · เจ้าของ: คนที่ 2
 * รัน: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyForm, parseAmount, sumItems, toRequestInput, type RequestFormValues } from "./formModel";
import { validateFile, validateStep, type ValidationContext } from "./validation";
import type { ReimburseRequest } from "@/types";

const TODAY = "2026-11-07";
const ctx: ValidationContext = { categoryRemaining: 100_000, hasEligibleAdvance: true };

function filledAdvance(): RequestFormValues {
  const v = emptyForm(TODAY);
  return {
    ...v,
    projectId: "DUNE-001",
    categoryId: "DUNE-001-C2",
    amount: "22,500",
    purpose: "ค่าเช่าห้องประชุม",
    items: [{ id: "r1", name: "ค่าห้อง", amount: "22500", date: TODAY, fileName: "a.pdf" }],
  };
}

test("parseAmount รับตัวเลขที่มีจุลภาค และปฏิเสธข้อความ", () => {
  assert.equal(parseAmount("22,500"), 22500);
  assert.equal(parseAmount("10.50"), 10.5);
  assert.ok(Number.isNaN(parseAmount("")));
  assert.ok(Number.isNaN(parseAmount("abc")));
  assert.ok(Number.isNaN(parseAmount("-5")));
});

test("ขั้นที่ 2 ตาราง A: ข้อมูลครบผ่าน / ขาดช่องต้องไม่ผ่าน", () => {
  assert.deepEqual(validateStep(2, filledAdvance(), ctx), {});
  const errors = validateStep(2, { ...filledAdvance(), projectId: "", purpose: " " }, ctx);
  assert.ok(errors.projectId);
  assert.ok(errors.purpose);
});

test("ขั้นที่ 2 ตาราง A: เกินงบคงเหลือ → error ที่ amount", () => {
  const errors = validateStep(2, { ...filledAdvance(), amount: "150000" }, ctx);
  assert.match(errors.amount, /เกินงบคงเหลือ/);
});

test("ขั้นที่ 2 ตาราง A: วันที่สิ้นสุดก่อนวันที่เริ่ม → error", () => {
  const errors = validateStep(2, { ...filledAdvance(), startDate: "2026-11-10", endDate: "2026-11-01" }, ctx);
  assert.ok(errors.endDate);
});

test("ขั้นที่ 3: ยอดรวมรายการต้องเท่ากับยอดขั้นที่ 2 และทุกแถวต้องแนบไฟล์", () => {
  const v = filledAdvance();
  assert.deepEqual(validateStep(3, v, ctx), {});
  const mismatch = validateStep(3, { ...v, items: [{ ...v.items[0], amount: "20000" }] }, ctx);
  assert.match(mismatch.items, /ไม่ตรงกับ/);
  const noFile = validateStep(3, { ...v, items: [{ ...v.items[0], fileName: undefined }] }, ctx);
  assert.ok(noFile["items.r1.fileName"]);
});

test("ขั้นที่ 1: เลือกตาราง B แต่ไม่มีใบยืมให้เคลียร์ → ไม่ผ่าน", () => {
  const errors = validateStep(1, { ...emptyForm(TODAY), type: "CLEARANCE" }, { hasEligibleAdvance: false });
  assert.ok(errors.type);
});

test("toRequestInput ตาราง B ใช้โครงการ/หมวดของใบยืมเดิม", () => {
  const advance = { id: "REQ-2026-0005", projectId: "DUNE-001", categoryId: "DUNE-001-C1", startDate: "2026-10-25", endDate: "2026-10-25" } as ReimburseRequest;
  const input = toRequestInput(
    { ...emptyForm(TODAY), type: "CLEARANCE", advanceRefId: advance.id, amount: "1500", purpose: "คืนส่วนต่าง",
      items: [{ id: "r1", name: "ค่ารถ", amount: "1,500", date: TODAY, fileName: "r.pdf" }] },
    advance,
  );
  assert.equal(input.projectId, "DUNE-001");
  assert.equal(input.advanceRefId, "REQ-2026-0005");
  assert.equal(input.items[0].amount, 1500);
  assert.equal(sumItems([{ id: "x", name: "", amount: "1,000", date: TODAY }, { id: "y", name: "", amount: "oops", date: TODAY }]), 1000);
});

test("validateFile: ชนิดและขนาดไฟล์", () => {
  assert.equal(validateFile({ name: "a.pdf", type: "application/pdf", size: 1000 }), null);
  assert.ok(validateFile({ name: "a.exe", type: "application/x-msdownload", size: 1000 }));
  assert.ok(validateFile({ name: "big.png", type: "image/png", size: 11 * 1024 * 1024 }));
});

test("ตาราง B: ต้องเลือกวิธีคืนเงินเฉพาะตอนมีเงินต้องคืน และส่วนที่ใช้เกินต้องไม่เกินงบคงเหลือ", () => {
  const advance = { id: "REQ-2026-0005", totalAmount: 2_000 } as ReimburseRequest;
  const base: RequestFormValues = { ...emptyForm(TODAY), type: "CLEARANCE", advanceRefId: advance.id, purpose: "เคลียร์", refundMethod: "" };
  const c: ValidationContext = { hasEligibleAdvance: true, advance, clearanceExtraLimit: 1_000 };
  assert.ok(validateStep(2, { ...base, amount: "1500" }, c).refundMethod, "ใช้น้อยกว่ายืม ต้องเลือกวิธีคืน");
  assert.ok(validateStep(2, { ...base, amount: "1500", refundMethod: "TRANSFER" }, c).refundSlip, "คืนแบบโอน ต้องแนบสลิป");
  assert.deepEqual(validateStep(2, { ...base, amount: "1500", refundMethod: "CASH" }, c), {}, "คืนเงินสด ไม่ต้องแนบสลิป");
  assert.deepEqual(
    validateStep(2, { ...base, amount: "1500", refundMethod: "TRANSFER", refundSlip: { name: "slip.pdf", data: "data:x" } }, c),
    {},
  );
  assert.deepEqual(validateStep(2, { ...base, amount: "2000" }, c), {}, "ใช้พอดี ไม่ต้องเลือก");
  assert.deepEqual(validateStep(2, { ...base, amount: "2800" }, c), {}, "ใช้เกิน 800 ไม่เกินงบ 1,000");
  assert.match(validateStep(2, { ...base, amount: "3500" }, c).amount ?? "", /งบคงเหลือ/);
});

test("toRequestInput ตาราง B บันทึกยอดยืม และไม่เก็บวิธีคืนเงินเมื่อไม่มีเงินต้องคืน", () => {
  const advance = { id: "REQ-2026-0005", totalAmount: 2_000, projectId: "P", categoryId: "C", startDate: "2026-10-25", endDate: "2026-10-25" } as ReimburseRequest;
  const v: RequestFormValues = {
    ...emptyForm(TODAY), type: "CLEARANCE", advanceRefId: advance.id, amount: "2500", purpose: "เคลียร์", refundMethod: "TRANSFER",
    items: [{ id: "r1", name: "ค่าเดินทาง", amount: "2500", date: TODAY, fileName: "a.pdf" }],
  };
  const input = toRequestInput(v, advance);
  assert.equal(input.advanceAmount, 2_000);
  assert.equal(input.refundMethod, undefined);
});

test("toRequestInput ตาราง B คืนแบบโอนเก็บสลิป · ใช้เกินไม่เก็บสลิป", () => {
  const advance = { id: "REQ-2026-0005", totalAmount: 2_000, projectId: "P", categoryId: "C", startDate: "2026-10-25", endDate: "2026-10-25" } as ReimburseRequest;
  const slip = { name: "slip.pdf", data: "data:x" };
  const row = (amount: string) => [{ id: "r1", name: "ค่าเดินทาง", amount, date: TODAY, fileName: "a.pdf" }];
  const base = { ...emptyForm(TODAY), type: "CLEARANCE" as const, advanceRefId: advance.id, purpose: "เคลียร์", refundMethod: "TRANSFER" as const, refundSlip: slip };
  assert.deepEqual(toRequestInput({ ...base, amount: "1800", items: row("1800") }, advance).refundSlip, slip);
  assert.equal(toRequestInput({ ...base, amount: "2500", items: row("2500") }, advance).refundSlip, undefined);
});
