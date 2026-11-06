"use client";

import { usePathname } from "next/navigation";
import { Sarabun } from "next/font/google";
import { DataProvider } from "../context/DataContext";
import Sidebar from "../components/shared/Sidebar";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="th">
      <body className={`${sarabun.variable} min-h-screen bg-gray-50 flex`}>
        <DataProvider>
          {/* ถ้าเป็นหน้า login จะไม่แสดง Sidebar */}
          {!isLoginPage && <Sidebar />}
          
          <main className="flex-1 w-full min-h-screen overflow-y-auto">
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  );
}