export type ContactDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  newsletter: boolean;
  locale: string;
};

export type ContactEmail = {
  subject: string;
  text: string;
  html: string;
};

const theme = {
  pageBg: "#f6f2ea",
  cardBg: "#fffaf2",
  ink: "#151719",
  headerBg: "#111417",
  headerInk: "#fffaf2",
  muted: "#7a7166",
  mutedInk: "#cfc8bc",
  hair: "#e5dccf",
  hairStrong: "#d8d0c2",
  accent: "#d71920",
  eyebrow: "#d71920"
};

type Copy = {
  brand: string;
  heading: string;
  intro: string;
  customer: string;
  email: string;
  phone: string;
  message: string;
  newsletter: string;
  source: string;
  reply: string;
  call: string;
  footer: string;
  yes: string;
  no: string;
  subject: (name: string) => string;
};

const copy: Record<"tr" | "en", Copy> = {
  tr: {
    brand: "Ege Kardoor",
    heading: "Yeni proje talebi",
    intro: "İletişim formundan yeni bir başvuru geldi.",
    customer: "Müşteri",
    email: "E-posta",
    phone: "Telefon",
    message: "Mesaj",
    newsletter: "Bülten",
    source: "Kaynak",
    reply: "Yanıtla",
    call: "Ara",
    footer: "Kardoor web sitesi iletişim formu tarafından otomatik oluşturuldu.",
    yes: "Evet",
    no: "Hayır",
    subject: (name) => `Kardoor proje talebi: ${name}`
  },
  en: {
    brand: "Ege Kardoor",
    heading: "New project request",
    intro: "A new enquiry just arrived from the contact form.",
    customer: "Client",
    email: "Email",
    phone: "Phone",
    message: "Message",
    newsletter: "Newsletter",
    source: "Source",
    reply: "Reply",
    call: "Call",
    footer: "Generated automatically by the Kardoor website contact form.",
    yes: "Yes",
    no: "No",
    subject: (name) => `Kardoor project request: ${name}`
  }
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizePhoneHref(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");
  const hasLeadingPlus = cleaned.startsWith("+");
  const digits = cleaned.replace(/\+/g, "");

  if (!digits) return "";
  return hasLeadingPlus ? `+${digits}` : digits;
}

function field(label: string, valueHtml: string, last = false) {
  return `
  <tr>
    <td style="padding:15px 0;${last ? "" : `border-bottom:1px solid ${theme.hair};`}">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:112px;vertical-align:top;font-size:11px;color:${theme.muted};letter-spacing:0.12em;text-transform:uppercase;font-weight:800;">${label}</td>
          <td style="vertical-align:top;font-size:16px;line-height:1.4;font-weight:700;color:${theme.ink};">${valueHtml}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function buildContactEmail(details: ContactDetails): ContactEmail {
  const lang: "tr" | "en" = details.locale.toLowerCase().startsWith("en") ? "en" : "tr";
  const t = copy[lang];

  const fullName = [details.firstName, details.lastName].filter(Boolean).join(" ");
  const newsletter = details.newsletter ? t.yes : t.no;
  const subject = t.subject(fullName);
  const source = "kardoor.com/contact";

  const text = [
    t.heading,
    "",
    `${t.customer}: ${fullName}`,
    `${t.email}: ${details.email}`,
    `${t.phone}: ${details.phone || "-"}`,
    `${t.newsletter}: ${newsletter}`,
    `Locale: ${details.locale.toUpperCase()}`,
    `${t.source}: ${source}`,
    "",
    `${t.message}:`,
    details.message
  ].join("\n");

  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(details.email);
  const safePhone = escapeHtml(details.phone || "-");
  const safeMessage = escapeHtml(details.message).replaceAll("\n", "<br>");
  const safeNewsletter = escapeHtml(newsletter);
  const safeLocale = escapeHtml(details.locale.toUpperCase());
  const safeSource = escapeHtml(source);
  const mailtoHref = escapeHtml(
    `mailto:${details.email}?subject=${encodeURIComponent(`Re: ${subject}`)}`
  );
  const normalizedPhone = normalizePhoneHref(details.phone);
  const phoneHref = normalizedPhone ? `tel:${normalizedPhone}` : "";

  const html = `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:${theme.pageBg};color:${theme.ink};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${theme.pageBg};">
      <tr>
        <td align="center" style="padding:24px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:${theme.cardBg};border:1px solid ${theme.hairStrong};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;background:${theme.headerBg};color:${theme.headerInk};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:12px;line-height:1;letter-spacing:0.2em;text-transform:uppercase;color:${theme.eyebrow};font-weight:800;">${escapeHtml(t.brand)}</td>
                    <td align="right" style="font-size:11px;line-height:1;color:${theme.mutedInk};letter-spacing:0.06em;">${safeLocale}</td>
                  </tr>
                </table>
                <div style="margin-top:18px;font-size:27px;line-height:1.16;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(t.heading)}</div>
                <div style="margin-top:8px;height:2px;width:42px;background:${theme.accent};border-radius:2px;"></div>
                <div style="margin-top:12px;color:${theme.mutedInk};font-size:14px;line-height:1.5;">${escapeHtml(t.intro)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:0 0 16px;border-bottom:1px solid ${theme.hairStrong};">
                      <div style="font-size:11px;color:${theme.muted};letter-spacing:0.14em;text-transform:uppercase;font-weight:800;">${escapeHtml(t.customer)}</div>
                      <div style="margin-top:6px;font-size:24px;line-height:1.2;color:${theme.ink};font-weight:800;">${safeName}</div>
                    </td>
                  </tr>
                  ${field(
                    escapeHtml(t.email),
                    `<a href="mailto:${safeEmail}" style="color:${theme.ink};text-decoration:none;">${safeEmail}</a>`
                  )}
                  ${field(
                    escapeHtml(t.phone),
                    phoneHref
                      ? `<a href="${escapeHtml(phoneHref)}" style="color:${theme.ink};text-decoration:none;">${safePhone}</a>`
                      : safePhone,
                    true
                  )}
                  <tr>
                    <td style="padding:18px 0 0;">
                      <div style="font-size:11px;color:${theme.muted};letter-spacing:0.14em;text-transform:uppercase;font-weight:800;">${escapeHtml(t.message)}</div>
                      <div style="margin-top:10px;border-left:3px solid ${theme.accent};padding:6px 0 6px 16px;color:${theme.ink};font-size:17px;line-height:1.6;">${safeMessage}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${theme.hairStrong};border-bottom:1px solid ${theme.hairStrong};">
                  <tr>
                    <td style="padding:14px 0;width:50%;">
                      <div style="font-size:10px;color:${theme.muted};letter-spacing:0.12em;text-transform:uppercase;font-weight:800;">${escapeHtml(t.newsletter)}</div>
                      <div style="margin-top:4px;font-size:14px;color:${theme.ink};">${safeNewsletter}</div>
                    </td>
                    <td style="padding:14px 0;width:50%;">
                      <div style="font-size:10px;color:${theme.muted};letter-spacing:0.12em;text-transform:uppercase;font-weight:800;">${escapeHtml(t.source)}</div>
                      <div style="margin-top:4px;font-size:14px;color:${theme.ink};">${safeSource}</div>
                    </td>
                  </tr>
                </table>
                <a href="${mailtoHref}" style="display:inline-block;margin-top:20px;padding:12px 18px;background:${theme.headerBg};color:${theme.headerInk};border-radius:9px;text-decoration:none;font-size:14px;font-weight:800;">${escapeHtml(t.reply)}</a>
                ${
                  phoneHref
                    ? `<a href="${escapeHtml(phoneHref)}" style="display:inline-block;margin-top:20px;margin-left:8px;padding:11px 17px;border:1px solid ${theme.headerBg};color:${theme.ink};border-radius:9px;text-decoration:none;font-size:14px;font-weight:800;">${escapeHtml(t.call)}</a>`
                    : ""
                }
              </td>
            </tr>
          </table>
          <div style="max-width:620px;margin:12px auto 0;color:#8a8278;font-size:11px;line-height:1.5;text-align:center;">${escapeHtml(t.footer)}</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
