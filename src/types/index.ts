// สิทธิ์ผู้ใช้งานในระบบทั้ง 4 บทบาท
export type UserRole = "EMPLOYEE" | "DEPT_HEAD" | "EXECUTIVE" | "ACCOUNTANT";

// ขั้นตอนการอนุมัติปัจจุบันของคำขอ
export type RequestStep = 
  | "WAITING_DEPT_HEAD"   // รอหัวหน้าแผนกอนุมัติ
  | "WAITING_EXECUTIVE"   // รอผู้บริหารอนุมัติ
  | "WAITING_ACCOUNTANT"  // รอตราวจสอบ/ทำจ่ายที่บัญชี
  | "COMPLETED"           // จ่ายเงินเสร็จสิ้น
  | "REJECTED";           // ถูกส่งกลับแก้ไข/ปฏิเสธ

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
}

export interface ExpenseItem {
  id: string;                      // รหัสรายการย่อย เช่น item-1
  name: string;                    // ชื่อรายการค่าใช้จ่าย
  amount: number;                  // จำนวนเงินของรายการ
  date: string;                    // วันที่ของรายการ
}

export interface ReimburseRequest {
  id: string;                      // รหัสคำขอ เช่น REQ-2026-0001
  projectCode: string;             // รหัสโครงการ เช่น DUNE-001
  projectName: string;             // ชื่อโครงการ
  category: string;                // หมวดหมู่ค่าใช้จ่าย
  requesterEmail: string;          // อีเมลผู้ยื่นขอเบิก
  requesterName: string;           // ชื่อผู้ยื่นขอเบิก
  requesterRole: UserRole;         // สิทธิ์ของผู้ยื่นขอเบิก
  requesterDepartment: string;     // แผนกของผู้ยื่นขอเบิก
  totalAmount: number;             // ยอดเงินรวมที่ขอเบิก
  purpose: string;                 // รายละเอียดวัตถุประสงค์
  createdAt: string;               // วันที่ยื่น
  currentStep: RequestStep;        // ขั้นตอนปัจจุบันใน Flow
  rejectReason?: string;           // เหตุผลการส่งกลับแก้ไข (ถ้ามี)
  items: ExpenseItem[];            // รายการค่าใช้จ่ายย่อย
}