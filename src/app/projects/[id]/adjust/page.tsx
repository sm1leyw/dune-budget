/**
 * /projects/[id]/adjust — เจ้าของ: คนที่ 5
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
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, FileText, Info, X } from "lucide-react";
import { PATHS } from "@/config/routes";
import { getCategoryBudget } from "@/lib/budget";
import { adjustBudget, useAdjustments, useProjects } from "@/store/projects";
import { useCurrentUser } from "@/store/session";

export default function AdjustBudgetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const projects = useProjects();
  const adjustments = useAdjustments();

  const project = useMemo(() => {
    return projects.find((p) => p.id === id);
  }, [projects, id]);

  // ฟอร์ม State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(id ?? "");
  const [adjustType, setAdjustType] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [fileList, setFileList] = useState<string[]>([]);
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const [reason, setReason] = useState<string>(
    "เนื่องจากสถิติล็อกอินหลักชักนำเราจึงต้องถอนงบในทุนวิสถูออกไปส่วนรายละเอียด มีอยู่ในไฟล์ที่แนบไว้ให้ครับ"
  );
  const [error, setError] = useState<string>("");

  // หมวดหมู่ในโครงการที่เลือก
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) ?? project;
  }, [projects, selectedProjectId, project]);

  const categories = currentProject?.categories ?? [];

  // จัดการอัปโหลดไฟล์หลายไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newNames = Array.from(files).map((file) => file.name);
      setFileList((prev) => Array.from(new Set([...prev, ...newNames])));
      setFileInputKey((prev) => prev + 1);
    }
  };

  const handleRemoveFile = (targetName: string) => {
    setFileList((prev) => prev.filter((name) => name !== targetName));
  };

  // ยืนยันการปรับปรุงงบประมาณ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentProject) {
      setError("กรุณาเลือกโครงการ");
      return;
    }
    if (!categoryId) {
      setError("กรุณาเลือกหมวดหมู่ย่อยที่ต้องการปรับงบ");
      return;
    }
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)");
      return;
    }
    if (!reason.trim()) {
      setError("กรุณาระบุเหตุผลการดำเนิน");
      return;
    }
    if (fileList.length === 0) {
      setError("กรุณาแนบเอกสารอนุมัติอย่างน้อย 1 ไฟล์");
      return;
    }

    // ตรวจสอบงบปัจจุบันของหมวดก่อนปรับลด เพื่อไม่ให้ยอดติดลบ
    if (adjustType === "DECREASE") {
      const categoryBudget = getCategoryBudget(currentProject, categoryId, [], adjustments);
      if (numAmount > categoryBudget.allocated) {
        setError(`ไม่สามารถลดงบเกินยอดปัจจุบันได้ (เหลือ ${categoryBudget.allocated.toLocaleString()} บาท)`);
        return;
      }
    }

    const finalAmount = adjustType === "DECREASE" ? -numAmount : numAmount;

    adjustBudget({
      projectId: currentProject.id,
      categoryId,
      amount: finalAmount,
      reason: reason.trim(),
      byUserId: user?.id ?? "USR-004",
    });

    // กลับไปหน้ารายละเอียดโครงการ
    router.push(PATHS.projectDetail(currentProject.id));
  };

  return (
    <div className="min-h-full space-y-6 pb-12">
      {/* การ์ดฟอร์มหลัก — ใช้ชื่อหน้าเพียงครั้งเดียวในหัวการ์ด */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* หัวข้อภายในการ์ด */}
        <div className="border-b border-gray-100 px-8 py-5">
          <h2 className="text-[14px] font-bold text-gray-800">
            ปรับปรุงงบประมาณโครงการ (ฝ่ายบัญชี)
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* กล่องแจ้งเตือนสีเขียวมิ้นต์อ่อน */}
          <div className="flex items-center gap-2 rounded-lg border border-[#007F5F]/40 bg-[#E8F5EF]/60 px-4 py-3 text-[12px] text-gray-700">
            <Info className="size-4 shrink-0 text-[#007F5F]" />
            <span>
              การปรับเพิ่มหรือลดงบประมาณ ต้องแนบเอกสารคำสั่งที่ได้รับการอนุมัติแล้วเท่านั้น
            </span>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-[12px] text-red-600">
              {error}
            </div>
          )}

          {/* แถวที่ 1: โครงการที่ต้องการปรับปรุง + รูปแบบการปรับปรุง */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                โครงการที่ต้องการปรับปรุง
              </label>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setCategoryId("");
                  }}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-[12px] text-gray-800 focus:border-[#007F5F] focus:outline-none"
                >
                  <option value="">-- เลือกโครงการ --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                รูปแบบการปรับปรุง
              </label>
              <div className="relative">
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as "INCREASE" | "DECREASE")}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-[12px] text-gray-800 focus:border-[#007F5F] focus:outline-none"
                >
                  <option value="INCREASE">เพิ่มงบประมาณ (+)</option>
                  <option value="DECREASE">ลดงบประมาณ (-)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* แถวที่ 2: จำนวนเงินที่ต้องการปรับ (บาท) + เลือกหมวดหมู่ย่อยที่ต้องการปรับงบ */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                จำนวนเงินที่ต้องการปรับ (บาท)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ระบุจำนวนเงิน เช่น 50,000"
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[12px] text-gray-800 placeholder:text-gray-400 focus:border-[#007F5F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                เลือกหมวดหมู่ย่อยที่ต้องการปรับงบ
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-[12px] text-gray-800 focus:border-[#007F5F] focus:outline-none"
                >
                  <option value="">-- เลือกหมวดหมู่ย่อย --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (งบเดิม: {cat.allocated.toLocaleString()} บาท)
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* แถวที่ 3: แนบไฟล์เอกสารอนุมัติ (.pdf .jpg .png)* */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              แนบไฟล์เอกสารอนุมัติ (.pdf .jpg .png)<span className="text-red-500">*</span>
            </label>
            <div className="rounded-lg border border-gray-200 bg-white p-2">
              <div className="flex items-center gap-3">
                <label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#007F5F] bg-white px-3 py-1 text-[11px] font-medium text-[#007F5F] hover:bg-[#007F5F]/5">
                  เลือกไฟล์เพิ่ม
                  <input
                    key={fileInputKey}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-gray-400">
                  {fileList.length === 0
                    ? "แนบได้หลายไฟล์ (PDF, JPG, PNG ไม่เกิน 10 MB ต่อไฟล์)"
                    : `แนบแล้ว ${fileList.length} ไฟล์`}
                </span>
              </div>

              {fileList.length > 0 && (
                <div className="mt-2 grid gap-1.5 border-t border-gray-100 pt-2">
                  {fileList.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between rounded-md bg-[#F4F9F6] px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 truncate text-[#007F5F]">
                        <FileText className="size-3.5 shrink-0" />
                        <span className="truncate">{file}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file)}
                        className="ml-2 inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium text-red-500 hover:bg-red-50"
                        title={`ลบ ${file}`}
                      >
                        <X className="size-3.5" /> ลบ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* แถวที่ 4: เหตุผลการดำเนิน */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              เหตุผลการดำเนิน
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white p-3.5 text-[12px] text-gray-800 placeholder:text-gray-400 focus:border-[#007F5F] focus:outline-none"
            />
          </div>

          {/* ปุ่ม ยกเลิก / ยืนยันการปรับงบประมาณ */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href={currentProject ? PATHS.projectDetail(currentProject.id) : PATHS.projects}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-5 text-[12px] font-medium text-gray-700 transition hover:bg-gray-50"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-[#007F5F] px-5 text-[12px] font-medium text-white transition hover:bg-[#006a4f]"
            >
              ยืนยันการปรับงบประมาณ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
