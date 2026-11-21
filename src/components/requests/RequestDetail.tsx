"use client";
/**
 * components/requests/RequestDetail.tsx — รายละเอียดคำขอ 1 รายการ · เจ้าของ: คนที่ 3 (ทุก role ใช้ร่วม)
 * -----------------------------------------------------------------------------
 * ตาม Figma "ตรวจสอบคำขอ":
 *   แถวบน   ข้อมูลคำขอ (ซ้าย) + ลำดับขั้นการอนุมัติ (ขวา)
 *   ต่อมา    หมายเหตุการส่งกลับแก้ไข (ถ้ามี) → ยอดเงิน → ข้อมูลเอกสารแนบ → ข้อมูลการทำจ่าย/รับเงินคืน (ถ้ามี)
 *   คำขอคืนเงิน: แถบยอดเงินแสดง "ยอดเงินที่คืน" / "ยอดที่บริษัทจ่ายเพิ่ม" / "ใช้พอดี"
 *               พร้อมสรุป ยอดยืม − ใช้จริง และวิธีคืนเงิน (คำนวณด้วย lib/clearance.ts)
 *   ล่างขวา  ปุ่มที่หน้าเรียกใช้ส่งมา
 *
 * Props:
 *   request    คำขอ 1 รายการ (จาก useRequest(id))
 *   actions    ปุ่มด้านล่างขวา เรียง: ปุ่มอันตราย → ปุ่มรอง → ปุ่มหลัก
 *   children   เนื้อหาเพิ่มก่อนแถวปุ่ม เช่น ฟอร์มทำจ่ายของบัญชี (คนที่ 4)
 *
 * @example
 * // หน้า /requests/[id] (คนที่ 3)
 * <RequestDetail request={request} actions={<ButtonLink href={PATHS.dashboard} variant="secondary">กลับไปหน้าหลัก</ButtonLink>} />
 * // หน้า /approvals/[id] (คนที่ 4)
 * <RequestDetail request={request} actions={<><Button variant="danger">ส่งกลับแก้ไข</Button><Button>อนุมัติ</Button></>}>
 *   <Card title="ข้อมูลการทำจ่าย">…</Card>
 * </RequestDetail>
 */
