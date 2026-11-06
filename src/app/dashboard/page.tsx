"use client";
/**
 * /dashboard — หน้าหลักแยกตาม role · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * พนักงาน      : สรุปคำขอของฉัน + คำขอล่าสุด
 * หัวหน้า/ผู้บริหาร: "รอคุณพิจารณา" + คำขอของฉัน
 * บัญชี         : "รอทำจ่าย" + งบรวมทุกโครงการ
 * ข้อมูลทั้งหมดมาจาก store (useRequests, useProjects) — เปลี่ยนใน store แล้วหน้านี้อัปเดตเอง
 */
import { useMemo } from "react";
import { Plus } from "lucide-react";
import { ButtonLink, Card, StatCard } from "@/components/ui";
import { PageActions } from "@/components/layout/PageActions";
import { RequestTable } from "@/components/requests/RequestTable";
import { PATHS } from "@/config/routes";
import { IN_PROGRESS_STATUSES } from "@/constants/status";
import { getProjectBudget } from "@/lib/budget";
import { formatNumber } from "@/lib/format";
import { isMyTurn } from "@/lib/workflow";
import { useAdjustments, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { useCurrentUser } from "@/store/session";
import type { ReimburseRequest, User } from "@/types";

const newestFirst = (a: ReimburseRequest, b: ReimburseRequest) => b.createdAt.localeCompare(a.createdAt);

export default function DashboardPage() {
  const user = useCurrentUser();
  const requests = useRequests();
  if (!user) return null; // AppFrame กันไว้แล้ว บรรทัดนี้แค่ให้ TypeScript รู้ว่า user ไม่เป็น null

  return (
    <div className="space-y-6">
      <PageActions description={`สวัสดี คุณ${user.name} · ${user.department}`}>
        <ButtonLink href={PATHS.newRequest} icon={<Plus />}>
          ยื่นขอเบิกเงิน
        </ButtonLink>
      </PageActions>
      {user.role === "EMPLOYEE" && <EmployeeDashboard user={user} requests={requests} />}
      {(user.role === "DEPT_HEAD" || user.role === "EXECUTIVE") && <ApproverDashboard user={user} requests={requests} />}
      {user.role === "ACCOUNTANT" && <AccountantDashboard user={user} requests={requests} />}
    </div>
  );
}

/** สรุปคำขอของผู้ใช้เอง (ใช้ทุก role) */
function useMyStats(user: User, requests: ReimburseRequest[]) {
  return useMemo(() => {
    const mine = requests.filter((r) => r.requesterId === user.id).sort(newestFirst);
    return {
      mine,
      inProgress: mine.filter((r) => IN_PROGRESS_STATUSES.includes(r.status)).length,
      sentBack: mine.filter((r) => r.status === "SENT_BACK").length,
      paidAmount: mine.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + r.totalAmount, 0),
    };
  }, [requests, user.id]);
}

function EmployeeDashboard({ user, requests }: { user: User; requests: ReimburseRequest[] }) {
  const { mine, inProgress, sentBack, paidAmount } = useMyStats(user, requests);
  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="คำขอทั้งหมด" value={mine.length} unit="รายการ" />
        <StatCard label="กำลังดำเนินการ" value={inProgress} unit="รายการ" />
        <StatCard label="ส่งกลับแก้ไข" value={sentBack} unit="รายการ" highlight={sentBack > 0} hint={sentBack > 0 ? "แก้ไขแล้วยื่นใหม่ได้" : undefined} />
        <StatCard label="ได้รับเงินแล้ว" value={formatNumber(paidAmount)} unit="บาท" />
      </div>
      <Card
        title="คำขอล่าสุด"
        padding="none"
        actions={
          <ButtonLink href={PATHS.myRequests} variant="secondary" size="S">
            ดูทั้งหมด
          </ButtonLink>
        }
      >
        <div className="px-2 pb-2">
          <RequestTable requests={mine.slice(0, 5)} user={user} emptyText="ยังไม่มีคำขอ กด 'ยื่นขอเบิกเงิน' เพื่อเริ่ม" />
        </div>
      </Card>
    </>
  );
}

function ApproverDashboard({ user, requests }: { user: User; requests: ReimburseRequest[] }) {
  const { mine, inProgress } = useMyStats(user, requests);
  const pending = useMemo(() => requests.filter((r) => isMyTurn(r, user)).sort(newestFirst), [requests, user]);
  const reviewed = useMemo(
    () => requests.filter((r) => r.history.some((h) => h.byUserId === user.id && h.action !== "SUBMIT" && h.action !== "RESUBMIT")).length,
    [requests, user.id],
  );
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="รอคุณพิจารณา" value={pending.length} unit="รายการ" highlight={pending.length > 0} />
        <StatCard label="พิจารณาแล้ว" value={reviewed} unit="รายการ" />
        <StatCard label="คำขอของฉันที่กำลังดำเนินการ" value={inProgress} unit={`จาก ${mine.length} รายการ`} />
      </div>
      <Card
        title="รอคุณพิจารณา"
        padding="none"
        actions={
          <ButtonLink href={PATHS.approvals} variant="secondary" size="S">
            ดูทั้งหมด
          </ButtonLink>
        }
      >
        <div className="px-2 pb-2">
          <RequestTable
            requests={pending.slice(0, 5)}
            user={user}
            showRequester
            actionLabel="ตรวจสอบ"
            hrefFor={(r) => PATHS.approvalDetail(r.id)}
            emptyText="ไม่มีคำขอที่รอคุณพิจารณา"
          />
        </div>
      </Card>
    </>
  );
}

function AccountantDashboard({ user, requests }: { user: User; requests: ReimburseRequest[] }) {
  const projects = useProjects();
  const adjustments = useAdjustments();
  const pending = useMemo(() => requests.filter((r) => isMyTurn(r, user)).sort(newestFirst), [requests, user]);
  const total = useMemo(
    () =>
      projects
        .filter((p) => p.status === "ACTIVE")
        .map((p) => getProjectBudget(p, requests, adjustments))
        .reduce((acc, b) => ({ allocated: acc.allocated + b.allocated, remaining: acc.remaining + b.remaining }), { allocated: 0, remaining: 0 }),
    [projects, requests, adjustments],
  );
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="รอทำจ่าย" value={pending.length} unit="รายการ" highlight={pending.length > 0} />
        <StatCard label="โครงการที่ดำเนินการอยู่" value={activeProjects} unit="โครงการ" />
        <StatCard label="งบรวม" value={formatNumber(total.allocated)} unit="บาท" />
        <StatCard label="งบคงเหลือ" value={formatNumber(total.remaining)} unit="บาท" hint="หักยอดที่จ่ายแล้วและรออนุมัติ" />
      </div>
      <Card
        title="รายการรอทำจ่าย"
        padding="none"
        actions={
          <ButtonLink href={PATHS.approvals} variant="secondary" size="S">
            ดูทั้งหมด
          </ButtonLink>
        }
      >
        <div className="px-2 pb-2">
          <RequestTable
            requests={pending.slice(0, 5)}
            user={user}
            showRequester
            actionLabel="ตรวจสอบ"
            hrefFor={(r) => PATHS.approvalDetail(r.id)}
            emptyText="ไม่มีรายการรอทำจ่าย"
          />
        </div>
      </Card>
    </>
  );
}
