"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_USERS, AppUser } from "../data/mockUsers";

export type UserRole = "employee" | "dept_head" | "executive" | "accountant";

export interface BudgetRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  title: string;
  totalAmount: number;
  tableType: "A" | "B";
  currentStepRole: UserRole | "completed";
  status: "pending" | "step_back" | "completed";
  workflowHistory: UserRole[]; // เก็บประวัติเส้นทางที่คำขอวิ่งผ่านมา
  stepBackNote?: string;
  paymentMethod?: "transfer" | "cash";
  createdAt: string;
}

interface DataContextType {
  currentUser: AppUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  requests: BudgetRequest[];
  createNewRequest: (title: string, amount: number, tableType: "A" | "B") => void;
  approveRequest: (requestId: string, paymentMethod?: "transfer" | "cash") => void;
  stepBackRequest: (requestId: string, note: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [requests, setRequests] = useState<BudgetRequest[]>([]);

  // โหลด session จาก LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("dune_current_user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    const savedRequests = localStorage.getItem("dune_requests");
    if (savedRequests) setRequests(JSON.parse(savedRequests));
  }, []);

  const saveRequests = (newReqs: BudgetRequest[]) => {
    setRequests(newReqs);
    localStorage.setItem("dune_requests", JSON.stringify(newReqs));
  };

  // 1. ระบบ Login ด้วย Username & Password
  const login = (u: string, p: string): boolean => {
    const user = MOCK_USERS.find((item) => item.username === u && item.password === p);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("dune_current_user", JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("dune_current_user");
  };

  // 2. คำนวณ Role แรกที่ต้องไปตรวจ ตามเงื่อนไขวงเงิน & Role ผู้ขอ
  const calculateInitialApprover = (role: UserRole, amount: number): UserRole => {
    if (role === "executive") return "accountant";

    if (role === "dept_head" || role === "accountant") {
      return amount >= 30000 ? "executive" : "accountant";
    }

    // กรณีพนักงาน (employee)
    if (amount < 5000) return "accountant";
    if (amount >= 5000 && amount < 30000) return "dept_head";
    return "executive"; // amount >= 30000
  };

  // 3. ยื่นสร้างคำขอใหม่
  const createNewRequest = (title: string, amount: number, tableType: "A" | "B") => {
    if (!currentUser) return;

    const initialRole = calculateInitialApprover(currentUser.role, amount);

    const newReq: BudgetRequest = {
      id: "REQ-" + Date.now(),
      requestNumber: `RQ-${Math.floor(1000 + Math.random() * 9000)}`,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      title,
      totalAmount: amount,
      tableType,
      currentStepRole: initialRole,
      status: "pending",
      workflowHistory: [currentUser.role], // เริ่มบันทึก history จุดตั้งต้น
      createdAt: new Date().toISOString(),
    };

    saveRequests([newReq, ...requests]);
  };

  // 4. การอนุมัติ (Approve)
  const approveRequest = (requestId: string, paymentMethod?: "transfer" | "cash") => {
    const updated = requests.map((req) => {
      if (req.id !== requestId) return req;

      const history = [...req.workflowHistory, req.currentStepRole as UserRole];

      // ถ้าคนอนุมัติปัจจุบันคือ บัญชี -> จบขั้นตอน (ทำจ่าย)
      if (req.currentStepRole === "accountant") {
        return {
          ...req,
          currentStepRole: "completed" as const,
          status: "completed" as const,
          workflowHistory: history,
          paymentMethod: paymentMethod || "transfer",
        };
      }

      // ถ้าคนอนุมัติคือ ผู้บริหาร -> ปลายทางต่อไปคือ บัญชี เสมอ
      if (req.currentStepRole === "executive") {
        return {
          ...req,
          currentStepRole: "accountant" as const,
          workflowHistory: history,
          status: "pending" as const,
        };
      }

      // ถ้าคนอนุมัติคือ หัวหน้าแผนก -> ส่งต่อบัญชี
      if (req.currentStepRole === "dept_head") {
        return {
          ...req,
          currentStepRole: "accountant" as const,
          workflowHistory: history,
          status: "pending" as const,
        };
      }

      return req;
    });

    saveRequests(updated);
  };

  // 5. การตีกลับ (Step-Back ย้อนกลับไปตามประวัติจริง)
  const stepBackRequest = (requestId: string, note: string) => {
    const updated = requests.map((req) => {
      if (req.id !== requestId) return req;

      const history = [...req.workflowHistory];
      // ดึงบทบาทก่อนหน้าออกมาจาก History
      const previousRole = history.length > 0 ? history.pop()! : req.requesterRole;

      return {
        ...req,
        currentStepRole: previousRole,
        workflowHistory: history,
        status: "step_back" as const,
        stepBackNote: note,
      };
    });

    saveRequests(updated);
  };

  return (
    <DataContext.Provider
      value={{
        currentUser,
        login,
        logout,
        requests,
        createNewRequest,
        approveRequest,
        stepBackRequest,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};