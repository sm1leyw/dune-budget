/**
 * data/mock/users.ts — บัญชีทดสอบ 4 role (เจ้าของ: คนที่ 1)
 * ใช้ข้อมูลชุดเดิมของทีม (ย้ายมาจาก DataContext.tsx) — รหัสผ่านทุกบัญชีคือ "123"
 * ช่วง frontend-only เท่านั้น เมื่อมี backend ให้ลบไฟล์นี้
 */
import type { User } from "@/types";

export interface MockUserAccount extends User {
  password: string;
}

export const MOCK_USERS: MockUserAccount[] = [
  {
    id: "EMP-001",
    name: "ภูวเนศวร์ อิ่มฤทธา",
    email: "phuvaness.imr@spumail.net",
    password: "123",
    role: "EMPLOYEE",
    department: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    position: "พนักงาน IT",
  },
  {
    id: "EMP-002",
    name: "Montawat",
    email: "montawat.cha@spumail.net",
    password: "123",
    role: "DEPT_HEAD",
    department: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    position: "หัวหน้าแผนก IT",
  },
  {
    id: "EMP-003",
    name: "นันทิพัฒน์ จ.",
    email: "nanthipat.jen@spumail.net",
    password: "123",
    role: "ACCOUNTANT",
    department: "ฝ่ายการเงินและบัญชี",
    position: "เจ้าหน้าที่บัญชี",
  },
  {
    id: "EMP-004",
    name: "สุริยะ ส.",
    email: "suriya.saa@spumail.net",
    password: "123",
    role: "EXECUTIVE",
    department: "ฝ่ายบริหาร",
    position: "ผู้บริหารระดับสูง",
  },
];
