import { createHmac } from "node:crypto";

/**
 * Firma verificada contra el `hmac-signature.guard.ts` real:
 *
 *   payload = `${method}:${originalUrl}:${timestamp}:${JSON.stringify(req.body ?? {})}`
 *
 * El guard lee `req.body`, pero en Nest los Guards corren ANTES que los
 * Interceptors (Middleware → Guards → Interceptors → Pipes → Handler), y
 * `FileFieldsInterceptor`/multer es un Interceptor. Como el Content-Type es
 * `multipart/form-data`, ningún body-parser global lo toca. Por eso, cuando el
 * guard evalúa `req.body`, ese valor es `undefined` → `{}`, y firmamos sobre
 * el string literal `"{}"`, no sobre los bytes del body.
 */

const MAX_BODY_BYTES = 4 * 1024 * 1024; // 4 MB, por debajo del límite de 4.5MB de Vercel

const NEST_API_BASE_URL = process.env.API_BASE_URL!;
const NEST_FORM_PATH = "/email/send-todos-unidos-cali-pereira";
const CLIENT_ID = process.env.EMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET!;

const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 10_000;
const RETRYABLE_STATUS = new Set([502, 503, 504]);

interface SignRequestParams {
  method: string;
  path: string;
  secret: string;
}

function signRequest({ method, path, secret }: SignRequestParams) {
  // Se calcula en cada intento: el guard acepta timestamps de máximo 5 minutos.
  const timestamp = Date.now().toString();
  const payload = `${method}:${path}:${timestamp}:${JSON.stringify({})}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return { timestamp, signature };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class PayloadTooLargeError extends Error {}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Convierte la respuesta de error del backend en la respuesta al cliente,
 * conservando el status real aunque el cuerpo no sea JSON.
 */
function backendErrorResponse(status: number, responseText: string): Response {
  const clientStatus = status >= 400 ? status : 502;
  try {
    const parsed = JSON.parse(responseText);
    return jsonResponse(clientStatus, parsed);
  } catch {
    return jsonResponse(clientStatus, { error: "No se pudo enviar el formulario" });
  }
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return jsonResponse(400, { error: "Se esperaba multipart/form-data" });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse(413, {
      error:
        "El formulario (fotos + documentos) pesa demasiado para enviarse. Quita algunas fotos, o usa el enlace externo para el material más pesado.",
    });
  }

  let rawBody: Buffer;
  try {
    const arrayBuffer = await request.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    rawBody = Buffer.from(arrayBuffer);
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      return jsonResponse(413, {
        error:
          "El formulario (fotos + documentos) pesa demasiado para enviarse. Quita algunas fotos, o usa el enlace externo para el material más pesado.",
      });
    }
    console.error("Error leyendo el body del formulario:", err);
    return jsonResponse(400, { error: "No se pudo leer la solicitud" });
  }

  if (rawBody.length === 0) {
    console.error(
      `[send-form] body vacío. content-length: ${request.headers.get("content-length")}, content-type: ${contentType}, method: ${request.method}`,
    );
    return jsonResponse(400, { error: "La solicitud llegó vacía" });
  }

  console.log(`[send-form] body leído desde request.arrayBuffer(): ${rawBody.length} bytes`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const isLastAttempt = attempt === MAX_ATTEMPTS;
    const { timestamp, signature } = signRequest({
      method: "POST",
      path: `/api${NEST_FORM_PATH}`,
      secret: CLIENT_SECRET,
    });

    try {
      const nestResponse = await fetch(`${NEST_API_BASE_URL}${NEST_FORM_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "x-client-id": CLIENT_ID,
          "x-timestamp": timestamp,
          "x-signature": signature,
        },
        body: rawBody,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });

      const responseText = await nestResponse.text();

      if (nestResponse.ok) {
        return jsonResponse(200, { success: true });
      }

      console.error(
        `[send-form] intento ${attempt}/${MAX_ATTEMPTS} — backend ${nestResponse.status}:`,
        responseText.slice(0, 500),
      );

      if (RETRYABLE_STATUS.has(nestResponse.status) && !isLastAttempt) {
        await sleep(500 * attempt);
        continue;
      }

      return backendErrorResponse(nestResponse.status, responseText);
    } catch (err) {
      console.error(
        `[send-form] intento ${attempt}/${MAX_ATTEMPTS} — error de red o timeout:`,
        err,
      );

      if (!isLastAttempt) {
        await sleep(500 * attempt);
        continue;
      }

      return jsonResponse(502, { error: "No se pudo enviar el formulario" });
    }
  }

  // No se alcanza, pero TypeScript necesita un retorno explícito.
  return jsonResponse(502, { error: "No se pudo enviar el formulario" });
}