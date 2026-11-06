/**
 * lib/workflow.test.ts — ตัวอย่าง unit test ของกติกาการอนุมัติ (เจ้าของ: คนที่ 4)
 * รันด้วย:  npm test
 * ใช้ test runner ที่มากับ Node (node:test) ไม่ต้องติดตั้งอะไรเพิ่ม
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getInitialStatus, getStatusAfterApprove, isMyTurn, canCancel } from "./workflow";
import type { ReimburseRequest, User } from "../types";

test("พนักงานยื่น: แบ่งตามยอด 5,000 / 30,000", () => {
  assert.equal(getInitialStatus("EMPLOYEE", 5_000), "WAITING_ACCOUNTANT");
  assert.equal(getInitialStatus("EMPLOYEE", 5_001), "WAITING_DEPT_HEAD");
  assert.equal(getInitialStatus("EMPLOYEE", 30_000), "WAITING_DEPT_HEAD");
  assert.equal(getInitialStatus("EMPLOYEE", 30_001), "WAITING_EXECUTIVE");
});

test("หัวหน้าและผู้บริหารยื่น", () => {
  assert.equal(getInitialStatus("DEPT_HEAD", 30_000), "WAITING_ACCOUNTANT");
  assert.equal(getInitialStatus("DEPT_HEAD", 30_001), "WAITING_EXECUTIVE");
  assert.equal(getInitialStatus("EXECUTIVE", 999_999), "WAITING_ACCOUNTANT");
});

test("อนุมัติแล้วไปขั้นถัดไป", () => {
  assert.equal(getStatusAfterApprove("WAITING_DEPT_HEAD"), "WAITING_ACCOUNTANT");
  assert.equal(getStatusAfterApprove("WAITING_EXECUTIVE"), "WAITING_ACCOUNTANT");
  assert.equal(getStatusAfterApprove("WAITING_ACCOUNTANT"), "COMPLETED");
  assert.equal(getStatusAfterApprove("SENT_BACK"), "SENT_BACK");
});

const accountant: User = { id: "A1", name: "บัญชี", email: "a@x", role: "ACCOUNTANT", department: "บัญชี", position: "" };
const base = { requesterId: "E1", status: "WAITING_ACCOUNTANT" } as ReimburseRequest;

test("isMyTurn: ถึงตาบัญชี แต่ห้ามทำจ่ายของตัวเอง", () => {
  assert.equal(isMyTurn(base, accountant), true);
  assert.equal(isMyTurn({ ...base, requesterId: "A1" }, accountant), false);
});

test("ยกเลิกได้เฉพาะคำขอของตัวเองที่ถูกส่งกลับ", () => {
  const employee: User = { ...accountant, id: "E1", role: "EMPLOYEE" };
  assert.equal(canCancel({ ...base, status: "SENT_BACK" }, employee), true);
  assert.equal(canCancel({ ...base, status: "WAITING_DEPT_HEAD" }, employee), false);
});
