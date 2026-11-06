"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useData } from "../../context/DataContext";
import {
  LayoutDashboard,
  FileText,
  Clock,
  FolderKanban,
  FileSpreadsheet,
  BarChart3,
  History,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useData();

  // กำหนดรายการเมนูตรงตามสไลด์ Figma
  const getMenuItems = () => {
    // กรณีที่ 1: ฝ่ายการเงินและบัญชี (สมหมาย ศรีสุข) -> 7 เมนูตาม Figma หน้า 39-44
    if (currentUser?.role === "ACCOUNTANT") {
      return [
        { label: "หน้าหลัก (แดชบอร์ด)", href: "/dashboard", icon: LayoutDashboard },
        { label: "โครงการและงบประมาณ", href: "/projects", icon: FolderKanban },
        { label: "ยื่นขอเบิกเงิน", href: "/reimburse/create", icon: FileText },
        { label: "ประวัติการเบิกของฉัน", href: "/reimburse/history", icon: Clock },
        { label: "รายการรอเบิกจ่าย", href: "/approvals", icon: FileSpreadsheet },
        { label: "รายงานงบประมาณองค์กร", href: "/reports", icon: BarChart3 },
        { label: "ประวัติการปรับงบ /เพิ่มโครงการ", href: "/projects/adjust-history", icon: History },
      ];
    }

    // กรณีที่ 2: บทบาทอื่นๆ ทั้งหมด (พนักงาน, หัวหน้าฝ่าย, ผู้บริหาร) -> 4 เมนูมาตรฐานตาม Figma หน้า 10, 28
    return [
      { label: "หน้าหลัก (แดชบอร์ด)", href: "/dashboard", icon: LayoutDashboard },
      { label: "ยื่นขอเบิกเงิน", href: "/reimburse/create", icon: FileText },
      { label: "รออนุมัติ / ประวัติการอนุมัติ", href: "/approvals", icon: Clock },
      { label: "โครงการงบประมาณ", href: "/projects", icon: FolderKanban },
    ];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-[#0F382C] text-white flex flex-col justify-between border-r border-[#164335] shrink-0">
      <div>
        {/* Header โลโก้ระบบ */}
        <div className="p-5 border-b border-[#164335]">
          <h1 className="text-xl font-bold tracking-wide text-white">Dune Budget</h1>
          <p className="text-xs text-emerald-400">Sandworm System</p>
        </div>

        {/* ข้อมูลโปรไฟล์ผู้ใช้งาน */}
        <div className="p-4 bg-[#143E31] border-b border-[#164335]">
          <div className="text-xs text-slate-300">
            ตำแหน่ง: {currentUser?.department || "ฝ่ายการเงินและบัญชี"}
          </div>
          <div className="font-semibold text-sm text-emerald-300 truncate">
            {currentUser?.name || "ยังไม่ได้เข้าสู่ระบบ"}
          </div>
        </div>

        {/* ลิสต์เมนูนำทาง */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition ${
                  isActive
                    ? "bg-[#1D5342] text-white font-bold shadow-sm"
                    : "text-gray-300 hover:bg-[#164335] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ปุ่มออกจากระบบ */}
      <div className="p-4 border-t border-[#164335]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 w-full px-2 py-2 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}