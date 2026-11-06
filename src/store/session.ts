/**
 * store/session.ts — ผู้ใช้ที่ login อยู่ (เจ้าของ: คนที่ 1)
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   useCurrentUser()        hook → User | null       ผู้ใช้ที่ login (null = ยังไม่ login)
 *   useSession()            hook → { user, ready }   ready=false ระหว่างหน้ายังโหลดไม่เสร็จ
 *   login(email, password)  → boolean                 true = สำเร็จ
 *   logout()                → void
 *   getUserById(id)         → User | undefined        หาชื่อ/แผนกของผู้ยื่นจาก requesterId
 *
 * ตัวอย่าง:
 *   const user = useCurrentUser();
 *   if (user?.role === "ACCOUNTANT") { ... }
 */
import { useMemo } from "react";
import { createPersistentStore, useHydrated } from "@/lib/createStore";
import { MOCK_USERS } from "@/data/mock/users";
import type { User } from "@/types";

interface SessionState {
  userId: string | null;
}

const sessionStore = createPersistentStore<SessionState>("dune_session", { userId: null });

/** ตัด password ออกก่อนส่งให้หน้าจอ */
function toUser(account: (typeof MOCK_USERS)[number]): User {
  const { password: _password, ...user } = account;
  void _password;
  return user;
}

/** รายชื่อผู้ใช้ทั้งหมด (ไม่มีรหัสผ่าน) */
export const USERS: User[] = MOCK_USERS.map(toUser);

/**
 * หาผู้ใช้จาก id
 * รับเข้า: id เช่น "EMP-001" · ส่งออก: User หรือ undefined
 */
export function getUserById(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

/**
 * เข้าสู่ระบบด้วยบัญชีจำลอง
 * รับเข้า: อีเมล (ไม่สนตัวพิมพ์เล็ก/ใหญ่), รหัสผ่าน
 * ส่งออก: true ถ้าเจอบัญชี, false ถ้าไม่ถูกต้อง
 */
export function login(email: string, password: string): boolean {
  const account = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
  if (!account) return false;
  sessionStore.setState({ userId: account.id });
  return true;
}

/** ออกจากระบบ */
export function logout(): void {
  sessionStore.setState({ userId: null });
}

/**
 * hook: ผู้ใช้ที่ login อยู่
 * ส่งออก: User | null
 */
export function useCurrentUser(): User | null {
  const { userId } = sessionStore.useState();
  return useMemo(() => (userId ? getUserById(userId) ?? null : null), [userId]);
}

/**
 * hook: ผู้ใช้ + สถานะว่าโหลดเสร็จหรือยัง
 * ใช้ในตัวกันหน้า (guard) — ถ้า ready=false อย่าเพิ่ง redirect
 * ส่งออก: { user: User | null, ready: boolean }
 */
export function useSession(): { user: User | null; ready: boolean } {
  const user = useCurrentUser();
  const ready = useHydrated();
  return { user, ready };
}
