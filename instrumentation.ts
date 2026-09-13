import type { Instrumentation } from "next";
import { kirimGalat } from "@/lib/galat";

// Server-side error hook (route handlers, server components, actions).
export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  const e = err as { message?: string; stack?: string; digest?: string };
  await kirimGalat({
    sumber: "server",
    pesan: e.message ?? String(err),
    stack: e.stack,
    digest: e.digest,
    url: request.path,
    waktu: new Date().toISOString(),
  });
};
