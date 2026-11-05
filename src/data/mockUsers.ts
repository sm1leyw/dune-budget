export interface AppUser {
  id: string;
  username: string;
  password: string; // สำหรับ mock ตรวจสอบ
  name: string;
  role: "employee" | "dept_head" | "executive" | "accountant";
  department: string;
}

export const MOCK_USERS: AppUser[] = [
  {
    id: "u-emp",
    username: "employee",
    password: "123",
    name: "สมชาย พนักงานทั่วไป",
    role: "employee",
    department: "ฝ่ายพัฒนาซอฟต์แวร์",
  },
  {
    id: "u-head",
    username: "depthead",
    password: "123",
    name: "วิชัย หัวหน้าแผนก",
    role: "dept_head",
    department: "ฝ่ายพัฒนาซอฟต์แวร์",
  },
  {
    id: "u-exec",
    username: "executive",
    password: "123",
    name: "ดร.วรพร ผู้บริหารระดับสูง",
    role: "executive",
    department: "คณะกรรมการบริหาร",
  },
  {
    id: "u-acc",
    username: "accountant",
    password: "123",
    name: "กัญญา บัญชีการเงิน",
    role: "accountant",
    department: "ฝ่ายบัญชีและการเงิน",
  },
];