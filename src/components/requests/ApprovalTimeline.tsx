"use client";
/**
 * components/requests/ApprovalTimeline.tsx — ลำดับขั้นการอนุมัติของคำขอ · เจ้าของ: คนที่ 3 (ทุก role ใช้ร่วม)
 * -----------------------------------------------------------------------------
 * ตาม Figma "ตรวจสอบคำขอ" (การ์ดด้านขวา): ผู้ยื่นขอเบิก → (หัวหน้าแผนก) → (ผู้บริหาร) → บัญชีตรวจสอบและทำจ่าย
 * ขั้นที่ต้องผ่านคำนวณจาก lib/workflow (getInitialStatus + getStatusAfterApprove)
 * → ถ้าคนที่ 4 เปลี่ยนกติกา ไทม์ไลน์เปลี่ยนตามเอง ไม่ต้องแก้ไฟล์นี้
 *
 * Props:
 *   request   คำขอ 1 รายการ
 *
 * ส่งออกเพิ่ม: getTimelineSteps(request) ฟังก์ชันล้วน เผื่อหน้าอื่นอยากใช้ข้อมูลขั้นตอนเอง
 *
 * @example
 * <ApprovalTimeline request={request} />
 */
import { Check } from "lucide-react";
import { Card } from "@/components/ui";
import { EXECUTIVE_THRESHOLD } from "@/constants/approval";
import { cn } from "@/lib/cn";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { getApproverRole, getInitialStatus, getStatusAfterApprove } from "@/lib/workflow";
import { getUserById, USERS } from "@/store/session";
import type { ReimburseRequest, RequestEvent, UserRole } from "@/types";

export type TimelineState = "done" | "current" | "pending" | "sentBack";

export interface TimelineStep {
  key: string;
  role?: UserRole;
  label: string;
  state: TimelineState;
  /** บรรทัดเล็กใต้ชื่อขั้น เช่น "โดย : ธนพล ศรีสวัสดิ์ · 02/11/2569" */
  caption: string;
}

const STAGE_LABEL: Record<UserRole, string> = {
  EMPLOYEE: "ผู้ยื่นขอเบิก",
  DEPT_HEAD: "หัวหน้าแผนกอนุมัติ",
  EXECUTIVE: "ผู้บริหารอนุมัติ",
  ACCOUNTANT: "บัญชีตรวจสอบและทำจ่าย",
};

/** role ที่คำขอนี้ต้องผ่าน ตามกติกาใน lib/workflow เช่น ["DEPT_HEAD", "ACCOUNTANT"] */
function getRequiredStages(request: ReimburseRequest): UserRole[] {
  const requesterRole = getUserById(request.requesterId)?.role ?? "EMPLOYEE";
  const stages: UserRole[] = [];
  let status = getInitialStatus(requesterRole, request.totalAmount);
  for (let i = 0; i < 5; i++) {
    const role = getApproverRole(status);
    if (!role) break;
    stages.push(role);
    const next = getStatusAfterApprove(status);
    if (next === status) break;
    status = next;
  }
  return stages;
}

/** ชื่อคนที่ต้องพิจารณาขั้นนี้ (หัวหน้าแผนกเดียวกับผู้ยื่น / ผู้บริหาร / บัญชีที่ไม่ใช่ผู้ยื่น) */
function getApproverName(role: UserRole, request: ReimburseRequest): string {
  const requester = getUserById(request.requesterId);
  const candidates = USERS.filter((u) => u.role === role && u.id !== request.requesterId);
  const match =
    (role === "DEPT_HEAD" && candidates.find((u) => u.department === requester?.department)) || candidates[0];
  return match?.name ?? STAGE_LABEL[role];
}

const nameOf = (id?: string) => (id ? (getUserById(id)?.name ?? id) : "-");

/**
 * แปลงคำขอเป็นขั้นตอนของรอบปัจจุบัน (นับจากการยื่น/ยื่นใหม่ครั้งล่าสุด)
 * รับเข้า: คำขอ · ส่งออก: TimelineStep[] เรียงจากขั้นแรกไปขั้นสุดท้าย
 */
