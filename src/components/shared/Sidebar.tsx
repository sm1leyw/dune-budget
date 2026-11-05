"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useData } from "../../context/DataContext";
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useData();

  // ไม่ต้องแสดง Sidebar ในหน้า Login
  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // รายการเมนูทั้งหมด พร้อมเงื่อนไขการมองเห็นตาม Role
  const menuItems = [
    {
      label: "หน้าหลัก (แดชบอร์ด)",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      show: true, // ทุกคนเห็นหน้านี้
    },
    {
      label: "ยื่นขอเบิกเงิน",
      href: "/reimburse/create",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      show: true, // ทุกคนยื่นคำขอของตัวเองได้
    },
    {
      label: "รออนุมัติ / ประวัติการอนุมัติ",
      href: "/approvals",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      // พนักงานทั่วไปไม่ต้องเห็นเมนูอนุมัติงาน
      show: currentUser?.role !== "employee",
    },
    {
      label: "โครงการงบประมาณ",
      href: "/projects",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      // ฝ่ายบัญชี และ ผู้บริหาร เท่านั้นที่จัดการ/ดูโครงการ
      show: currentUser?.role === "accountant" || currentUser?.role === "executive",
    },
    {
      label: "ประวัติการปรับงบ / Logs",
      href: "/adjust-logs",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      show: currentUser?.role === "accountant" || currentUser?.role === "executive",
    },
  ];

  return (
    <aside className="w-64 bg-[#0a192f] text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800 shrink-0">
      {/* ส่วนบน: โลโก้แบรนด์ */}
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-md">
            D
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide">Dune Budget</div>
            <div className="text-[11px] text-emerald-400 font-medium">Petty Cash System</div>
          </div>
        </div>

        {/* รายการเมนูนำทาง */}
        <nav className="px-3 space-y-1.5 mt-2">
          {menuItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#00684a] text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </div>

      {/* ส่วนล่าง: โปรไฟล์ผู้ใช้ + ปุ่มออกจากระบบ */}
      <div className="p-4 border-t border-slate-800/80">
        {currentUser ? (
          <div className="space-y-3">
            <div className="px-2">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                เข้าสู่ระบบโดย
              </p>
              <p className="text-sm font-semibold text-white truncate mt-0.5">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2 py-0.5 text-[10px] rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono uppercase">
                  {currentUser.role}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {currentUser.department}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-medium transition-colors border border-slate-700/60"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full block text-center py-2.5 px-3 bg-[#00684a] text-white rounded-xl text-xs font-medium hover:bg-[#00553c] transition shadow-sm"
          >
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </aside>
  );
}