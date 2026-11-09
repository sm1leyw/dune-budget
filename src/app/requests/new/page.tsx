/**
 * /requests/new — เจ้าของ: คนที่ 2
 * หน้าชั่วคราว: สิ่งที่ต้องทำเขียนไว้ใน config/routes.ts (แสดงบนหน้าจอด้วย)
 * เริ่มทำ: ใส่ "use client" บรรทัดแรก (ถ้าใช้ hook/useState) ลบ <PagePlaceholder /> แล้วเขียนหน้าจริงแทน
 */
import { useState } from "react"; // useState() เป็น hook ของ React สำหรับเก็บ state ของ component
import { useRouter } from "next/navigation"; // useRouter() เป็น hook ของ Next.js สำหรับเปลี่ยนหน้า (navigate) และเข้าถึงข้อมูลเกี่ยวกับ route ปัจจุบัน
import { RequestForm, emptyForm, todayISO } from "@/components/request-form"; // RequestForm เป็น component สำหรับแสดงฟอร์มสร้างคำขอใหม่, emptyForm เป็นค่าเริ่มต้นของฟอร์ม, todayISO เป็นวันที่ปัจจุบันในรูปแบบ ISO
import { PATHS } from "@/config/routes"; // PATHS เป็น object ที่เก็บ path ของ route ต่าง ๆ ในแอปพลิเคชัน
import { createRequest, nextRequestId } from "@/store/requests"; // createRequest เป็นฟังก์ชันสำหรับสร้างคำขอใหม่, nextRequestId เป็นฟังก์ชันสำหรับสร้าง ID ใหม่ของคำขอ
import { useCurrentUser } from "@/store/session"; // useCurrentUser เป็น hook สำหรับเข้าถึงข้อมูลผู้ใช้ปัจจุบัน

export default function RequestsNewPage() {
  consst usser = ueCurrentUser();
  const router = ussrRouter();
  
  const [today] = useState(() => nextRequestId());
  if (!user) return null;

  return (
    <RequestForm
      user={user}
      today={today}
      initial={emptyForm(today)
      requestId={previewId}
      onSubmit={(input) => createRequest(input, user).id}}
      }
  )
}
