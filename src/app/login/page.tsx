"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "../../context/DataContext";

export default function LoginPage() {
  const [email, setEmail] = useState("phuvaness.imr@spumail.net");
  const [password, setPassword] = useState("123");
  const [error, setError] = useState("");
  const { login } = useData();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E5EFEA] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md border border-[#C2D8CD]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1F5441]">Dune Budget</h1>
          <p className="text-sm text-gray-500">ระบบยื่นขออนุมัติงบประมาณ (Sandworm)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">อีเมลองค์กร</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-[#1F5441] focus:outline-none"
              placeholder="name.sur@spumail.net"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-[#1F5441] focus:outline-none"
              required
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-[#1F5441] py-2.5 text-sm font-semibold text-white transition hover:bg-[#184334]"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-6 border-t pt-4 text-xs text-gray-500 space-y-1">
          <p className="font-semibold">สลับ Role ทดสอบได้ด้วยอีเมล:</p>
          <p>• พนักงาน: phuvaness.imr@spumail.net</p>
          <p>• บัญชี: nanthipat.jen@spumail.net</p>
          <p>• หัวหน้าแผนก: montawat.cha@spumail.net</p>
          <p>• ผู้บริหาร: suriya.saa@spumail.net</p>
        </div>
      </div>
    </div>
  );
}