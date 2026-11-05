"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "../../context/DataContext";
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  FolderKanban, 
  BarChart3, 
  History, 
  LogOut,
  UserCheck
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, switchUser } = useData();

  const isAccountant = currentUser.role === "accountant";
  const isExecutive = currentUser.role === "executive";

  const menuItems = [
    { label: "หน้าหลัก (แดชบอร์ด)", href: "/dashboard", icon: LayoutDashboard, show: true },
    { label: "ยื่นขอเบิกเงิน", href: "/reimburse/create", icon: FileText, show: true },
    { label: "รออนุมัติ / ประวัติการอนุมัติ", href: "/approvals", icon: Clock, show: true },
    { label: "โครงการงบประมาณ", href: "/projects", icon: FolderKanban, show: true },
    { label: "รายงานและวิเคราะห์", href: "/reports", icon: BarChart3, show: isAccountant },
    { label: "ประวัติการปรับงบ / เพิ่มโครงการ", href: "/adjust-logs", icon: History, show: isAccountant || isExecutive },
  ];

  return (
    <aside className="w-64 bg-[#0d2a23] text-white flex flex-col min-h-screen border-r border-[#153f35] shrink-0">
      <div className="p-5 border-b border-[#18463b]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center font-bold text-slate-900">
            D
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Dune Budget</h1>
            <span className="text-[11px] text-emerald-400">Sandworm</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#11352c] border-b border-[#18463b]">
        <div>
          <div className="text-xs text-slate-300">ตำแหน่ง: {currentUser.department}</div>
          <div className="font-semibold text-sm text-emerald-300">{currentUser.fullname}</div>
        </div>

        <div className="mt-3 pt-2 border-t border-[#1b4b3f]">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
            <UserCheck className="w-3 h-3 text-emerald-400" /> สลับสิทธิ์ผู้ใช้งาน (Testing):
          </div>
          <select
            value={currentUser.username}
            onChange={(e) => switchUser(e.target.value)}
            className="w-full text-xs bg-[#0b241e] border border-[#215a4c] rounded px-2 py-1.5 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="emp_it">พนักงานทั่วไป (ธนพล)</option>
            <option value="head_it">หัวหน้าแผนก (สมศักดิ์)</option>
            <option value="exec_somchai">ผู้บริหาร (สมชาย)</option>
            <option value="acc_sommai">ฝ่ายบัญชี (สมหมาย)</option>
          </select>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.filter((m) => m.show).map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-emerald-600 text-white font-medium shadow-sm"
                  : "text-slate-300 hover:bg-[#153f35] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#18463b]">
        <button
          onClick={() => alert("ออกจากระบบ")}
          className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-rose-400 hover:bg-[#153f35] rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}