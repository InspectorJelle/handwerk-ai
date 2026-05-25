export const DEFAULT_DEV_USER_ID = "00000000-0000-4000-8000-000000000001";

export function getDevUserId(): string {
  return process.env.DEV_USER_ID ?? DEFAULT_DEV_USER_ID;
}
