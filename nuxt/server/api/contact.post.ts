import { buildContactEmail, type ContactDetails } from "~/server/utils/contactEmail.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limits = {
  name: 80,
  email: 160,
  phone: 40,
  message: 4000
} as const;

type RawPayload = Partial<Record<keyof ContactDetails | "company" | "website", unknown>>;

function asCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cap(value: string, max: number) {
  return value.slice(0, max);
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody<RawPayload>(event);

  if (asCleanString(body.company) || asCleanString(body.website)) {
    return { ok: true };
  }

  const details: ContactDetails = {
    firstName: cap(asCleanString(body.firstName), limits.name),
    lastName: cap(asCleanString(body.lastName), limits.name),
    email: cap(asCleanString(body.email).toLowerCase(), limits.email),
    phone: cap(asCleanString(body.phone), limits.phone),
    message: cap(asCleanString(body.message), limits.message),
    newsletter: body.newsletter === true,
    locale: asCleanString(body.locale) || "tr",
    branch: cap(asCleanString(body.branch), limits.name) || undefined,
    source: cap(asCleanString(body.source), limits.email) || undefined
  };

  // Ad zorunlu; iletişim için e-posta VEYA telefon yeterli. Footer formunda
  // e-posta yok (telefon var); contact.vue'da e-posta var — ikisi de geçerli.
  if (!details.firstName || (!details.email && !details.phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name and an email or phone number are required."
    });
  }

  if (details.firstName.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please enter a valid name."
    });
  }

  // E-posta verildiyse formatı geçerli olmalı (footer'da boş gelebilir).
  if (details.email && !emailPattern.test(details.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "A valid email address is required."
    });
  }

  if (!config.brevoApiKey || !config.contactFromEmail || !config.contactToEmail) {
    throw createError({
      statusCode: 500,
      statusMessage: "Mail provider is not configured."
    });
  }

  const mail = buildContactEmail(details);
  const replyToName = [details.firstName, details.lastName].filter(Boolean).join(" ");

  const mailPayload: Record<string, unknown> = {
    sender: {
      name: String(config.contactFromName || "Kardoor Website"),
      email: String(config.contactFromEmail)
    },
    to: [
      {
        email: String(config.contactToEmail)
      }
    ],
    subject: mail.subject,
    textContent: mail.text,
    htmlContent: mail.html
  };

  // replyTo yalnızca geçerli e-posta varsa — Brevo boş replyTo'yu reddeder.
  if (details.email) {
    mailPayload.replyTo = { email: details.email, name: replyToName };
  }

  let response: Response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": String(config.brevoApiKey),
        "content-type": "application/json"
      },
      body: JSON.stringify(mailPayload),
      signal: AbortSignal.timeout(10_000)
    });
  } catch (error) {
    console.error("Contact mail request failed:", error);
    throw createError({
      statusCode: 502,
      statusMessage: "Mail provider did not respond."
    });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Contact mail rejected:", response.status, detail);
    throw createError({
      statusCode: 502,
      statusMessage: "Mail provider rejected the contact request."
    });
  }

  return { ok: true };
});
