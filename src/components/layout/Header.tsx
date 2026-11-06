"use client";
/**
 * components/layout/Header.tsx — แถบด้านบน · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * แสดง breadcrumb + ชื่อหน้า (อ่านจาก config/routes.ts อัตโนมัติ) และชื่อผู้ใช้มุมขวา (กดไปหน้าโปรไฟล์)
 * หน้าของแต่ละคน "ไม่ต้อง" เขียนหัวข้อหน้าเอง — แค่ตั้ง title ใน config/routes.ts
 * ถ้าต้องการปุ่มขวาบนของหน้า ให้ใช้ <PageActions> ในหน้าตัวเอง (ดู components/layout/PageActions.tsx)
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { matchRoute, ROUTES } from "@/config/routes";
import { ROLE_LABEL } from "@/constants/roles";
import { Avatar } from "@/components/ui";
import type { User } from "@/types";

export function Header({ user }: { user: User }) {
  const pathname = usePathname();
  const route = matchRoute(pathname);
  const parent = route?.parent ? ROUTES.find((r) => r.path === route.parent) : undefined;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-6 border-b-[1.5px] border-border bg-surface/95 px-10 backdrop-blur">
      <div className="min-w-0">
        {parent && (
          <nav aria-label="breadcrumb" className="flex items-center gap-1 text-caption text-text-muted">
            <Link href={parent.path} className="hover:text-primary hover:underline">
              {parent.title}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
          </nav>
        )}
        <h1 className="truncate text-title font-bold text-text">{route?.title ?? "Dune Budget"}</h1>
      </div>

      <Link
        href="/profile"
        className="flex shrink-0 items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 transition hover:bg-primary-soft"
      >
        <Avatar name={user.name} />
        <span className="text-left">
          <span className="block text-body font-bold leading-tight text-text">{user.name}</span>
          <span className="block text-caption text-text-muted">{ROLE_LABEL[user.role]}</span>
        </span>
      </Link>
    </header>
  );
}
