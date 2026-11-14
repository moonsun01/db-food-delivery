import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "@/app/_lib/types/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: API_URL,
  // JWT를 httpOnly 쿠키로 받는 경우를 대비 (인증 방식 합의 후 확정)
  withCredentials: true,
  timeout: 10_000,
});

/**
 * MSW를 쓸 때는 워커가 준비될 때까지 요청을 잠깐 붙잡아 둔다.
 * (준비 전에 나간 요청은 MSW를 거치지 않고 실제 서버로 가서 실패하기 때문)
 */
const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
let resolveMockReady: (() => void) | undefined;
const mockReady: Promise<void> =
  MOCKING_ENABLED && typeof window !== "undefined"
    ? new Promise((resolve) => (resolveMockReady = resolve))
    : Promise.resolve();

/** MswStarter에서 워커 시작 후 호출 */
export function markMockReady() {
  resolveMockReady?.();
}

apiClient.interceptors.request.use(async (config) => {
  await mockReady;
  return config;
});

/** 화면에서 쓰기 쉬운 형태로 정리한 에러 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    return Promise.reject(
      new ApiError(
        status,
        body?.code ?? "UNKNOWN",
        body?.message ?? "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
      ),
    );
  },
);
