"use client";

import { usePathname } from "next/navigation";
import { DataProvider } from "../context/DataContext";
import Sidebar from "../components/shared/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50 flex">
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