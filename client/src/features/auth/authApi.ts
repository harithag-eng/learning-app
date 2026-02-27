import { apiClient } from "../../api/apiClient";

export const requestOtpApi = async (email: string, name?: string) => {
  const res = await apiClient.post("/auth/request-otp", { email, name });
  return res.data as {
    message: string;
    email: string;
    expires_in_seconds: number;
  };
};

export const verifyOtpApi = async (email: string, otp: string) => {
  const res = await apiClient.post("/auth/verify-otp", { email, otp });
  return res.data as {
    message: string;
    token: string;
    user: { id: number; name?: string; email: string };
  };
};
