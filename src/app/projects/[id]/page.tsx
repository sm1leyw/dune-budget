/**
 * /projects/[id] — เจ้าของ: คนที่ 5
 * หน้าชั่วคราว: สิ่งที่ต้องทำเขียนไว้ใน config/routes.ts (แสดงบนหน้าจอด้วย)
 * เริ่มทำ: ลบ <PagePlaceholder /> แล้วเขียนหน้าจริงแทน
 *
 * อ่าน id จาก URL ด้วย useParams (หน้าเป็น client component):
 *   const { id } = useParams<{ id: string }>();
 *   const request = useRequest(id);   // หรือ getProjectById(id) สำหรับหน้าโครงการ
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { PATHS } from "@/config/routes";
import { getCategoryBudget, getProjectBudget } from "@/lib/budget";
import { getProjectAttachments } from "@/lib/files";
import { AttachmentChip, StatusBadge } from "@/components/ui";
import { formatNumber, formatThaiDate, formatThaiDateLong } from "@/lib/format";
import { getCompletionBlockers } from "@/lib/projectClosure";
import { useAdjustments, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { getUserById, useCurrentUser } from "@/store/session";
import { CompleteProjectModal, ReopenProjectModal } from "./_components/ProjectClosureModals";
import { RequestAmount } from "@/components/requests/RequestAmount";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useCurrentUser();
  const projects = useProjects();
  const requests = useRequests();
  const adjustments = useAdjustments();

  // State สำหรับเปิด/ปิด Popup ยืนยันเสร็จสิ้นโครงการ
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [showReopenModal, setShowReopenModal] = useState(false);

  // ดึงข้อมูลโครงการจาก reactive projectsStore ผ่าน useProjects()
  const project = useMemo(() => {
    return projects.find((p) => p.id === id);
  }, [projects, id]);

  // คำนวณงบรวมโครงการสำหรับ 4 กล่องด้านบน
  const budget = useMemo(() => {
    if (!project) return null;
    return getProjectBudget(project, requests, adjustments);
  }, [project, requests, adjustments]);

  // คำขอเบิกเงินที่เกี่ยวข้องกับโครงการนี้
  const projectRequests = useMemo(() => {
    if (!project) return [];
    return requests.filter((r) => r.projectId === project.id);
  }, [project, requests]);

  // เงื่อนไขการเสร็จสิ้นโครงการ (คำขอค้าง / เงินยืมค้างเคลียร์)
  const blockers = useMemo(() => getCompletionBlockers(id, requests), [id, requests]);

  // รายการเสร็จสิ้นล่าสุดในประวัติ (เก็บไฟล์หลักฐานไว้)
  const completionRecord = useMemo(
    () => adjustments.find((a) => a.id === project?.completion?.recordId),
    [adjustments, project],
  );

  const owner = project ? getUserById(project.ownerId) : undefined;
  const isAccountant = user?.role === "ACCOUNTANT";

  if (!project || !budget) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        <p>ไม่พบข้อมูลโครงการ</p>
        <Link
          href={PATHS.projects}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#007F5F] hover:underline"
        >
          <ArrowLeft className="size-4" /> กลับหน้ารายการโครงการ
        </Link>
      </div>
    );
  }

  const isCompleted = project.status === "COMPLETED";

  const completion = project.completion;
  const closedBy = completion ? getUserById(completion.byUserId)?.name ?? completion.byUserId : "";
  const closureFiles = completionRecord?.attachments ?? [];

  return (
    <div className="min-h-full space-y-6 pb-12">
      {/* แถบ Action ด้านบน: ปุ่มกลับ (ซ้าย) + แถบสถานะเสร็จสิ้น / ปุ่มเสร็จสิ้นโครงการ (ขวา) */}
      <div className="flex items-center justify-between">
        <Link
          href={PATHS.projects}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="size-3.5" />
          กลับหน้ารายการ
        </Link>

        {isCompleted ? (
          // แถบแจ้งเตือนสีเขียวมิ้นต์อ่อนเมื่อโครงการเสร็จสิ้นแล้ว (ตาม Figma) + ปุ่มเปิดโครงการอีกครั้ง (บัญชี)
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#E2F1EA] px-4 py-2 text-[12px] text-gray-700 shadow-sm">
              เสร็จสิ้นโครงการ
              {completion ? ` เมื่อ ${formatThaiDate(completion.at)} โดย ${closedBy}` : ""} • งบคงเหลือ{" "}
              {formatNumber(completion?.remaining ?? budget.remaining)} บาท คืนเข้างบกลางแล้ว • ไม่เปิดรับคำขอเบิกใหม่
            </div>
            {isAccountant && (
              <button
                type="button"
                onClick={() => setShowReopenModal(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-[12px] font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <RotateCcw className="size-3.5" /> เปิดโครงการอีกครั้ง
              </button>
            )}
          </div>
        ) : (
          isAccountant && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(true)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[#007F5F] bg-white px-3.5 text-[12px] font-medium text-[#007F5F] transition hover:bg-[#007F5F]/5"
              >
                เสร็จสิ้นโครงการ
              </button>
              <Link
                href={PATHS.adjustProject(project.id)}
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#007F5F] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#006a4f]"
              >
                + สร้างคำขอเบิก
              </Link>
            </div>
          )
        )}
      </div>

      {/* Card ที่ 1: หัวข้อโครงการ + Badge สถานะ + 4 Stat Cards สรุปงบ */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[18px] font-bold text-gray-900">{project.name}</h2>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#007F5F]/30 bg-[#E2F1EA] px-2.5 py-0.5 text-[11px] font-semibold text-[#007F5F]">
              <Check className="size-3 stroke-[2.5]" /> เสร็จสิ้นแล้ว
            </span>
          )}
        </div>
        <p className="mt-1 text-[12px] text-gray-500">
          {project.purpose} • ผู้รับผิดชอบ {owner?.name ?? project.ownerId}
          {owner?.department ? ` - ${owner.department}` : ""}
        </p>

        {/* 4 กล่องสรุปงบ สีเขียวมิ้นต์ #D7ECE4 ตัวเลขสี #007F5F */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="rounded-xl bg-[#D7ECE4] px-5 py-5">
            <p className="text-[12px] font-medium text-gray-600">งบอนุมัติ</p>
            <p className="mt-2 text-[24px] font-bold tracking-tight text-[#007F5F]">
              {formatNumber(budget.allocated)}{" "}
              <span className="text-[18px] font-bold">฿</span>
            </p>
          </div>

          <div className="rounded-xl bg-[#D7ECE4] px-5 py-5">
            <p className="text-[12px] font-medium text-gray-600">จ่ายจริง</p>
            <p className="mt-2 text-[24px] font-bold tracking-tight text-[#007F5F]">
              {formatNumber(budget.used)}{" "}
              <span className="text-[18px] font-bold">฿</span>
            </p>
          </div>

          <div className="rounded-xl bg-[#D7ECE4] px-5 py-5">
            <p className="text-[12px] font-medium text-gray-600">กันวงเงินคำขอที่ยังไม่จ่าย</p>
            <p className="mt-2 text-[24px] font-bold tracking-tight text-[#007F5F]">
              {formatNumber(budget.reserved)}{" "}
              <span className="text-[18px] font-bold">฿</span>
            </p>
          </div>

          <div className="rounded-xl bg-[#D7ECE4] px-5 py-5">
            <p className="text-[12px] font-medium text-gray-600">งบพร้อมใช้</p>
            <p className="mt-2 text-[24px] font-bold tracking-tight text-[#007F5F]">
              {formatNumber(budget.remaining)}{" "}
              <span className="text-[18px] font-bold">฿</span>
            </p>
          </div>
        </div>
      </div>

      {/* Card ที่ 2: งบประมาณตามหมวด */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-[14px] font-bold text-gray-900">งบประมาณตามหมวด</h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="pb-3 font-normal">หมวดย่อย</th>
                <th className="pb-3 text-center font-normal">งบ</th>
                <th className="pb-3 text-center font-normal">จ่ายจริง</th>
                <th className="pb-3 text-center font-normal">ยอดจองรอจ่าย</th>
                <th className="pb-3 text-center font-normal">คงเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {project.categories.map((cat) => {
                const catBudget = getCategoryBudget(project, cat.id, requests, adjustments);
                return (
                  <tr key={cat.id} className="hover:bg-gray-50/40">
                    <td className="py-3.5 pr-4 font-medium text-gray-800">{cat.name}</td>
                    <td className="py-3.5 px-3 text-center text-gray-600">
                      {formatNumber(catBudget.allocated)} ฿
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-600">
                      {formatNumber(catBudget.used)} ฿
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-600">
                      {formatNumber(catBudget.reserved)} ฿
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-gray-800">
                      {formatNumber(catBudget.remaining)} ฿
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card ที่ 3: รายละเอียดข้อมูลโครงการ (2 คอลัมน์) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-[14px] font-bold text-gray-900">รายละเอียด</h3>

        <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-5 text-[12px]">
          {/* รหัสโครงการ */}
          <div className="border-b border-gray-100 pb-3">
            <p className="text-gray-400">รหัสโครงการ</p>
            <p className="mt-1 font-semibold text-gray-800">{project.id}</p>
          </div>

          {/* ปีงบประมาณ */}
          <div className="border-b border-gray-100 pb-3">
            <p className="text-gray-400">ปีงบประมาณ</p>
            <p className="mt-1 font-semibold text-gray-800">2569</p>
          </div>

          {/* หน่วยงานหรือแผนกเจ้าของโครงการ */}
          <div className="border-b border-gray-100 pb-3">
            <p className="text-gray-400">หน่วยงานหรือแผนกเจ้าของโครงการ</p>
            <p className="mt-1 font-semibold text-gray-800">
              {project.departments.join(", ")}
            </p>
          </div>

          {/* ผู้รับผิดชอบโครงการ */}
          <div className="border-b border-gray-100 pb-3">
            <p className="text-gray-400">ผู้รับผิดชอบโครงการ</p>
            <p className="mt-1 font-semibold text-gray-800">{owner?.name ?? "-"}</p>
          </div>

          {/* ช่วงเวลาดำเนินโครงการ */}
          <div className="border-b border-gray-100 pb-3">
            <p className="text-gray-400">ช่วงเวลาดำเนินโครงการ</p>
            <p className="mt-1 font-semibold text-gray-800">
              {formatThaiDateLong(project.startDate)} - {formatThaiDateLong(project.endDate)}
            </p>
          </div>

          {/* สถานะโครงการ + หลักฐานการปิดโครงการ (ตาม Figma: ปุ่มดูไฟล์ข้างสถานะ) */}
          <div className="border-b border-gray-100 pb-3">
            <p className="text-gray-400">สถานะโครงการ</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#007F5F]">
                {isCompleted ? "เสร็จสิ้นแล้ว" : "กำลังดำเนินการ"}
              </span>
              {isCompleted &&
                closureFiles.map((doc) => (
                  <AttachmentChip key={doc.name} name={doc.name} data={doc.data} className="text-[11px]" />
                ))}
            </div>
            {isCompleted && completion?.note && (
              <p className="mt-1 text-[11px] text-gray-500">หมายเหตุการปิด: {completion.note}</p>
            )}
          </div>

          {/* รายละเอียดและวัตถุประสงค์ */}
          <div className="col-span-1 border-b border-gray-100 pb-3">
            <p className="text-gray-400">รายละเอียดและวัตถุประสงค์</p>
            <p className="mt-1 text-gray-700">{project.purpose}</p>
          </div>

          {/* เอกสารจัดตั้งโครงการ */}
          <div className="col-span-1 border-b border-gray-100 pb-3">
            <p className="text-gray-400">เอกสารจัดตั้งโครงการ</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {getProjectAttachments(project).length === 0 ? (
                <span className="text-gray-400">ไม่มีไฟล์แนบ</span>
              ) : (
                getProjectAttachments(project).map((doc) => (
                  <AttachmentChip key={doc.name} name={doc.name} data={doc.data} className="text-[11px]" />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card ที่ 4: ประวัติการขอเบิกงบของโครงการนี้ */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-[14px] font-bold text-gray-900">ประวัติการขอเบิกงบของโครงการนี้</h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="pb-3 font-normal">วันที่</th>
                <th className="pb-3 text-center font-normal">หมวด</th>
                <th className="pb-3 text-center font-normal">จำนวน</th>
                <th className="pb-3 text-center font-normal">ผู้ขอ</th>
                <th className="pb-3 text-center font-normal">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projectRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    ยังไม่มีประวัติการเบิกจ่ายในโครงการนี้
                  </td>
                </tr>
              ) : (
                projectRequests.map((req) => {
                  const requester = getUserById(req.requesterId);
                  const cat = project.categories.find((c) => c.id === req.categoryId);

                  return (
                    <tr key={req.id} className="hover:bg-gray-50/40">
                      <td className="py-3.5 pr-4 text-gray-700">{formatThaiDateLong(req.createdAt)}</td>
                      <td className="py-3.5 px-3 text-center text-gray-700">{cat?.name ?? "-"}</td>
                      <td className="py-3.5 px-3 text-center text-gray-700">
                        <RequestAmount request={req} className="items-center" /> ฿
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-700">{requester?.name ?? "-"}</td>
                      <td className="py-3.5 pl-3 text-center">
                        {/* ใช้ป้ายสถานะกลาง จะได้เห็นคำขอที่ส่งกลับ/ยกเลิกถูกต้อง (เดิมแสดงแค่ จ่ายแล้ว / อยู่ระหว่างพิจารณา) */}
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP: ยืนยันเสร็จสิ้นโครงการ / เปิดโครงการอีกครั้ง (ฝ่ายบัญชี) */}
      {isAccountant && user && (
        <>
          <CompleteProjectModal
            open={showCompleteModal}
            onClose={() => setShowCompleteModal(false)}
            project={project}
            budget={budget}
            blockers={blockers}
            userId={user.id}
          />
          <ReopenProjectModal open={showReopenModal} onClose={() => setShowReopenModal(false)} project={project} userId={user.id} />
        </>
      )}
    </div>
  );
}

