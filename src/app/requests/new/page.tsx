"use client";
/**
 * /requests/new — ยื่นขอเบิกเงิน (ตาราง A) / ยื่นคืนเงิน (ตาราง B) · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * หน้านี้แค่เตรียมค่าเริ่มต้น แล้วส่งให้ <RequestForm> ทำงานต่อ
 * ยืนยันแล้ว → createRequest() (store ของคนที่ 3) → ไปหน้ารายละเอียดคำขอ
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequestForm, emptyForm, todayISO } from "@/components/request-form";
import { PATHS } from "@/config/routes";
import { createRequest, nextRequestId } from "@/store/requests";
import { useCurrentUser } from "@/store/session";

export default function NewRequestPage() {
  const user = useCurrentUser();
  const router = useRouter();
  // คำนวณครั้งเดียวตอนเปิดหน้า (ไม่เปลี่ยนระหว่างกรอก)
  const [today] = useState(todayISO);
  const [previewId] = useState(() => nextRequestId());
  if (!user) return null;

  return (
    <RequestForm
      user={user}
      today={today}
      initial={emptyForm(today)}
      requestId={previewId}
      onSubmit={(input) => createRequest(input, user).id}
      onSubmitted={(id) => router.push(PATHS.requestDetail(id))}
    />
  );
}
