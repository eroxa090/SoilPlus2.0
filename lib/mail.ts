/**
 * Outgoing mail — currently just the password-reset letter.
 *
 * Sends over SMTP when SMTP_HOST / SMTP_USER / SMTP_PASS are set. With Gmail:
 * SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER=<the address>,
 * SMTP_PASS=<a 16-letter app password, not the account password>.
 *
 * Without SMTP in development the link is printed to the server console so
 * the flow can be tested locally. In production without SMTP nothing is sent
 * and the caller reports that recovery is not configured.
 */

import nodemailer from "nodemailer";

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export type MailResult = "sent" | "logged" | "unconfigured";

export async function sendPasswordResetEmail(to: string, link: string): Promise<MailResult> {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[password-reset] SMTP not configured — reset link for ${to}:\n${link}`);
      return "logged";
    }
    return "unconfigured";
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transport.sendMail({
    from: process.env.MAIL_FROM ?? `SoilPlus <${process.env.SMTP_USER}>`,
    to,
    subject: "SoilPlus — восстановление пароля",
    text: [
      "Здравствуйте!",
      "",
      "Кто-то запросил сброс пароля для вашего аккаунта SoilPlus.",
      "Чтобы задать новый пароль, откройте ссылку:",
      link,
      "",
      "Ссылка действует 1 час и срабатывает один раз.",
      "Если вы не запрашивали сброс — просто проигнорируйте это письмо, пароль останется прежним.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2a24;max-width:480px">
        <p>Здравствуйте!</p>
        <p>Кто-то запросил сброс пароля для вашего аккаунта <b>SoilPlus</b>.</p>
        <p><a href="${link}" style="display:inline-block;background:#3b6d11;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none">Задать новый пароль</a></p>
        <p style="color:#5f6b63;font-size:13px">Ссылка действует 1 час и срабатывает один раз.
        Если вы не запрашивали сброс — просто проигнорируйте письмо, пароль останется прежним.</p>
      </div>`,
  });
  return "sent";
}
