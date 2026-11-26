/**
 * lib/projectClosure.test.ts — กติกาการเสร็จสิ้นโครงการ · รันด้วย npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getCompletionBlockers, getEventKind } from "./projectClosure";
import type { ReimburseRequest } from "../types";

const req = (r: Partial<ReimburseRequest>) => ({ projectId: "P1", type: "ADVANCE", status: "COMPLETED", ...r }) as ReimburseRequest;

test("ไม่มีงานค้าง → เสร็จสิ้นได้", () => {
  const requests = [
    req({ id: "A1" }),
    req({ id: "B1", type: "CLEARANCE", advanceRefId: "A1" }),
    req({ id: "X", status: "CANCELLED" }),
    req({ id: "OTHER", projectId: "P2", status: "WAITING_ACCOUNTANT" }),
  ];
  assert.equal(getCompletionBlockers("P1", requests).canComplete, true);
});

test("คำขอรออนุมัติ / รอทำจ่าย และคำขอที่ถูกส่งกลับ → ขวาง", () => {
  const b = getCompletionBlockers("P1", [
    req({ id: "W1", status: "WAITING_DEPT_HEAD" }),
    req({ id: "W2", status: "WAITING_ACCOUNTANT", type: "CLEARANCE" }),
    req({ id: "S1", status: "SENT_BACK" }),
  ]);
  assert.deepEqual(b.pending.map((r) => r.id), ["W1", "W2"]);
  assert.deepEqual(b.sentBack.map((r) => r.id), ["S1"]);
  assert.equal(b.canComplete, false);
});

test("เงินยืมที่จ่ายแล้วแต่ใบเคลียร์ยังไม่จ่ายเสร็จ → ค้างเคลียร์", () => {
  const b = getCompletionBlockers("P1", [
    req({ id: "A1" }),
    req({ id: "B1", type: "CLEARANCE", advanceRefId: "A1", status: "CANCELLED" }),
  ]);
  assert.deepEqual(b.unclearedAdvances.map((r) => r.id), ["A1"]);
  assert.equal(b.canComplete, false);
});

test("ประเภทรายการในประวัติ (รองรับข้อมูลเก่าที่ไม่มี kind)", () => {
  assert.equal(getEventKind({ id: "CREATE-1" }), "CREATE");
  assert.equal(getEventKind({ id: "ADJ-1" }), "ADJUST");
  assert.equal(getEventKind({ id: "CLOSE-1", kind: "COMPLETE" }), "COMPLETE");
});
