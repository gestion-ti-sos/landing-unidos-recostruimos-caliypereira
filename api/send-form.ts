import { createHmac } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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
const MAX_BODY_BYTES = 4 * 1024 * 1024;

const NEST_API_BASE_URL = process.env.API_BASE_URL!;
const NEST_FORM_PATH = "/email/send-todos-unidos-cali-pereira";
const CLIENT_ID = process.env.EMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET!;

class PayloadTooLargeError extends Error {}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const declaredLength = Number(req.headers["content-length"] ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }
 
  const chunks: Buffer[] = [];
  let totalSize = 0;
 
  for await (const chunk of req) {
    const buf: Buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalSize += buf.length;
    if (totalSize > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    chunks.push(buf);
  }
 
  return Buffer.concat(chunks);
}

function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return sendJson(res, 400, { error: "Se esperaba multipart/form-data" });
  }

  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      return sendJson(res, 413, {
        error:
          "El formulario (fotos + documentos) pesa demasiado para enviarse. Quita algunas fotos, o usa el enlace externo para el material más pesado.",
      });
    }
    console.error("Error leyendo el body del formulario:", err);
    return sendJson(res, 400, { error: "No se pudo leer la solicitud" });
  }
 
  if (rawBody.length === 0) {
    return sendJson(res, 400, { error: "La solicitud llegó vacía" });
  }
 
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
      // Los BadRequestException de Nest (DTO inválido, archivo no permitido,
      // tope de tamaño superado) ya vienen como JSON legible — los
      // reenviamos tal cual para que el formulario pueda mostrar el motivo
      // real en vez de un error genérico.
      try {
        const parsed = JSON.parse(responseText);
        return sendJson(res, nestResponse.status, parsed);
      } catch {
        return sendJson(res, 502, { error: "No se pudo enviar el formulario" });
      }
    }
 
    return sendJson(res, 200, { success: true });
  } catch (err) {
    console.error("Error de red llamando a Coral backend:", err);
    return sendJson(res, 502, { error: "No se pudo enviar el formulario" });
  }
}
