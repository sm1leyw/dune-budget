"use client";
/**
 * components/layout/Sidebar.tsx — เมนูด้านซ้าย (พื้นขาวตาม Figma) · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * รับเข้า: user (จาก AppFrame)
 * แสดง: โลโก้ · เมนูตาม role (config/navigation.ts) · จำนวน "รอคุณพิจารณา" · ปุ่มออกจากระบบ
 * คนอื่นไม่ต้อง import ไฟล์นี้ — AppFrame ใส่ให้ทุกหน้าแล้ว
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_BY_ROLE, getActiveHref } from "@/config/navigation";
import { PATHS } from "@/config/routes";
import { isMyTurn } from "@/lib/workflow";
import { cn } from "@/lib/cn";
import { logout } from "@/store/session";
import { useRequests } from "@/store/requests";
import type { User } from "@/types";

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const requests = useRequests();
  const items = NAV_BY_ROLE[user.role];
  const activeHref = getActiveHref(items, pathname);
  const myTurnCount = requests.filter((r) => isMyTurn(r, user)).length;

  function handleLogout() {
    logout();
    router.replace(PATHS.login);
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[272px] shrink-0 flex-col border-r-[1.5px] border-border bg-surface">
      <Link href={PATHS.dashboard} className="flex items-center gap-3 px-6 py-7">
        <span aria-hidden className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-2xl">
          🪱
        </span>
        <span>
          <span className="block text-lg font-bold leading-tight text-primary">Dune Budget</span>
          <span className="block text-caption text-text-muted">ระบบขอเบิกงบโครงการ</span>
        </span>
      </Link>

      <nav aria-label="เมนูหลัก" className="flex-1 space-y-1 overflow-y-auto px-4">
        {items.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          const count = item.badge === "myTurn" ? myTurnCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-md px-4 py-2.5 text-body transition",
                active ? "bg-primary font-bold text-text-inverse" : "font-medium text-text hover:bg-primary-soft",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="flex-1 leading-snug">{item.label}</span>
              {count > 0 && (
                <span
                  aria-label={`รอคุณพิจารณา ${count} รายการ`}
                  className={cn(
                    "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-badge font-bold",
                    active ? "bg-surface text-primary" : "bg-warning text-text-inverse",
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t-[1.5px] border-border p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-12 w-full items-center gap-3 rounded-md px-4 text-body font-medium text-danger transition hover:bg-danger/5"
        >
          <LogOut className="size-5" aria-hidden />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
