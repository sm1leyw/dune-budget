import "./globals.css";
import { DataProvider } from "../context/DataContext";
import Sidebar from "../components/shared/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="flex bg-[#f4f7f6] min-h-screen">
        <DataProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  );
}