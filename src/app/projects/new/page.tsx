/**
 * /projects/new — เจ้าของ: คนที่ 5
 * หน้าชั่วคราว: สิ่งที่ต้องทำเขียนไว้ใน config/routes.ts (แสดงบนหน้าจอด้วย)
 * เริ่มทำ: ใส่ "use client" บรรทัดแรก (ถ้าใช้ hook/useState) ลบ <PagePlaceholder /> แล้วเขียนหน้าจริงแทน
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, FileText, Plus, Trash2, X } from "lucide-react";
import { PATHS } from "@/config/routes";
import { MOCK_USERS } from "@/data/mock/users";
import { createProject } from "@/store/projects";

interface CategoryRow {
  id: string;
  name: string;
  allocated: string;
}

const AVAILABLE_DEPARTMENTS = [
  "ส่วนกลาง (ทุกแผนก)",
  "ฝ่ายเทคโนโลยีสารสนเทศ IT",
  "ฝ่ายการตลาดและสื่อสารองค์กร",
  "ฝ่ายการเงินและบัญชี",
  "ฝ่ายทรัพยากรบุคคล HR",
  "ฝ่ายปฏิบัติการ",
];

export default function NewProjectPage() {
  const router = useRouter();

  // ฟอร์มข้อมูลโครงการหลัก — เริ่มต้นเป็นค่าว่างเพื่อให้กรอกโครงการใหม่
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fileList, setFileList] = useState<string[]>([]);
  // เปลี่ยน key เพื่อรีเซ็ต input file เมื่อผู้ใช้กดลบไฟล์
  const [fileInputKey, setFileInputKey] = useState(0);
  const [purpose, setPurpose] = useState("");

  // หมวดหมู่ย่อยในโครงการ
  const [categories, setCategories] = useState<CategoryRow[]>([
    { id: "cat-1", name: "", allocated: "" },
  ]);

  const [error, setError] = useState("");

  // คำนวณยอดรวมงบประมาณอัตโนมัติ
  const totalBudget = useMemo(() => {
    return categories.reduce((sum, cat) => {
      const val = parseFloat(cat.allocated.replace(/,/g, "")) || 0;
      return sum + val;
    }, 0);
  }, [categories]);

  // การจัดการหมวดหมู่ย่อย
  const handleAddCategory = () => {
    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name: "", allocated: "" },
    ]);
  };

  const handleRemoveCategory = (id: string) => {
    if (categories.length <= 1) {
      setError("โครงการต้องมีหมวดหมู่ค่าใช้จ่ายอย่างน้อย 1 หมวด");
      return;
    }
    setError("");
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  const handleCategoryChange = (
    id: string,
    field: "name" | "allocated",
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat))
    );
  };

  // การจัดการเลือกแผนก
  const handleToggleDepartment = (dept: string) => {
    if (departments.includes(dept)) {
      if (departments.length === 1) {
        setError("ต้องเลือกอย่างน้อย 1 แผนก");
        return;
      }
      setDepartments(departments.filter((d) => d !== dept));
    } else {
      setError("");
      setDepartments([...departments, dept]);
    }
  };

  // การอัปโหลดไฟล์จำลอง (รองรับหลายไฟล์)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newNames = Array.from(files).map((f) => f.name);
      setFileList((prev) => Array.from(new Set([...prev, ...newNames])));
      setFileInputKey((prev) => prev + 1);
    }
  };

  const handleRemoveFile = (targetName: string) => {
    setFileList((prev) => prev.filter((name) => name !== targetName));
  };

  // บันทึกโครงการ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("กรุณากรอกชื่อโครงการ");
      return;
    }
    if (departments.length === 0) {
      setError("กรุณาเลือกแผนกหรือฝ่ายที่เกี่ยวข้อง");
      return;
    }
    if (!startDate || !endDate) {
      setError("กรุณาระบุช่วงเวลาดำเนินโครงการให้ครบถ้วน");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("วันเริ่มต้นโครงการต้องไม่มากกว่าวันสิ้นสุดโครงการ");
      return;
    }
    if (!purpose.trim()) {
      setError("กรุณากรอกรายละเอียดและวัตถุประสงค์");
      return;
    }

    // ตรวจสอบหมวดหมู่ย่อย
    for (const cat of categories) {
      if (!cat.name.trim()) {
        setError("กรุณากรอกชื่อหมวดหมู่ย่อยให้ครบถ้วน");
        return;
      }
      const val = parseFloat(cat.allocated.replace(/,/g, ""));
      if (isNaN(val) || val <= 0) {
        setError(`กรุณาระบุงบประมาณของหมวด "${cat.name || "หมวดหมู่"}" ให้ถูกต้อง`);
        return;
      }
    }

    const newProj = createProject({
      name: name.trim(),
      purpose: purpose.trim(),
      departments,
      ownerId,
      startDate,
      endDate,
      categories: categories.map((c) => ({
        id: "",
        name: c.name.trim(),
        allocated: parseFloat(c.allocated.replace(/,/g, "")),
      })),
    });

    router.push(PATHS.projectDetail(newProj.id));
  };

  return (
    <div className="min-h-full space-y-6 pb-12">
      {/* 1. ส่วนหัวหน้าจอ */}
      <div>
        <p className="text-[11px] text-gray-500">
          โครงการและงบประมาณ / เพิ่มโครงการ
        </p>
        <h1 className="mt-1 text-[20px] font-bold text-[#007F5F]">
          เพิ่มโครงการและจัดสรรงบประมาณ
        </h1>
      </div>

      {/* 2. การ์ดฟอร์มหลักสีขาว ขอบมนตามรูปเป๊ะ */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-[12px] text-red-600">
              {error}
            </div>
          )}

          {/* แถวที่ 1: ชื่อโครงการ* + แผนกและฝ่ายที่เกี่ยวข้อง* */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                ชื่อโครงการ<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ระบุชื่อโครงการ เช่น โครงการพัฒนาบุคลากร"
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[12px] text-gray-800 placeholder:text-gray-400 focus:border-[#007F5F] focus:outline-none"
              />
            </div>

            {/* แผนกที่เกี่ยวข้อง (Multi-select Tag Pill แบบ UX ดีขึ้น) */}
            <div className="relative">
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                แผนกและฝ่ายที่เกี่ยวข้อง<span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
                className="min-h-[42px] cursor-pointer flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 pr-8 text-[12px] focus-within:border-[#007F5F]"
              >
                {departments.map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                  >
                    {dept}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDepartment(dept);
                      }}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <ChevronDown className="pointer-events-none absolute right-3 top-9 size-4 text-gray-400" />
              </div>

              {/* Dropdown ตัวเลือกแผนก */}
              {deptDropdownOpen && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {AVAILABLE_DEPARTMENTS.map((dept) => {
                    const isSelected = departments.includes(dept);
                    return (
                      <div
                        key={dept}
                        onClick={() => handleToggleDepartment(dept)}
                        className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-[12px] transition hover:bg-gray-50 ${
                          isSelected ? "bg-emerald-50/50 text-[#007F5F] font-semibold" : "text-gray-700"
                        }`}
                      >
                        <span>{dept}</span>
                        {isSelected && <span className="text-[#007F5F]">✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* แถวที่ 2: ชื่อผู้รับผิดชอบ* + วันที่เริ่มโครงการ* */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                ชื่อผู้รับผิดชอบ<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-[12px] text-gray-800 focus:border-[#007F5F] focus:outline-none"
                >
                  {MOCK_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.position})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                วันที่เริ่มโครงการ<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12px] text-gray-800 focus:border-[#007F5F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* แถวที่ 3: แนบไฟล์เอกสารอนุมัติโครงการ + วันสิ้นสุดโครงการ* */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                แนบไฟล์เอกสารอนุมัติโครงการ (.pdf .jpg .png)<span className="text-red-500">*</span>
              </label>
              <div className="rounded-lg border border-gray-200 bg-white p-2">
                <div className="flex items-center gap-3">
                  <label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#007F5F] bg-white px-3 py-1 text-[11px] font-medium text-[#007F5F] hover:bg-[#007F5F]/5 transition">
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
                          className="ml-2 inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium text-red-500 hover:bg-red-50 transition"
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

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                วันสิ้นสุดโครงการ<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12px] text-gray-800 focus:border-[#007F5F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* แถวที่ 4: รายละเอียดและวัตถุประสงค์* */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              รายละเอียดและวัตถุประสงค์<span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="ระบุวัตถุประสงค์และกรอบการทำงานของโครงการ..."
              className="w-full rounded-lg border border-gray-200 bg-white p-3.5 text-[12px] text-gray-800 placeholder:text-gray-400 focus:border-[#007F5F] focus:outline-none"
            />
          </div>

          {/* แถวที่ 5: ส่วนกำหนดหมวดหมู่ย่อยในโครงการ + แถบสรุปยอดรวมงบ */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-gray-800">
                  กำหนดหมวดหมู่ย่อยในโครงการ
                </h3>
                <p className="text-[11px] text-gray-400">
                  แบ่งงบก้อนใหญ่ลงในแต่ละหมวดหมู่
                </p>
              </div>

              {/* ป้ายยอดรวมงบประมาณสีเขียวเข้มเด่นชัดเจน */}
              <div className="flex h-10 items-center justify-between gap-6 rounded-lg bg-[#007F5F] px-5 text-white shadow-xs">
                <span className="text-[12px] font-normal">ยอดรวมงบประมาณ</span>
                <span className="text-[16px] font-bold tracking-tight">
                  {totalBudget.toLocaleString()} บาท
                </span>
              </div>
            </div>

            {/* กล่องรายการหมวดหมู่ย่อย (เพิ่ม/ลบแถวได้) */}
            <div className="mt-4 rounded-xl border border-gray-200/80 bg-white p-5 space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="inline-flex items-center gap-1 rounded-md border border-[#007F5F] bg-white px-3 py-1 text-[11px] font-semibold text-[#007F5F] hover:bg-[#007F5F]/5 transition"
                >
                  <Plus className="size-3.5 stroke-[2.5]" /> เพิ่มหมวดหมู่
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {categories.map((cat, index) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    {/* ชื่อหมวด */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) =>
                          handleCategoryChange(cat.id, "name", e.target.value)
                        }
                        placeholder={`ชื่อหมวดย่อยที่ ${index + 1} เช่น ค่าวัสดุ, ค่าสถานที่`}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12px] text-gray-800 placeholder:text-gray-400 focus:border-[#007F5F] focus:outline-none"
                      />
                    </div>

                    {/* งบประมาณของหมวด */}
                    <div className="w-48">
                      <div className="relative">
                        <input
                          type="text"
                          value={cat.allocated}
                          onChange={(e) =>
                            handleCategoryChange(
                              cat.id,
                              "allocated",
                              e.target.value
                            )
                          }
                          placeholder="จำนวนเงิน"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 pr-8 text-[12px] text-gray-800 placeholder:text-gray-400 focus:border-[#007F5F] focus:outline-none text-right"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                          ฿
                        </span>
                      </div>
                    </div>

                    {/* ปุ่มลบแถว */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition"
                      title="ลบหมวดหมู่นี้"
                    >
                      <Trash2 className="size-4 stroke-[1.8]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ปุ่ม ยกเลิก / บันทึกและสร้างโครงการ */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href={PATHS.projects}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-5 text-[12px] font-medium text-gray-700 transition hover:bg-gray-50"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-[#007F5F] px-5 text-[12px] font-medium text-white transition hover:bg-[#006a4f]"
            >
              บันทึกและสร้างโครงการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
