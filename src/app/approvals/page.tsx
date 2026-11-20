"use client";
/**
 * /approvals — รออนุมัติ / ประวัติการอนุมัติ · เจ้าของ: คนที่ 4 · เข้าได้: หัวหน้าแผนก, ผู้บริหาร, บัญชี
 * -----------------------------------------------------------------------------
 * - <Tabs>: "รออนุมัติ (n)" = คำขอที่ isMyTurn(req, user) · "ประวัติ" = คำขอที่ผู้ใช้เคยอนุมัติ/ทำจ่าย/ส่งกลับ
 *   (บัญชีใช้ชื่อแท็บ "รอทำจ่าย" / "ประวัติการทำจ่าย")
 * - <FilterBar>: ค้นหาเลขที่/ชื่อโครงการ/ชื่อผู้ขอ · กรองโครงการ · ช่วงวันที่ยื่น
 * - แถวตาราง: ปุ่ม "ตรวจสอบ" → /approvals/[id]
 */
import { useMemo, useState } from "react";
import { ButtonLink, Card, FilterBar, StatusBadge, Table, TableEmpty, Tabs, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PATHS } from "@/config/routes";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { isMyTurn } from "@/lib/workflow";
import { getCategoryName, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { getUserById, useCurrentUser } from "@/store/session";
import type { ReimburseRequest, User } from "@/types";

type TabKey = "pending" | "history";

/** การกระทำที่นับเป็น "ผู้ใช้คนนี้พิจารณาแล้ว" */
const REVIEW_ACTIONS = new Set(["APPROVE", "PAY", "SEND_BACK"]);

const newestFirst = (a: ReimburseRequest, b: ReimburseRequest) => b.createdAt.localeCompare(a.createdAt);

/** เวลาล่าสุดที่ผู้ใช้คนนี้พิจารณาคำขอ (ใช้เรียงแท็บประวัติ) */
function lastReviewedAt(request: ReimburseRequest, user: User): string {
  return [...request.history].reverse().find((h) => h.byUserId === user.id && REVIEW_ACTIONS.has(h.action))?.at ?? "";
}

export default function ApprovalsPage() {
  const user = useCurrentUser();
  const requests = useRequests();
  const projects = useProjects();

  const [tab, setTab] = useState<TabKey>("pending");
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /** คำขอที่ผ่านตัวกรอง (ยังไม่แยกแท็บ) */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter((r) => !projectId || r.projectId === projectId)
      .filter((r) => {
        const day = r.createdAt.slice(0, 10);
        return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
      })
      .filter((r) => {
        if (!q) return true;
        const projectName = projects.find((p) => p.id === r.projectId)?.name ?? "";
        const requesterName = getUserById(r.requesterId)?.name ?? "";
        return [r.id, projectName, requesterName, r.purpose].some((text) => text.toLowerCase().includes(q));
      });
  }, [requests, projects, search, projectId, dateFrom, dateTo]);

  const pending = useMemo(() => (user ? filtered.filter((r) => isMyTurn(r, user)).sort(newestFirst) : []), [filtered, user]);

  const history = useMemo(() => {
    if (!user) return [];
    return filtered
      .filter((r) => r.history.some((h) => h.byUserId === user.id && REVIEW_ACTIONS.has(h.action)))
      .sort((a, b) => lastReviewedAt(b, user).localeCompare(lastReviewedAt(a, user)));
  }, [filtered, user]);

  if (!user) return null;

  const isAccountant = user.role === "ACCOUNTANT";
  const labels: Record<TabKey, string> = {
    pending: isAccountant ? "รอทำจ่าย" : "รออนุมัติ",
    history: isAccountant ? "ประวัติการทำจ่าย" : "ประวัติการพิจารณา",
  };
  const rows = tab === "pending" ? pending : history;
  const hasFilter = !!(search || projectId || dateFrom || dateTo);

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "pending", label: labels.pending, count: pending.length },
          { value: "history", label: labels.history, count: history.length },
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหาเลขที่คำขอ ชื่อโครงการ หรือชื่อผู้ขอ"
        filters={[
          {
            key: "project",
            label: "โครงการ",
            value: projectId,
            onChange: setProjectId,
            options: projects.map((p) => ({ value: p.id, label: p.name })),
          },
        ]}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
        }}
        onClear={() => {
          setSearch("");
          setProjectId("");
          setDateFrom("");
          setDateTo("");
        }}
      />

      <Card padding="none">
        <div className="px-2 pb-2 pt-4">
          <Table>
            <THead>
              <TR>
                <TH>เลขที่คำขอ</TH>
                <TH>โครงการ / หมวด</TH>
                <TH>ผู้ขอเบิก</TH>
                <TH>วันที่ยื่น</TH>
                <TH align="right">จำนวนเงิน (บาท)</TH>
                <TH align="center">สถานะ</TH>
                <TH align="right">
                  <span className="sr-only">การดำเนินการ</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {rows.length === 0 && (
                <TableEmpty colSpan={7}>
                  {hasFilter ? "ไม่พบคำขอที่ตรงกับตัวกรอง" : tab === "pending" ? `ไม่มีรายการ${labels.pending}` : "ยังไม่มีประวัติการพิจารณา"}
                </TableEmpty>
              )}
              {rows.map((r) => {
                const project = projects.find((p) => p.id === r.projectId);
                const requester = getUserById(r.requesterId);
                return (
                  <TR key={r.id}>
                    <TD className="whitespace-nowrap font-medium">{r.id}</TD>
                    <TD className="max-w-[200px]">
                      <p className="truncate">{project?.name ?? r.projectId}</p>
                      <p className="truncate text-caption text-text-muted">{getCategoryName(project, r.categoryId)}</p>
                    </TD>
                    <TD className="max-w-[170px]">
                      <p className="truncate">{requester?.name ?? r.requesterId}</p>
                      <p className="truncate text-caption text-text-muted">{requester?.department ?? ""}</p>
                    </TD>
                    <TD className="whitespace-nowrap">{formatThaiDate(r.createdAt)}</TD>
                    <TD align="right" className="whitespace-nowrap font-medium">
                      {formatNumber(r.totalAmount)}
                    </TD>
                    <TD align="center">
                      <StatusBadge status={r.status} myTurn={isMyTurn(r, user)} />
                    </TD>
                    <TD align="right">
                      <ButtonLink href={PATHS.approvalDetail(r.id)} size="S" variant={tab === "pending" ? "primary" : "secondary"}>
                        ตรวจสอบ
                      </ButtonLink>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
