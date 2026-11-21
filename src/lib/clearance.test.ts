/**
 * lib/clearance.test.ts — คำขอคืนเงิน: ยอดคืน/จ่ายเพิ่ม · สายอนุมัติ · ผลต่องบประมาณ · รันด้วย npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getRoutingAmount, getSettlement, settlementLabel } from "./clearance";
import { getCategoryBudget } from "./budget";
import { getInitialStatus } from "./workflow";
import type { Project, ReimburseRequest } from "../types";

const advance = (r: Partial<ReimburseRequest> = {}) =>
  ({ id: "REQ-1", type: "ADVANCE", projectId: "P", categoryId: "C", status: "COMPLETED", totalAmount: 10_000, ...r }) as ReimburseRequest;
const clearance = (spent: number, r: Partial<ReimburseRequest> = {}) =>
  ({ id: "RFD-1", type: "CLEARANCE", projectId: "P", categoryId: "C", status: "WAITING_ACCOUNTANT", totalAmount: spent, advanceRefId: "REQ-1", advanceAmount: 10_000, ...r }) as ReimburseRequest;
const project = { id: "P", categories: [{ id: "C", name: "หมวด", allocated: 50_000 }] } as Project;

test("ใช้น้อยกว่ายืม → คืนเงิน", () => {
  const s = getSettlement(clearance(8_000));
  assert.deepEqual([s.kind, s.refund, s.extra], ["REFUND", 2_000, 0]);
  assert.equal(settlementLabel(s), "คืน 2,000");
});

test("ใช้พอดี / ใช้เกิน", () => {
  assert.equal(getSettlement(clearance(10_000)).kind, "EXACT");
  const s = getSettlement(clearance(12_500));
  assert.deepEqual([s.kind, s.refund, s.extra], ["EXTRA", 0, 2_500]);
});

test("ข้อมูลเก่าที่ไม่มี advanceAmount → ค้นยอดยืมจากใบยืม", () => {
  const s = getSettlement(clearance(8_000, { advanceAmount: undefined }), () => advance());
  assert.equal(s.refund, 2_000);
});

test("สายอนุมัติใช้ยอดที่บริษัทต้องจ่ายเพิ่ม", () => {
  assert.equal(getInitialStatus("EMPLOYEE", getRoutingAmount(clearance(8_000))), "WAITING_ACCOUNTANT");
  assert.equal(getInitialStatus("EMPLOYEE", getRoutingAmount(clearance(10_000 + 20_000))), "WAITING_DEPT_HEAD");
  assert.equal(getInitialStatus("EMPLOYEE", getRoutingAmount(clearance(10_000 + 40_000))), "WAITING_EXECUTIVE");
  assert.equal(getRoutingAmount(advance()), 10_000);
});

test("งบ: ใบยืมที่จ่ายแล้วแต่ยังไม่เคลียร์ → นับยอดยืม · ใบคืนเงินที่ยังไม่เสร็จกันไว้เฉพาะส่วนเกิน", () => {
  const b = getCategoryBudget(project, "C", [advance(), clearance(12_000)]);
  assert.deepEqual([b.used, b.reserved, b.remaining], [10_000, 2_000, 38_000]);
});

test("งบ: เคลียร์เสร็จแล้ว → นับยอดใช้จริงครั้งเดียว เงินที่คืนกลับเป็นงบคงเหลือ", () => {
  const b = getCategoryBudget(project, "C", [advance(), clearance(8_000, { status: "COMPLETED" })]);
  assert.deepEqual([b.used, b.reserved, b.remaining], [8_000, 0, 42_000]);
  const extra = getCategoryBudget(project, "C", [advance(), clearance(12_000, { status: "COMPLETED" })]);
  assert.deepEqual([extra.used, extra.remaining], [12_000, 38_000]);
});

test("งบ: ใบคืนเงินที่ถูกส่งกลับ/ยกเลิก ไม่กระทบยอดใบยืม", () => {
  const b = getCategoryBudget(project, "C", [advance(), clearance(8_000, { status: "CANCELLED" })]);
  assert.deepEqual([b.used, b.reserved], [10_000, 0]);
});
