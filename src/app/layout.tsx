import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { DataProvider } from "../context/DataContext";
import Sidebar from "../components/shared/Sidebar";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "Dune Budget Sandworm",
  description: "ระบบอนุมัติและขอเบิกงบประมาณองค์กร",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="flex min-h-screen bg-slate-50 font-sans antialiased">
        <DataProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8">
              <span className="text-xs text-slate-500">ระบบงบประมาณ Dune Sandworm</span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                สถานะระบบ: พร้อมใช้งาน
              </span>
            </header>
            <main className="flex-1 p-8 overflow-y-auto">{children}</main>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}