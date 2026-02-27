import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  emailMasked: string;
  expiresIn: number;
  onClose: () => void;
  onSubmit: (otp: string) => void;
};

export default function OtpModal({
  open,
  emailMasked,
  expiresIn,
  onClose,
  onSubmit,
}: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(expiresIn);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    setDigits(Array(6).fill(""));
    setSeconds(expiresIn);
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }, [open, expiresIn]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [open]);

  if (!open) return null;

  const otp = digits.join("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-lg">
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">OTP</h2>
            <p className="text-sm text-gray-600">
              Enter code sent to{" "}
              <span className="font-medium">{emailMasked}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="text-sm font-medium mb-2">6-Digit Code</div>

          <div className="flex gap-3 mb-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                value={d}
                maxLength={1}
                inputMode="numeric"
                className="w-12 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const next = [...digits];
                  next[i] = val;
                  setDigits(next);
                  if (val && i < 5) inputsRef.current[i + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0)
                    inputsRef.current[i - 1]?.focus();
                }}
              />
            ))}
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Resend OTP in {seconds} seconds
          </div>

          <button
            disabled={otp.length !== 6}
            onClick={() => onSubmit(otp)}
            className="w-full h-11 rounded-md bg-teal-600 text-white font-semibold disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