export function getTimelineSteps(request: ReimburseRequest): TimelineStep[] {
  const history = request.history;
  let roundStart = 0;
  history.forEach((e, i) => {
    if (e.action === "SUBMIT" || e.action === "RESUBMIT") roundStart = i;
  });
  const submit: RequestEvent | undefined = history[roundStart];
  const round = history.slice(roundStart + 1);
  const sendBack = [...round].reverse().find((e) => e.action === "SEND_BACK");
  const stopped = request.status === "SENT_BACK" || request.status === "CANCELLED";
  const currentRole = getApproverRole(request.status);

  const steps: TimelineStep[] = [
    {
      key: "submit",
      label: STAGE_LABEL.EMPLOYEE,
      state: "done",
      caption: `โดย : ${nameOf(submit?.byUserId ?? request.requesterId)} · ${formatThaiDate(submit?.at ?? request.createdAt)}`,
    },
  ];

  let stopMarked = false;
  let previous: UserRole | undefined;
  for (const role of getRequiredStages(request)) {
    const done = round.find(
      (e) => (e.action === "APPROVE" || e.action === "PAY") && getUserById(e.byUserId)?.role === role,
    );
    const waitText = role === "ACCOUNTANT" ? "รอผู้อนุมัติครบก่อน" : `รอ${previous ? STAGE_LABEL[previous] : "ขั้นตอนก่อนหน้า"}ก่อน`;

    if (done) {
      steps.push({ key: role, role, label: STAGE_LABEL[role], state: "done", caption: `${done.action === "PAY" ? "ทำจ่ายโดย" : "อนุมัติโดย"} : ${nameOf(done.byUserId)}` });
    } else if (stopped && !stopMarked) {
      stopMarked = true;
      steps.push({ key: role, role, label: STAGE_LABEL[role], state: "sentBack", caption: `ส่งกลับแก้ไขโดย : ${nameOf(sendBack?.byUserId)}` });
    } else if (!stopped && role === currentRole) {
      steps.push({ key: role, role, label: STAGE_LABEL[role], state: "current", caption: `รอ ${getApproverName(role, request)} พิจารณา` });
    } else {
      steps.push({ key: role, role, label: STAGE_LABEL[role], state: "pending", caption: waitText });
    }
    previous = role;
  }
  return steps;
}

export function ApprovalTimeline({ request }: { request: ReimburseRequest }) {
  const steps = getTimelineSteps(request);

  return (
    <Card className="border-[1.5px] border-primary/40">
      <p className="mb-5 font-medium text-text">ลำดับขั้นการอนุมัติ</p>
      <ol>
        {steps.map((step, index) => (
          <li key={step.key} className="relative flex gap-3 pb-7 last:pb-0">
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className={cn("absolute left-4 top-9 -ml-px h-[calc(100%-2.5rem)] w-0.5", step.state === "done" ? "bg-primary" : "bg-border")}
              />
            )}
            <span
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-bold [&_svg]:size-4",
                step.state === "done" && "bg-primary text-text-inverse",
                step.state === "current" && "border-2 border-warning bg-surface",
                step.state === "pending" && "border-[1.5px] border-border bg-surface text-text-muted",
                step.state === "sentBack" && "bg-danger text-text-inverse",
              )}
            >
              {step.state === "done" && <Check aria-hidden />}
              {step.state === "current" && <span aria-hidden className="size-2.5 rounded-full bg-warning" />}
              {step.state === "pending" && index + 1}
              {step.state === "sentBack" && "!"}
            </span>
            <div className="min-w-0 pt-1">
              <p className={cn("flex flex-wrap items-center gap-2 text-caption font-bold", step.state === "pending" ? "text-text-muted" : "text-text")}>
                {step.label}
                {step.role === "EXECUTIVE" && (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-badge font-medium text-primary">
                    ยอดเกิน {formatNumber(EXECUTIVE_THRESHOLD)}
                  </span>
                )}
              </p>
              <p
                className={cn(
                  "text-badge",
                  step.state === "done" && "text-primary",
                  step.state === "current" && "text-warning-strong",
                  step.state === "pending" && "text-text-muted",
                  step.state === "sentBack" && "text-danger",
                )}
              >
                {step.caption}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-badge text-text-muted">
        คำขอยอดเกิน {formatNumber(EXECUTIVE_THRESHOLD)} บาท ต้องผ่านการอนุมัติจากผู้บริหาร
      </p>
    </Card>
  );
}
