export type Level = "info" | "warn" | "error";

export const log = (
  level: Level,
  msg: string,
  meta: Record<string, unknown> = {},
) =>
  console.log(
    JSON.stringify({ t: new Date().toISOString(), level, msg, ...meta }),
  );
