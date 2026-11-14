/** 에러 응답 형식 (가정) — 백엔드와 합의 필요 */
export interface ApiErrorBody {
  code: string;
  message: string;
}
