import {
  getMaximumPatientRequestCharacters,
  getPatientRequestMode,
  sendPatientRequestToDestination,
  validatePatientRequest,
  type PatientRequestPayload,
} from "@/lib/patient-requests";

export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return process.env.NODE_ENV === "development";
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);

    return (
      originUrl.host.toLowerCase() === requestUrl.host.toLowerCase() &&
      (process.env.NODE_ENV === "development" ||
        (originUrl.protocol === "https:" &&
          requestUrl.protocol === "https:"))
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  const mode = getPatientRequestMode();

  if (mode === "unavailable") {
    return jsonResponse(
      {
        ok: false,
        message:
          "Online requests are not active yet. Please use the current paper process.",
      },
      503,
    );
  }

  if (!isSameOrigin(request)) {
    return jsonResponse(
      {
        ok: false,
        message: "This request could not be verified.",
      },
      403,
    );
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return jsonResponse(
      { ok: false, message: "This request format is not supported." },
      415,
    );
  }

  const maximumCharacters = getMaximumPatientRequestCharacters();
  const declaredLength = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumCharacters
  ) {
    return jsonResponse(
      { ok: false, message: "This request is too large." },
      413,
    );
  }

  let payload: PatientRequestPayload;

  try {
    const requestText = await request.text();

    if (requestText.length > maximumCharacters) {
      return jsonResponse(
        { ok: false, message: "This request is too large." },
        413,
      );
    }

    const parsedPayload: unknown = JSON.parse(requestText);

    if (
      typeof parsedPayload !== "object" ||
      parsedPayload === null ||
      Array.isArray(parsedPayload)
    ) {
      return jsonResponse(
        { ok: false, message: "The request could not be read." },
        400,
      );
    }

    payload = parsedPayload as PatientRequestPayload;
  } catch {
    return jsonResponse(
      { ok: false, message: "The request could not be read." },
      400,
    );
  }

  const validation = validatePatientRequest(payload);

  if (!validation.ok) {
    return jsonResponse(
      { ok: false, message: validation.message },
      validation.status,
    );
  }

  if (mode === "test") {
    const prefix =
      validation.request.kind === "grievance"
        ? "GRV"
        : validation.request.kind === "package"
          ? "PKG"
          : "VIS";

    return jsonResponse(
      {
        ok: true,
        test: true,
        receipt: `TEST-${prefix}-${crypto.randomUUID()
          .slice(0, 8)
          .toUpperCase()}`,
        submittedAt: new Date().toISOString(),
      },
      201,
    );
  }

  const destinationResult = await sendPatientRequestToDestination(
    validation.request,
  );

  if (!destinationResult.ok) {
    return jsonResponse(
      {
        ok: false,
        message:
          "The request could not be safely recorded. Please use the current paper process and tell staff.",
      },
      503,
    );
  }

  return jsonResponse(
    {
      ok: true,
      test: false,
      receipt: destinationResult.receipt,
      submittedAt: destinationResult.submittedAt,
    },
    201,
  );
}
