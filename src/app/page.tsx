/**
 * "/" — พาไปหน้าหลัก (ถ้ายังไม่ login, AppFrame จะพาไป /login ต่อเอง) · เจ้าของ: คนที่ 1
 */
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
