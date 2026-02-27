import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../features/auth/authSlice";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") as string)
    : null;

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md bg-teal-700 text-white px-3 py-2 hover:bg-teal-800"
      >
        <span className="text-sm">Welcome</span>
        <span className="font-semibold">{user?.name || "User"}</span>
        <span className="ml-1 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg border z-50 overflow-hidden">
          <button
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              navigate("/change-password");
            }}
          >
            <span>🔒</span>
            <span>Change Password</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              dispatch(logout());
              navigate("/login");
            }}
          >
            <span>⏻</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}