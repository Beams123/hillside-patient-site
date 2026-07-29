import {
  getMaximumMealOrderRequestCharacters,
  getMealOrderMode,
  sendMealOrderToDestination,
  validateMealOrder,
  type MealOrderPayload,
} from "@/lib/meal-orders";

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
  const mode = getMealOrderMode();

  if (mode === "unavailable") {
    return jsonResponse(
      {
        ok: false,
        message:
          "Online meal requests are not active yet. Please use the paper request sheet.",
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

  const declaredLength = Number(request.headers.get("content-length"));
  const maximumCharacters = getMaximumMealOrderRequestCharacters();

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumCharacters
  ) {
    return jsonResponse(
      { ok: false, message: "This request is too large." },
      413,
    );
  }

  let payload: MealOrderPayload;

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
        { ok: false, message: "The meal request could not be read." },
        400,
      );
    }

    payload = parsedPayload as MealOrderPayload;
  } catch {
    return jsonResponse(
      { ok: false, message: "The meal request could not be read." },
      400,
    );
  }

  const validation = await validateMealOrder(payload);

  if (!validation.ok) {
    return jsonResponse(
      { ok: false, message: validation.message },
      validation.status,
    );
  }

  if (mode === "test") {
    return jsonResponse(
      {
        ok: true,
        test: true,
        receipt: `TEST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        submittedAt: new Date().toISOString(),
      },
      201,
    );
  }

  const destinationResult = await sendMealOrderToDestination(
    validation.order,
  );

  if (!destinationResult.ok) {
    return jsonResponse(
      {
        ok: false,
        message:
          "The request could not be safely recorded. Please use the paper request sheet and tell RS staff.",
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
