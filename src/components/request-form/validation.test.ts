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
