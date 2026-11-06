"use client";
/**
 * components/requests/RequestTable.tsx — ตารางคำขอที่ใช้ซ้ำได้ · เจ้าของ: คนที่ 1 (คนที่ 3, 4 ใช้ต่อได้)
 * -----------------------------------------------------------------------------
 * Props:
 *   requests       คำขอที่ "กรองแล้ว" (ตารางนี้ไม่กรอง/ไม่เรียงให้)
 *   user           ผู้ใช้ปัจจุบัน → ใช้คำนวณป้าย "รอคุณพิจารณา"
 *   showRequester  แสดงคอลัมน์ผู้ยื่น (หน้าอนุมัติ = true, คำขอของฉัน = false)
 *   actionLabel    ข้อความปุ่มท้ายแถว (ค่าเริ่มต้น "ดูรายละเอียด")
 *   hrefFor        (request) => ลิงก์ของปุ่มท้ายแถว (ค่าเริ่มต้น /requests/[id])
 *   emptyText      ข้อความตอนไม่มีข้อมูล
 *
 * @example
 * <RequestTable requests={mine} user={user} />
 * <RequestTable requests={pending} user={user} showRequester actionLabel="ตรวจสอบ" hrefFor={(r) => PATHS.approvalDetail(r.id)} />
 */
import { ButtonLink, StatusBadge, Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PATHS } from "@/config/routes";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { isMyTurn } from "@/lib/workflow";
import { getProjectById } from "@/store/projects";
import { getUserById } from "@/store/session";
import type { ReimburseRequest, User } from "@/types";

export function RequestTable({
  requests,
  user,
  showRequester = false,
  actionLabel = "ดูรายละเอียด",
  hrefFor = (r) => PATHS.requestDetail(r.id),
  emptyText = "ยังไม่มีคำขอ",
}: {
  requests: ReimburseRequest[];
  user: User;
  showRequester?: boolean;
  actionLabel?: string;
  hrefFor?: (request: ReimburseRequest) => string;
  emptyText?: string;
}) {
  const columns = showRequester ? 7 : 6;
  return (
    <Table>
      <THead>
        <TR>
          <TH>เลขที่คำขอ</TH>
          <TH>วันที่ยื่น</TH>
          {showRequester && <TH>ผู้ยื่น</TH>}
          <TH>โครงการ</TH>
          <TH align="right">จำนวนเงิน</TH>
          <TH align="center">สถานะ</TH>
          <TH align="right">
            <span className="sr-only">การดำเนินการ</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {requests.length === 0 && <TableEmpty colSpan={columns}>{emptyText}</TableEmpty>}
        {requests.map((r) => (
          <TR key={r.id}>
            <TD className="whitespace-nowrap font-medium">{r.id}</TD>
            <TD className="whitespace-nowrap">{formatThaiDate(r.createdAt)}</TD>
            {showRequester && <TD className="whitespace-nowrap">{getUserById(r.requesterId)?.name ?? r.requesterId}</TD>}
            <TD className="max-w-[280px]">
              <p className="truncate">{getProjectById(r.projectId)?.name ?? r.projectId}</p>
              <p className="truncate text-caption text-text-muted">{r.purpose}</p>
            </TD>
            <TD align="right" className="whitespace-nowrap font-medium">
              {formatBaht(r.totalAmount)}
            </TD>
            <TD align="center">
              <StatusBadge status={r.status} myTurn={isMyTurn(r, user)} />
            </TD>
            <TD align="right">
              <ButtonLink href={hrefFor(r)} variant="secondary" size="S">
                {actionLabel}
              </ButtonLink>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
