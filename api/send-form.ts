import { createHmac } from "node:crypto";

/**
 * Firma verificada contra el `hmac-signature.guard.ts` real:
 *
 *   payload = `${method}:${originalUrl}:${timestamp}:${JSON.stringify(req.body ?? {})}`
 *
 * El guard lee `req.body` — pero en Nest los Guards corren ANTES que los
 * Interceptors (Middleware → Guards → Interceptors → Pipes → Handler), y
 * `FileFieldsInterceptor`/multer es un Interceptor. Como el Content-Type es
 * `multipart/form-data`, ningún body-parser global (que solo mira
 * json/urlencoded) lo toca tampoco. Entonces, en el momento exacto en que
 * el guard evalúa `req.body`, ese valor SIEMPRE es `undefined` → `{}` —
 * sin importar cuántos campos o fotos traiga el multipart real. Por eso
 * firmamos sobre el string literal `"{}"`, no sobre los bytes del body.
 */

const MAX_BODY_BYTES = 4 * 1024 * 1024; // 4 MB — techo propio, más abajo del límite duro de 4.5MB de Vercel

const NEST_API_BASE_URL = process.env.API_BASE_URL!;
const NEST_FORM_PATH = "/email/send-todos-unidos-cali-pereira";
const CLIENT_ID = process.env.EMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET!;

interface SignRequestParams {
  method: string;
  path: string;
  secret: string;
}

function signRequest({ method, path, secret }: SignRequestParams) {
  const timestamp = Date.now().toString();
  const payload = `${method}:${path}:${timestamp}:${JSON.stringify({})}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return { timestamp, signature };
}

class PayloadTooLargeError extends Error {}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
    });

    const responseText = await nestResponse.text();

    if (!nestResponse.ok) {
      console.error("Error backend Coral:", nestResponse.status, responseText);
      try {
        const parsed = JSON.parse(responseText);
        return jsonResponse(nestResponse.status, parsed);
      } catch {
        return jsonResponse(502, { error: "No se pudo enviar el formulario" });
      }
    }

    return jsonResponse(200, { success: true });
  } catch (err) {
    console.error("Error de red llamando a Coral backend:", err);
    return jsonResponse(502, { error: "No se pudo enviar el formulario" });
  }
}