"use client";
/**
 * /requests/[id] — ตรวจสอบคำขอ (เจ้าของ: คนที่ 3) · ตาม Figma "พนักงาน → ตรวจสอบ"
 * -----------------------------------------------------------------------------
 * - แสดงคำขอด้วย <RequestDetail> (ข้อมูล ลำดับขั้นการอนุมัติ ยอดเงิน เอกสารแนบ)
 * - ดูได้เฉพาะเจ้าของคำขอ (ผู้อนุมัติ/บัญชีดูผ่าน /approvals/[id])
 * - คำขอที่ยกเลิกแล้วถือว่าหายไป → แสดงเหมือนไม่พบคำขอ
 * - ถูกส่งกลับแก้ไข → ปุ่ม "ยกเลิกคำขอ" (danger) · "กลับไปหน้าหลัก" · "แก้ไขคำขอ" (ไปหน้าของคนที่ 2)
 * - ยกเลิกคำขอ → ConfirmModal → cancelRequest(id, user) → กลับไปหน้าคำขอของฉัน
 */
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, ButtonLink, Card, ConfirmModal, EmptyState } from "@/components/ui";
import { RequestDetail } from "@/components/requests/RequestDetail";
import { PATHS } from "@/config/routes";
import { formatBaht } from "@/lib/format";
import { canCancel, canEdit } from "@/lib/workflow";
import { cancelRequest, useRequest } from "@/store/requests";
import { useCurrentUser } from "@/store/session";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const request = useRequest(id);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const backButton = (
    <ButtonLink href={PATHS.dashboard} variant="secondary">
      กลับไปหน้าหลัก
    </ButtonLink>
  );

  if (!request || request.requesterId !== user.id || request.status === "CANCELLED") {
    return (
      <Card>
        <EmptyState
          title="ไม่พบคำขอนี้"
          description={`ไม่พบคำขอเลขที่ ${id} หรือคำขอนี้ไม่ใช่ของคุณ`}
          action={
            <ButtonLink href={PATHS.myRequests} variant="secondary">
              ไปที่คำขอของฉัน
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  const handleCancel = () => {
    setSaving(true);
    setError("");
    try {
      cancelRequest(request.id, user);
      setConfirmOpen(false);
      router.push(PATHS.myRequests);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <>
      {error && (
        <p role="alert" className="mb-4 rounded-md border-[1.5px] border-danger bg-danger/5 p-3 text-danger">
          {error}
        </p>
      )}

      <RequestDetail
        request={request}
        actions={
          <>
            {canCancel(request, user) && (
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                ยกเลิกคำขอ
              </Button>
            )}
            {backButton}
            {canEdit(request, user) && <ButtonLink href={PATHS.editRequest(request.id)}>แก้ไขคำขอ</ButtonLink>}
          </>
        }
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleCancel}
        tone="danger"
        loading={saving}
        title="ยกเลิกคำขอนี้ใช่ไหม?"
        description={`คำขอ ${request.id} (${formatBaht(request.totalAmount)}) จะถูกยกเลิกและหายไปจากรายการ แก้ไขต่อไม่ได้ หากต้องการเบิกใหม่ต้องสร้างคำขอใหม่`}
        confirmLabel="ยกเลิกคำขอ"
        cancelLabel="ไม่ใช่ กลับ"
      >
        <p className="text-badge text-text-muted">ยกเลิกได้เฉพาะคำขอที่ถูกส่งกลับแก้ไข</p>
      </ConfirmModal>
    </>
  );
}
