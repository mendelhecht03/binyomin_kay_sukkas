export function jsonResponse(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

export function cleanText(value, maximumLength = 4000) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maximumLength);
}

export async function readFormData(request) {
  try {
    return { ok: true, formData: await request.formData() };
  } catch {
    return {
      ok: false,
      response: jsonResponse({ ok: false, message: "The submitted form could not be read." }, 400),
    };
  }
}
