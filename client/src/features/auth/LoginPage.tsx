import { useState } from "react";
import { requestOtpApi, verifyOtpApi } from "./authApi";
import OtpModal from "./OtpModal";
import { useAppDispatch } from "../../store/hooks";
import { setAuth } from "./authSlice";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const [otpOpen, setOtpOpen] = useState(false);
  const [emailMasked, setEmailMasked] = useState("");
  const [expiresIn, setExpiresIn] = useState(300);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const sendOtp = async () => {
    try {
      setLoading(true);
      const res = await requestOtpApi(email, name);
      setEmailMasked(res.email);
      setExpiresIn(res.expires_in_seconds);
      setOtpOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setLoading(true);
    try {
      const res = await verifyOtpApi(email, otp);
      dispatch(setAuth({ token: res.token, user: res.user }));
      setOtpOpen(false);
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="text-3xl font-bold">ARC</div>
        </div>

        <label className="text-sm font-medium">Email Address</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="mt-2 mb-4 w-full border rounded-md px-3 h-11"
        />

        <label className="text-sm font-medium">Name (optional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="mt-2 mb-6 w-full border rounded-md px-3 h-11"
        />

        <button
          onClick={sendOtp}
          disabled={!email || !name || loading}
          className="w-full h-11 rounded-md bg-teal-700 text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Sending..." : "Continue (Send OTP)"}
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          Privacy Policy • App Version 1.0
        </div>
      </div>

      <OtpModal
        open={otpOpen}
        emailMasked={emailMasked}
        expiresIn={expiresIn}
        onClose={() => setOtpOpen(false)}
        onSubmit={verifyOtp}
      />
    </div>
  );
}
