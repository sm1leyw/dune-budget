"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useData } from "../../context/DataContext";
import {
  LayoutDashboard,
  FileText,
  Clock,
  FolderKanban,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useData();

  const menuItems = [
    { label: "หน้าหลัก (แดชบอร์ด)", href: "/dashboard", icon: LayoutDashboard },
    { label: "ยื่นขอเบิกเงิน", href: "/reimburse/create", icon: FileText },
    { label: "รออนุมัติ / ประวัติการอนุมัติ", href: "/approvals", icon: Clock },
    { label: "โครงการงบประมาณ", href: "/projects", icon: FolderKanban },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-[#0e2c24] text-white flex flex-col justify-between border-r border-[#18463b]">
      <div>
        {/* Header โลโก้ระบบ */}
        <div className="p-5 border-b border-[#18463b]">
          <h1 className="text-xl font-bold tracking-wide text-white">Dune Budget</h1>
          <p className="text-xs text-emerald-400">Sandworm System</p>
        </div>

        {/* ข้อมูลโปรไฟล์ผู้ใช้งาน (วงแดงซ้าย) */}
        <div className="p-4 bg-[#11352c] border-b border-[#18463b]">
          <div className="text-xs text-slate-300">
            ตำแหน่ง: {currentUser?.department || "ฝ่ายการเงินและบัญชี"}
          </div>
          <div className="font-semibold text-sm text-emerald-300">
            {currentUser?.name || "ภูวเนศวร์ อิ่มฤทธา"}
          </div>
        </div>

        {/* เมนูนำทาง 4 เมนูหลัก */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-[#18463b] text-emerald-300 font-semibold"
                    : "text-slate-300 hover:bg-[#143e34] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ปุ่มออกจากระบบ */}
      <div className="p-4 border-t border-[#18463b]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 w-full px-2 py-1.5 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}