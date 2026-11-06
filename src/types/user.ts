/**
 * types/user.ts — ผู้ใช้และสิทธิ์ (ตกลงร่วมกันทั้งทีม, เจ้าของ: คนที่ 1)
 * แก้ไฟล์นี้ต้องเปิด PR ให้คนที่ 1 review เพราะทุกคนใช้
 */

/** สิทธิ์ผู้ใช้ 4 บทบาท */
export type UserRole = "EMPLOYEE" | "DEPT_HEAD" | "EXECUTIVE" | "ACCOUNTANT";

/** ผู้ใช้ที่ login อยู่ (ไม่มีรหัสผ่าน) */
export interface User {
  /** รหัสพนักงาน เช่น "EMP-001" — ใช้อ้างอิงใน requesterId */
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** ชื่อแผนก เช่น "ฝ่ายเทคโนโลยีสารสนเทศ IT" */
  department: string;
  /** ตำแหน่งที่แสดงบนแดชบอร์ด/โปรไฟล์ */
  position: string;
}