import type { ReactNode } from "react";
import { AttachmentChip, Card, InfoBox, Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/components/ui";
import { ROLE_LABEL } from "@/constants/roles";
import { REFUND_METHOD_LABEL } from "@/constants/request";
import { getSettlement } from "@/lib/clearance";
import { formatBaht, formatNumber, formatThaiDate } from "@/lib/format";
import { getCategoryName, useProjects } from "@/store/projects";
import { getRequestById } from "@/store/requests";
import { getUserById } from "@/store/session";
import type { PaymentInfo, ReimburseRequest, RequestType } from "@/types";
import { ApprovalTimeline } from "./ApprovalTimeline";

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  ADVANCE: "คำขอเบิก",
  CLEARANCE: "คำขอคืนเงิน",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentInfo["method"], string> = {
  CASH: "เงินสด",
  CHECK: "เช็ค",
  TRANSFER: "โอนผ่านธนาคาร",
};

/** "ป้าย : ค่า" แบบใน Figma (ป้ายสีจาง ค่าตัวหนา) */
function InfoRow({ label, children, bold = true }: { label: string; children: ReactNode; bold?: boolean }) {
  return (
    <p className="min-w-0 break-words text-text">
      <span className="text-text-muted">{label} : </span>
      <span className={bold ? "font-bold" : undefined}>{children}</span>
    </p>
  );
}

export function RequestDetail({
  request,
  actions,
  children,
}: {
  request: ReimburseRequest;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const projects = useProjects();
  const project = projects.find((p) => p.id === request.projectId);
  const requester = getUserById(request.requesterId);
  const lastSendBack = [...request.history].reverse().find((e) => e.action === "SEND_BACK");
  const sendBackBy = lastSendBack ? getUserById(lastSendBack.byUserId) : undefined;
  const payment = request.paymentInfo;
  const settlement = request.type === "CLEARANCE" ? getSettlement(request, getRequestById) : undefined;
  const isRefundReceipt = payment?.direction === "REFUND_RECEIVED"; // ข้อมูลรูปแบบเก่า (บัญชีเคยบันทึกการรับเงินคืนเอง)
  // คำขอคืนเงินที่มียอดคืน: พนักงานแนบสลิปเอง · บัญชีกดยืนยันรับเงิน (เหตุการณ์ PAY ล่าสุด)
  const refundConfirm =
    settlement?.kind === "REFUND" && request.status === "COMPLETED"
      ? [...request.history].reverse().find((e) => e.action === "PAY")
      : undefined;

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <InfoRow label="รหัสคำขอ">{request.id}</InfoRow>
            <InfoRow label="วันที่ยื่น">{formatThaiDate(request.createdAt)}</InfoRow>
            <InfoRow label={settlement ? "ผู้ยื่นคืนเงิน" : "ผู้ยื่นขอเบิก"}>{requester?.name ?? request.requesterId}</InfoRow>
            <InfoRow label="แผนก">{requester?.department ?? "-"}</InfoRow>
            <InfoRow label="ประเภทแบบฟอร์ม">{REQUEST_TYPE_LABEL[request.type]}</InfoRow>
            <InfoRow label="ช่วงระยะเวลาดำเนินการ" bold={false}>
              {request.startDate ? formatThaiDate(request.startDate) : "-"} ถึง {request.endDate ? formatThaiDate(request.endDate) : "-"}
            </InfoRow>
            <InfoRow label="ชื่อโครงการ">{project?.name ?? request.projectId}</InfoRow>
            <InfoRow label="หมวดหมู่">{getCategoryName(project, request.categoryId)}</InfoRow>
            {request.advanceRefId && <InfoRow label="อ้างอิงคำขอเบิก">{request.advanceRefId}</InfoRow>}
            {settlement && (
              <InfoRow label="วิธีการคืนเงิน">
                {settlement.kind === "REFUND"
                  ? request.refundMethod
                    ? REFUND_METHOD_LABEL[request.refundMethod]
                    : "-"
                  : settlement.kind === "EXTRA"
                    ? "ไม่ต้องคืน (บริษัทจ่ายส่วนต่างให้)"
                    : "ไม่ต้องคืน (ใช้พอดี)"}
              </InfoRow>
            )}
          </div>
          <p className="mb-3 mt-6 font-bold text-text">รายละเอียด/วัตถุประสงค์ :</p>
          <InfoBox className="min-h-[88px] whitespace-pre-wrap text-caption">{request.purpose || "-"}</InfoBox>
        </Card>

        <ApprovalTimeline request={request} />
      </div>

      {request.status === "SENT_BACK" && (
        <div role="alert" className="rounded-md border-[1.5px] border-danger/30 bg-danger/5 px-5 py-4">
          <p className="text-caption font-bold text-danger">
            หมายเหตุการส่งกลับแก้ไข
            {sendBackBy && ` · โดย ${sendBackBy.name} (${ROLE_LABEL[sendBackBy.role]})`}
            {lastSendBack && ` · ${formatThaiDate(lastSendBack.at)}`}
          </p>
          <p className="mt-1 text-caption text-text">{request.sentBackNote ?? lastSendBack?.note ?? "-"}</p>
        </div>
      )}

      {settlement ? (
        <div className="rounded-lg bg-primary px-8 py-7 text-text-inverse">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-section font-bold">
              {settlement.kind === "REFUND" ? "ยอดเงินที่คืน" : settlement.kind === "EXTRA" ? "ยอดที่บริษัทจ่ายเพิ่ม" : "ใช้พอดีกับยอดยืม"}
            </span>
            <span className="text-[28px] font-bold leading-tight">
              {formatBaht(settlement.kind === "REFUND" ? settlement.refund : settlement.extra)}
            </span>
          </div>
          <p className="mt-1 text-caption opacity-90">
            ยอดยืม ({request.advanceRefId}) {formatBaht(settlement.borrowed)} − ใช้จ่ายจริงตามใบเสร็จ {formatBaht(settlement.spent)}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary px-8 py-7 text-text-inverse">
          <span className="text-section font-bold">ยอดเงินขอเบิก</span>
          <span className="text-[28px] font-bold leading-tight">{formatBaht(request.totalAmount)}</span>
        </div>
      )}

      <Card>
        <p className="mb-2 text-caption font-bold text-text">{settlement ? "ใบเสร็จค่าใช้จ่ายจริง" : "ข้อมูลเอกสารแนบ"}</p>
        <Table>
          <THead>
            <TR>
              <TH>รายการ</TH>
              <TH>วันที่</TH>
              <TH>จำนวนเงิน</TH>
              <TH>เอกสารแนบ</TH>
            </TR>
          </THead>
          <TBody>
            {request.items.length === 0 && <TableEmpty colSpan={4}>ไม่มีรายการ</TableEmpty>}
            {request.items.map((item) => (
              <TR key={item.id}>
                <TD>{item.name}</TD>
                <TD className="whitespace-nowrap">{item.date ? formatThaiDate(item.date) : "-"}</TD>
                <TD className="whitespace-nowrap">{formatNumber(item.amount)}</TD>
                <TD>
                  <AttachmentChip name={item.fileName} data={item.fileData} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {settlement?.kind === "REFUND" && (
        <Card>
          <p className="mb-2 text-caption font-bold text-text">ข้อมูลการคืนเงินของพนักงาน</p>
          <Table>
            <THead>
              <TR>
                <TH>วิธีคืนเงิน</TH>
                <TH>จำนวนเงิน</TH>
                <TH>หลักฐานการคืน</TH>
                <TH>การยืนยันของบัญชี</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD>{request.refundMethod ? REFUND_METHOD_LABEL[request.refundMethod] : "-"}</TD>
                <TD className="whitespace-nowrap">{formatNumber(settlement.refund)}</TD>
                <TD>
                  {request.refundMethod === "CASH" ? (
                    <span className="text-caption text-text-muted">คืนเป็นเงินสด</span>
                  ) : (
                    <AttachmentChip name={request.refundSlip?.name} data={request.refundSlip?.data} />
                  )}
                </TD>
                <TD className="text-caption">
                  {refundConfirm ? (
                    <span className="text-primary">
                      รับเงินแล้ว · {getUserById(refundConfirm.byUserId)?.name ?? refundConfirm.byUserId} · {formatThaiDate(refundConfirm.at)}
                    </span>
                  ) : (
                    <span className="text-text-muted">รอบัญชีตรวจสอบ</span>
                  )}
                </TD>
              </TR>
            </TBody>
          </Table>
        </Card>
      )}

      {payment && (
        <Card>
          <p className="mb-2 text-caption font-bold text-text">
            {isRefundReceipt ? "ข้อมูลการรับเงินคืน" : settlement ? "ข้อมูลการจ่ายส่วนต่าง" : "ข้อมูลการทำจ่าย"}
          </p>
          <Table>
            <THead>
              <TR>
                <TH>{isRefundReceipt ? "วิธีที่รับเงิน" : "วิธีการจ่าย"}</TH>
                <TH>วันที่</TH>
                <TH>จำนวนเงิน</TH>
                <TH>เอกสารแนบ</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD>
                  {PAYMENT_METHOD_LABEL[payment.method]}
                  {payment.refNumber && <p className="text-badge text-text-muted">เลขอ้างอิง {payment.refNumber}</p>}
                </TD>
                <TD className="whitespace-nowrap">{formatThaiDate(payment.date)}</TD>
                <TD className="whitespace-nowrap">{formatNumber(payment.amount)}</TD>
                <TD>
                  <AttachmentChip name={payment.fileName} data={payment.fileData} />
                </TD>
              </TR>
            </TBody>
          </Table>
        </Card>
      )}

      {children}

      {actions && <div className="flex flex-wrap justify-end gap-4">{actions}</div>}
    </div>
  );
}
