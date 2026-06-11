import { Resend } from "resend";

type Attachment = {
  filename: string;
  content: Buffer | string;
};

type SendMailOpts = {
  to: string;
  cc?: string | string[];
  // Optional override for the From header. When omitted, falls back to
  // MAIL_FROM. Note that Resend requires the From domain to be verified
  // on the account, so passing an arbitrary email may fail at send time.
  from?: string;
  subject: string;
  text: string;
  attachments?: Attachment[];
};

// Returns the configured default sender (MAIL_FROM) so the client can
// pre-fill the Mittente field of the supplier-email dialog.
export function getMailFromDefault(): string | null {
  return process.env.MAIL_FROM ?? null;
}

// Thin wrapper around Resend's SDK that returns a discriminated result
// instead of throwing. Read env vars lazily so the module can be imported
// in environments where Resend isn't configured (e.g. local dev without
// the API key) without crashing at startup.
export async function sendMail(
  opts: SendMailOpts,
): Promise<{ ok: true; id?: string } | { error: string }> {
  if (process.env.DEMO_MODE === "true") {
    return { error: "Ambiente demo: invio email disabilitato" };
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = opts.from?.trim() || process.env.MAIL_FROM;
  if (!apiKey) return { error: "RESEND_API_KEY non configurata" };
  if (!from) return { error: "MAIL_FROM non configurata" };

  try {
    const resend = new Resend(apiKey);
    const ccList = opts.cc == null ? [] : Array.isArray(opts.cc) ? opts.cc : [opts.cc];
    const { data, error } = await resend.emails.send({
      from,
      to: [opts.to],
      ...(ccList.length > 0 ? { cc: ccList } : {}),
      subject: opts.subject,
      text: opts.text,
      ...(opts.attachments ? { attachments: opts.attachments } : {}),
    });
    if (error) return { error: error.message || "Errore invio email" };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore invio email" };
  }
}
