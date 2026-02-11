export type ActionResult<T = undefined> =
  | { success: true; error?: undefined; data?: T }
  | { error: string; success?: undefined; data?: undefined };
