"use client";
/**
 * components/layout/AppFrame.tsx — กรอบของทุกหน้า + ตัวกันหน้า (guard) · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ถูกใส่ไว้ใน app/layout.tsx แล้ว → ทุกหน้าได้ Sidebar + Header อัตโนมัติ (ยกเว้น /login)
 *
 * หน้าที่:
 *   1. ยังไม่ login แล้วเข้าหน้าอื่น          → พาไป /login
 *   2. login แล้วเข้า /login                → พาไป /dashboard
 *   3. role ไม่มีสิทธิ์เข้าหน้านั้น (ROUTES.roles) → แสดง "ไม่มีสิทธิ์เข้าถึงหน้านี้"
 *
 * ผลคือในหน้าของแต่ละคน useCurrentUser() จะ "ไม่เป็น null" เสมอ
 * (แต่ TypeScript ยังมองว่าเป็น null ได้ → ใช้ `const user = useCurrentUser()!` หรือเช็ก if (!user) return null)
 */
import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canAccess, matchRoute, PATHS } from "@/config/routes";
import { useSession } from "@/store/session";
import { ButtonLink, EmptyState } from "@/components/ui";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const PUBLIC_PATHS: string[] = [PATHS.login];

/**
 * ห่อด้วย <Suspense> เพราะ usePathname() ในหน้าที่มี [id] รู้ค่าตอนเปิดหน้าจริงเท่านั้น
 * (Next 16 + cacheComponents บังคับ) — ระหว่างรอจะแสดง "กำลังโหลด…"
 */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <AppFrameInner>{children}</AppFrameInner>
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-text-muted" role="status">
      กำลังโหลด…
    </div>
  );
}

function AppFrameInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useSession();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) router.replace(PATHS.login);
    if (user && isPublic) router.replace(PATHS.dashboard);
  }, [ready, user, isPublic, router]);

  if (isPublic) return <>{children}</>;

  if (!ready || !user) return <Loading />;

  const route = matchRoute(pathname);
  const allowed = canAccess(route, user.role);

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-10 py-8">
          {allowed ? (
            children
          ) : (
            <div className="rounded-lg border-[1.5px] border-border bg-surface">
              <EmptyState
                title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
                description="หน้านี้ใช้ได้เฉพาะบางตำแหน่ง หากคิดว่าเป็นข้อผิดพลาดโปรดติดต่อฝ่ายบัญชี"
                action={<ButtonLink href={PATHS.dashboard} variant="secondary" icon={<ArrowLeft />}>กลับหน้าหลัก</ButtonLink>}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
