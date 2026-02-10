export type ActionResult =
  | { success: true; error?: undefined }
  | { error: string; success?: undefined };
