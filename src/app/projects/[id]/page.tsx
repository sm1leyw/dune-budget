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
import { ArrowLeft, Check, Download, ExternalLink, Eye, FileText, X } from "lucide-react";
import { PATHS } from "@/config/routes";
import { getCategoryBudget, getProjectBudget } from "@/lib/budget";
import { formatNumber, formatThaiDateLong } from "@/lib/format";
import { completeProject, useAdjustments, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { getUserById, useCurrentUser } from "@/store/session";

interface DocumentModalData {
  title: string;
  docType: string;
  fileSize: string;
  updatedAt: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useCurrentUser();
  const projects = useProjects();
  const requests = useRequests();
  const adjustments = useAdjustments();

  // State สำหรับเปิด/ปิด Popup ยืนยันเสร็จสิ้นโครงการ
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // State สำหรับเปิดดูไฟล์เอกสาร (PDF Viewer Modal)
  const [viewingDoc, setViewingDoc] = useState<DocumentModalData | null>(null);

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

  // ฟังก์ชันกดยืนยันเสร็จสิ้นโครงการ
  const handleConfirmComplete = () => {
    completeProject(project.id);
    setShowCompleteModal(false);
  };

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
          // แถบแจ้งเตือนสีเขียวมิ้นต์อ่อนเมื่อโครงการเสร็จสิ้นแล้ว (ตามรูป 100%)
          <div className="rounded-lg bg-[#E2F1EA] px-4 py-2 text-[12px] text-gray-700 shadow-sm">
            เสร็จสิ้นโครงการเมื่อ 30/11/2569 โดย {owner?.name ?? "สมหมาย ศรีสุข"} • งบคงเหลือ{" "}
            {formatNumber(budget.remaining)} บาท คืนเข้าส่วนกลางแล้ว • ไม่เปิดรับคำขอเบิกใหม่
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
          เพื่อจัดสัมมนาเพิ่มความภักดีลูกค้า • ผู้รับผิดชอบ {owner?.name ?? project.ownerId} - หัวหน้าแผนกการตลาด
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

          {/* สถานะโครงการ */}
          <div className="border-b border-gray-100 pb-3">
            <p className="text-gray-400">สถานะโครงการ</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-semibold text-[#007F5F]">
                {isCompleted ? "เสร็จสิ้นแล้ว" : "กำลังดำเนินการ"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setViewingDoc({
                    title: `รายงานสรุปสถานะ_${project.id}.pdf`,
                    docType: "เอกสารรายงานสถานะโครงการ",
                    fileSize: "1.2 MB",
                    updatedAt: "30 พ.ย. 2569",
                  })
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-gray-600 shadow-xs hover:border-[#007F5F] hover:text-[#007F5F] transition"
              >
                <FileText className="size-3 text-gray-400" /> ดูไฟล์
              </button>
            </div>
          </div>

          {/* รายละเอียดและวัตถุประสงค์ */}
          <div className="col-span-1 border-b border-gray-100 pb-3">
            <p className="text-gray-400">รายละเอียดและวัตถุประสงค์</p>
            <p className="mt-1 text-gray-700">{project.purpose}</p>
          </div>

          {/* เอกสารจัดตั้งโครงการ */}
          <div className="col-span-1 border-b border-gray-100 pb-3">
            <p className="text-gray-400">เอกสารจัดตั้งโครงการ</p>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setViewingDoc({
                    title: `TOR_ขอบเขตการดำเนินงาน_${project.id}.pdf`,
                    docType: "ข้อกำหนดและขอบเขตงาน (TOR)",
                    fileSize: "2.4 MB",
                    updatedAt: "1 พ.ย. 2569",
                  })
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-gray-600 shadow-xs hover:border-[#007F5F] hover:text-[#007F5F] transition"
              >
                <FileText className="size-3 text-gray-400" /> ดูไฟล์
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewingDoc({
                    title: `หนังสืออนุมัติจัดตั้งโครงการ_${project.id}.pdf`,
                    docType: "เอกสารคำสั่งอนุมัติโครงการ",
                    fileSize: "840 KB",
                    updatedAt: "28 ต.ค. 2569",
                  })
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-gray-600 shadow-xs hover:border-[#007F5F] hover:text-[#007F5F] transition"
              >
                <FileText className="size-3 text-gray-400" /> ดูไฟล์
              </button>
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
                        {formatNumber(req.totalAmount)} ฿
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-700">{requester?.name ?? "-"}</td>
                      <td className="py-3.5 pl-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-[#0284C7] px-3 py-0.5 text-[10px] font-medium text-white">
                          ● {req.status === "COMPLETED" ? "จ่ายแล้ว" : "อยู่ระหว่างพิจารณา"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPUP MODAL: แสดงตัวอย่างเอกสาร (Document Preview Modal) */}
      {/* ========================================================= */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header ของ Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/60">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[#D7ECE4] text-[#007F5F]">
                  <FileText className="size-5" />
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">{viewingDoc.title}</h3>
                  <p className="text-[11px] text-gray-500">
                    {viewingDoc.docType} • ขนาด {viewingDoc.fileSize} • วันที่ {viewingDoc.updatedAt}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* เนื้อหาจำลองของเอกสาร PDF */}
            <div className="p-6 bg-gray-100/70 max-h-[60vh] overflow-y-auto">
              <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-xs text-gray-800 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <p className="text-[14px] font-bold text-[#007F5F]">Dune Budget Sandworm</p>
                    <p className="text-[11px] text-gray-500">ระบบขอเบิกงบประมาณโครงการองค์กร</p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-[#007F5F] border border-emerald-200">
                    เอกสารลงนามอนุมัติแล้ว
                  </span>
                </div>

                <div className="space-y-2 text-[12px] leading-relaxed">
                  <p className="font-bold text-[13px] text-gray-900">
                    เรื่อง: {project.name} (รหัส {project.id})
                  </p>
                  <p className="text-gray-600">
                    เรียน ผู้บริหารและคณะกรรมการพิจารณางบประมาณ
                  </p>
                  <p className="text-gray-600 indent-6">
                    ตามที่หน่วยงาน {project.departments.join(", ")} ได้เสนอขออนุมัติโครงการ{" "}
                    <strong>{project.name}</strong> ภายใต้งบประมาณรวมจำนวน{" "}
                    <strong>{formatNumber(budget.allocated)} บาท</strong> โดยมีวัตถุประสงค์เพื่อ:{" "}
                    {project.purpose}
                  </p>
                  <p className="text-gray-600 indent-6">
                    การดำเนินโครงการมีกำหนดการตั้งแต่วันที่ {formatThaiDateLong(project.startDate)} ถึง{" "}
                    {formatThaiDateLong(project.endDate)} ผู้รับผิดชอบโครงการคือ{" "}
                    {owner?.name ?? "สมหมาย ศรีสุข"}
                  </p>
                </div>

                {/* ตารางสรุปหมวดในเอกสาร */}
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-[11px]">
                  <p className="font-semibold text-gray-700 mb-2">สรุปกรอบวงเงินตามหมวดค่าใช้จ่าย:</p>
                  <div className="space-y-1 text-gray-600">
                    {project.categories.map((c) => (
                      <div key={c.id} className="flex justify-between">
                        <span>• {c.name}</span>
                        <span className="font-medium">{formatNumber(c.allocated)} บาท</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ลายเซ็นจำลอง */}
                <div className="pt-6 flex justify-end text-center text-[11px] text-gray-600">
                  <div>
                    <div className="border-b border-gray-300 pb-1 mb-1 font-serif italic text-gray-400">
                      ( ลงนามอนุมัติเรียบร้อยทางอิเล็กทรอนิกส์ )
                    </div>
                    <p className="font-bold text-gray-800">{owner?.name ?? "สมหมาย ศรีสุข"}</p>
                    <p className="text-gray-500">หัวหน้าฝ่ายที่รับผิดชอบโครงการ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer ของ Modal */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3.5 bg-white">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Eye className="size-3.5" /> โหมดแสดงตัวอย่างเอกสาร
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert(`จำลองการดาวน์โหลดไฟล์: ${viewingDoc.title}`)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <Download className="size-3.5" /> ดาวน์โหลด
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-[#007F5F] px-4 text-[12px] font-medium text-white hover:bg-[#006a4f] transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP MODAL: ยืนยันเสร็จสิ้นโครงการ */}
      {/* ========================================================= */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* ไอคอนติ๊กถูกวงกลมสีเขียวด้านบน */}
            <div className="flex justify-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#D7ECE4] text-[#007F5F]">
                <Check className="size-6 stroke-[2.5]" />
              </span>
            </div>

            {/* หัวข้อ */}
            <h3 className="mt-4 text-center text-[16px] font-bold text-gray-900">
              ยืนยันเสร็จสิ้นโครงการ
            </h3>

            {/* ข้อความอธิบาย */}
            <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-500">
              {project.name} ({project.id}) — <br />
              เมื่อเสร็จสิ้นแล้วจะไม่สามารถยื่นคำขอเบิกใหม่ในโครงการนี้ได้ และงบคงเหลือ{" "}
              {formatNumber(budget.remaining)} บาท จะคืนเข้าส่วนกลางของแผนก
            </p>

            {/* กล่องสรุปเงื่อนไขติ๊กถูกสีเขียว */}
            <div className="mt-4 space-y-2 rounded-xl bg-[#F4F9F6] p-4 text-[11px] text-gray-700">
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-[#007F5F] stroke-[2.5]" />
                <span>ไม่มีคำขอที่รออนุมัติหรือรอทำจ่าย</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-[#007F5F] stroke-[2.5]" />
                <span>ไม่มีเงินยืมที่ค้างเคลียร์</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-[#007F5F] stroke-[2.5]" />
                <span>
                  สรุปยอด : งบอนุมัติ {formatNumber(budget.allocated)} • จ่ายจริง{" "}
                  {formatNumber(budget.used)} • คงเหลือ {formatNumber(budget.remaining)} บาท
                </span>
              </div>
            </div>

            {/* ปุ่ม ยกเลิก / ยืนยันเสร็จสิ้นโครงการ */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="h-8 rounded-md border border-gray-300 bg-white px-4 text-[12px] font-medium text-gray-700 transition hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="h-8 rounded-md bg-[#007F5F] px-4 text-[12px] font-medium text-white transition hover:bg-[#006a4f]"
              >
                ยืนยันเสร็จสิ้นโครงการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

