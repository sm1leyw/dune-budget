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
import { ArrowLeft, Check, FileText } from "lucide-react";
import { PATHS } from "@/config/routes";
import { getCategoryBudget, getProjectBudget } from "@/lib/budget";
import { formatNumber, formatThaiDateLong } from "@/lib/format";
import { completeProject, getProjectById, useAdjustments } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { getUserById, useCurrentUser } from "@/store/session";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useCurrentUser();
  const requests = useRequests();
  const adjustments = useAdjustments();

  // State สำหรับเปิด/ปิด Popup ยืนยันเสร็จสิ้นโครงการ
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // ดึงข้อมูลโครงการตาม id
  const project = useMemo(() => getProjectById(id), [id]);

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

  // ฟังก์ชันกดยืนยันเสร็จสิ้นโครงการ
  const handleConfirmComplete = () => {
    completeProject(project.id);
    setShowCompleteModal(false);
  };

  return (
    <div className="min-h-full space-y-6 pb-12">
      {/* แถบ Action ด้านบน: ปุ่มกลับ (ซ้าย) + ปุ่มเสร็จสิ้นโครงการ & ปรับปรุงงบ (ขวา) */}
      <div className="flex items-center justify-between">
        <Link
          href={PATHS.projects}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="size-3.5" />
          กลับหน้ารายการ
        </Link>

        {isAccountant && (
          <div className="flex items-center gap-2">
            {project.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => setShowCompleteModal(true)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[#007F5F] bg-white px-3.5 text-[12px] font-medium text-[#007F5F] transition hover:bg-[#007F5F]/5"
              >
                เสร็จสิ้นโครงการ
              </button>
            )}
            <Link
              href={PATHS.adjustProject(project.id)}
              className="inline-flex h-8 items-center justify-center rounded-md bg-[#007F5F] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#006a4f]"
            >
              + สร้างคำขอเบิก
            </Link>
          </div>
        )}
      </div>

      {/* Card ที่ 1: หัวข้อโครงการ + 4 Stat Cards สรุปงบ */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-[18px] font-bold text-gray-900">{project.name}</h2>
        <p className="mt-1 text-[12px] text-gray-500">
          รหัสงบประมาณโครงการจากฝ่ายบัญชี • ผู้รับผิดชอบงบประมาณ: {owner?.name ?? project.ownerId} •
          กรอบวัตถุประสงค์โครงการ
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
            <p className="text-[12px] font-medium text-gray-600">จำนวนเงินจองที่รอใช้/จ่าย</p>
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
            <p className="mt-1 font-semibold text-[#007F5F]">
              {project.status === "ACTIVE" ? "กำลังดำเนินการ" : "เสร็จสิ้นแล้ว"}
            </p>
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
              <span className="inline-flex items-center gap-1 rounded bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200">
                <FileText className="size-3 text-gray-400" /> TOR.pdf
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200">
                <FileText className="size-3 text-gray-400" /> อนุมัติ.pdf
              </span>
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
      {/* POPUP MODAL: ยืนยันเสร็จสิ้นโครงการ (ตรงตามรูป Figma 100%) */}
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
