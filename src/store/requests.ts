/**
 * store/requests.ts — ข้อมูลคำขอเบิก (เจ้าของ: คนที่ 3)
 * -----------------------------------------------------------------------------
 * คนที่ 1 วางโครงให้ คนที่ 3 ดูแลต่อ — ห้ามเปลี่ยนชื่อฟังก์ชันที่ส่งออกโดยไม่แจ้งทีม
 *
 * ส่งออก:
 *   requestsStore                      store ดิบ (ใช้ใน store อื่น เช่น approvals.ts)
 *   useRequests()                      hook → ReimburseRequest[] ทั้งหมด (ไม่รวมที่ยกเลิกแล้ว)
 *   getRequestById(id)                 → ReimburseRequest | undefined (ข้อมูลดิบ รวมที่ยกเลิก — ใช้ตอนแก้ข้อมูล)
 *   useRequest(id)                     hook → ReimburseRequest | undefined (ยกเลิกแล้ว = undefined)
 *   createRequest(input, user)         → ReimburseRequest ที่สร้าง (คนที่ 2 เรียกตอนกดยืนยัน)
 *   resubmitRequest(id, input, user)   → แก้ไขแล้วยื่นใหม่ (คนที่ 2 ใช้ในหน้าแก้ไข)
 *   cancelRequest(id, user)            → ยกเลิกคำขอ (ได้เฉพาะตอนถูกส่งกลับ)
 *
 * คำขอที่ยกเลิกแล้ว "หายไป" จากทุกหน้า (ตาม Figma) แต่ยังเก็บใน requestsStore
 * เพื่อไม่ให้รหัสคำขอถูกใช้ซ้ำ
 *
 * ทุกฟังก์ชันที่แก้ข้อมูลจะ "โยน Error" ถ้าทำไม่ได้ → หน้าจอควร try/catch แล้วแสดงข้อความ
 */
import { useMemo } from "react";
import { createPersistentStore } from "@/lib/createStore";
import { canCancel, canEdit, getInitialStatus } from "@/lib/workflow";
import { nowISO } from "@/lib/format";
import { INITIAL_REQUESTS } from "@/data/mock/requests";
import type { ExpenseItem, ReimburseRequest, User, RefundMethod } from "@/types";

export const requestsStore = createPersistentStore<ReimburseRequest[]>("dune_requests", INITIAL_REQUESTS);

/** ข้อมูลที่ฟอร์มต้องส่งมา (ระบบเติม id, ผู้ยื่น, สถานะ, วันที่ ให้เอง) */
export type RequestInput = Pick<
  ReimburseRequest,
  "type" | "projectId" | "categoryId" | "purpose" | "startDate" | "endDate" | "advanceRefId" | "refundMethod"
> & { items: ExpenseItem[] };

/** hook: คำขอทั้งหมดที่ยังไม่ถูกยกเลิก (กรองต่อด้วย useMemo ในหน้าของตัวเอง) */
export function useRequests(): ReimburseRequest[] {
  const all = requestsStore.useState();
  return useMemo(() => all.filter((r) => r.status !== "CANCELLED"), [all]);
}

/** หาคำขอจาก id — รับเข้า: "REQ-2026-0001" · ส่งออก: คำขอ หรือ undefined */
export function getRequestById(id: string): ReimburseRequest | undefined {
  return requestsStore.getState().find((r) => r.id === id);
}

/** hook: คำขอ 1 รายการ (อัปเดตเองเมื่อสถานะเปลี่ยน · ยกเลิกแล้วคืน undefined เหมือนไม่พบ) */
export function useRequest(id: string): ReimburseRequest | undefined {
  const all = useRequests();
  return useMemo(() => all.find((r) => r.id === id), [all, id]);
}

/** สร้างรหัสคำขอถัดไป เช่น "REQ-2026-0006" (ไม่ซ้ำแม้มีคำขอถูกยกเลิก) */
export function nextRequestId(year = new Date().getFullYear()): string {
  const max = requestsStore
    .getState()
    .map((r) => Number(r.id.split("-").pop()))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `REQ-${year}-${String(max + 1).padStart(4, "0")}`;
}

const sumItems = (items: ExpenseItem[]) => items.reduce((sum, i) => sum + i.amount, 0);

/**
 * ยื่นคำขอใหม่
 * รับเข้า: ข้อมูลจากฟอร์ม, ผู้ใช้ที่ login
 * ส่งออก: คำขอที่สร้าง (สถานะแรกคำนวณจาก lib/workflow.ts)
 */
export function createRequest(input: RequestInput, user: User): ReimburseRequest {
  const time = nowISO();
  const totalAmount = sumItems(input.items);
  const request: ReimburseRequest = {
    ...input,
    id: nextRequestId(),
    requesterId: user.id,
    totalAmount,
    status: getInitialStatus(user.role, totalAmount),
    createdAt: time,
    updatedAt: time,
    history: [{ action: "SUBMIT", byUserId: user.id, at: time }],
  };
  requestsStore.setState((prev) => [request, ...prev]);
  return request;
}

/**
 * แก้ไขคำขอที่ถูกส่งกลับ แล้วยื่นใหม่
 * รับเข้า: id, ข้อมูลใหม่จากฟอร์ม, ผู้ใช้ที่ login
 * ส่งออก: คำขอหลังแก้ · โยน Error ถ้าไม่ใช่เจ้าของหรือไม่ได้อยู่ในสถานะส่งกลับแก้ไข
 */
export function resubmitRequest(id: string, input: RequestInput, user: User): ReimburseRequest {
  const current = getRequestById(id);
  if (!current || !canEdit(current, user)) throw new Error("แก้ไขคำขอนี้ไม่ได้");
  const time = nowISO();
  const totalAmount = sumItems(input.items);
  const updated: ReimburseRequest = {
    ...current,
    ...input,
    totalAmount,
    status: getInitialStatus(user.role, totalAmount),
    sentBackNote: undefined,
    updatedAt: time,
    history: [...current.history, { action: "RESUBMIT", byUserId: user.id, at: time }],
  };
  requestsStore.setState((prev) => prev.map((r) => (r.id === id ? updated : r)));
  return updated;
}

/**
 * ยกเลิกคำขอ (ได้เฉพาะคำขอของตัวเองที่ถูกส่งกลับแก้ไข)
 * รับเข้า: id, ผู้ใช้ที่ login · โยน Error ถ้าทำไม่ได้
 */
export function cancelRequest(id: string, user: User): void {
  const current = getRequestById(id);
  if (!current || !canCancel(current, user)) throw new Error("ยกเลิกคำขอนี้ไม่ได้");
  const time = nowISO();
  requestsStore.setState((prev) =>
    prev.map((r) =>
      r.id === id
        ? { ...r, status: "CANCELLED", updatedAt: time, history: [...r.history, { action: "CANCEL", byUserId: user.id, at: time }] }
        : r,
    ),
  );
}
