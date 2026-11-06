import { User, ReimburseRequest } from "../types";

export interface MockUserAuth extends User {
  password: string;
}

export const MOCK_USERS: MockUserAuth[] = [
  {
    id: "EMP-001",
    name: "a",
    email: "phuvaness.imr@spumail.net",
    password: "123",
    role: "EMPLOYEE",
    department: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    position: "พนักงาน IT",
  },
  {
    id: "EMP-002",
    name: "b",
    email: "montawat.cha@spumail.net",
    password: "123",
    role: "DEPT_HEAD",
    department: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    position: "หัวหน้าแผนก IT",
  },
  {
    id: "EMP-003",
    name: "c",
    email: "nanthipat.jen@spumail.net",
    password: "123",
    role: "ACCOUNTANT",
    department: "ฝ่ายการเงินและบัญชี",
    position: "เจ้าหน้าที่บัญชี",
  },
  {
    id: "EMP-004",
    name: "d",
    email: "suriya.saa@spumail.net",
    password: "123",
    role: "EXECUTIVE",
    department: "ฝ่ายบริหาร",
    position: "ผู้บริหารระดับสูง",
  },
];

export const INITIAL_REQUESTS: ReimburseRequest[] = [
  {
    id: "REQ-2026-0001",
    projectCode: "DUNE-001",
    projectName: "โครงการสัมมนาและพัฒนาบุคลากรประจำปี",
    category: "ค่าสถานที่/การเดินทาง",
    requesterEmail: "phuvaness.imr@spumail.net",
    requesterName: "ภูวเนศวร์ อิ่มฤทธา",
    requesterRole: "EMPLOYEE",
    requesterDepartment: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    totalAmount: 4500,
    purpose: "ค่าเดินทางออกปฏิบัติงานด่วน",
    createdAt: "02/11/2569",
    currentStep: "WAITING_ACCOUNTANT",
    items: [{ id: "item-1", name: "ค่าน้ำมันรถ", amount: 4500, date: "02/11/2569" }],
  },
  {
    id: "REQ-2026-0002",
    projectCode: "DUNE-001",
    projectName: "โครงการสัมมนาและพัฒนาบุคลากรประจำปี",
    category: "ค่าสถานที่และอาหารสัมมนา",
    requesterEmail: "phuvaness.imr@spumail.net",
    requesterName: "ภูวเนศวร์ อิ่มฤทธา",
    requesterRole: "EMPLOYEE",
    requesterDepartment: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    totalAmount: 32000,
    purpose: "ค่าเช่าห้องประชุมและจัดเลี้ยงสัมมนา",
    createdAt: "02/11/2569",
    currentStep: "WAITING_EXECUTIVE",
    items: [{ id: "item-2", name: "ค่าห้องประชุม", amount: 32000, date: "02/11/2569" }],
  },
];