/**
 * Root layout (เจ้าของ: คนที่ 1)
 * -----------------------------------------------------------------------------
 * - โหลดฟอนต์ IBM Plex Sans Thai (ตรงกับ Figma) แล้วส่งเป็น CSS variable --font-plex
 *   ให้ globals.css ใช้ผ่าน --font-sans
 * - ห่อทุกหน้าด้วย <AppFrame> ซึ่งตัดสินใจเองว่าจะแสดง sidebar/header หรือไม่
 *   (หน้า /login ไม่มี sidebar)
 *
 * คนอื่นไม่ต้องแก้ไฟล์นี้ — ถ้าต้องการ provider ใหม่ให้ขอคนที่ 1
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { AppFrame } from "@/components/layout/AppFrame";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dune Budget Sandworm",
  description: "ระบบยื่นขอเบิกและอนุมัติงบประมาณโครงการ",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={plex.variable}>
      <body className="min-h-screen font-sans">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
