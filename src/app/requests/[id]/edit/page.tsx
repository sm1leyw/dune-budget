"use client";
/**
 * /requests/[id]/edit — แก้ไขคำขอที่ถูกส่งกลับ แล้วยื่นใหม่ · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * เข้าได้เฉพาะ canEdit(request, user) = เจ้าของคำขอ + สถานะ "ส่งกลับแก้ไข"
 * ยืนยันแล้ว → resubmitRequest() → กลับไปหน้ารายละเอียดคำขอ
 */
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { RequestForm, fromRequest, todayISO } from "@/components/request-form";
import { PATHS } from "@/config/routes";
import { canEdit } from "@/lib/workflow";
import { resubmitRequest, useRequest } from "@/store/requests";
import { useCurrentUser } from "@/store/session";

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>();
  const user = useCurrentUser();
  const router = useRouter();
  const request = useRequest(id);
  const [today] = useState(todayISO);
  if (!user) return null;

  if (!request || !canEdit(request, user)) {
    return (
      <Card>
        <EmptyState
          title={!request ? "ไม่พบคำขอนี้" : "แก้ไขคำขอนี้ไม่ได้"}
          description="แก้ไขได้เฉพาะคำขอของคุณที่ถูกส่งกลับแก้ไขเท่านั้น"
          action={
            <ButtonLink href={request ? PATHS.requestDetail(request.id) : PATHS.myRequests} variant="secondary" icon={<ArrowLeft />}>
              กลับ
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {request.sentBackNote && (
        <div role="note" className="flex gap-3 rounded-lg border-[1.5px] border-danger/30 bg-danger/5 p-5">
          <MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="text-body font-bold text-danger">เหตุผลที่ส่งกลับแก้ไข · {request.id}</p>
            <p className="mt-1 whitespace-pre-line text-body text-text">{request.sentBackNote}</p>
          </div>
        </div>
      )}
      <RequestForm
        // key: ถ้าข้อมูลคำขอเปลี่ยนจากที่อื่น ให้เริ่มฟอร์มใหม่จากข้อมูลล่าสุด
        key={request.updatedAt}
        user={user}
        today={today}
        initial={fromRequest(request)}
        requestId={request.id}
        editingId={request.id}
        submitLabel="ยืนยันและยื่นคำขออีกครั้ง"
        onSubmit={(input) => resubmitRequest(request.id, input, user).id}
        onSubmitted={(rid) => router.push(PATHS.requestDetail(rid))}
      />
    </div>
  );
}
