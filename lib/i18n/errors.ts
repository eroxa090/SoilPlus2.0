import type { Lang } from "./dict";

/**
 * User-facing text for the `code` field our API routes put on error
 * responses. Unknown codes fall back to the server's own message.
 */
const ERRORS: Record<Lang, Record<string, string>> = {
  ru: {
    rate_limited: "Слишком много попыток. Подождите минуту и попробуйте снова.",
    invalid_json: "Некорректный запрос. Обновите страницу и попробуйте снова.",
    missing_fields: "Заполните все поля.",
    bad_credentials: "Неверный email или пароль.",
    invalid_email: "Похоже, в email ошибка. Проверьте адрес.",
    short_password: "Пароль должен быть не короче 8 символов.",
    email_taken: "Этот email уже зарегистрирован. Попробуйте войти.",
    signup_failed: "Не удалось создать аккаунт.",
    auth_required: "Сначала войдите или зарегистрируйтесь.",
    bad_quantity: "Количество должно быть от 1 до 100.",
    city_not_found: "Город не найден. Проверьте название.",
    mail_off: "Восстановление по почте пока не настроено. Напишите администратору.",
    mail_failed: "Не удалось отправить письмо. Попробуйте позже.",
    reset_expired: "Ссылка недействительна или устарела. Запросите новую.",
    reset_failed: "Не удалось сменить пароль. Попробуйте позже.",
  },
  en: {
    rate_limited: "Too many attempts. Wait a minute and try again.",
    invalid_json: "Malformed request. Reload the page and try again.",
    missing_fields: "Please fill in every field.",
    bad_credentials: "Wrong email or password.",
    invalid_email: "That email doesn't look right. Please check it.",
    short_password: "The password must be at least 8 characters.",
    email_taken: "This email is already registered. Try logging in.",
    signup_failed: "Couldn't create the account.",
    auth_required: "Please log in or sign up first.",
    bad_quantity: "Quantity must be between 1 and 100.",
    city_not_found: "City not found. Check the name.",
    mail_off: "Password recovery by email isn't set up yet. Contact the administrator.",
    mail_failed: "Couldn't send the email. Try again later.",
    reset_expired: "This link is invalid or has expired. Request a new one.",
    reset_failed: "Couldn't change the password. Try again later.",
  },
};

/** The message to show for a failed API response body. */
export function apiErrorText(lang: Lang, data: unknown, fallback: string): string {
  const o = (data ?? {}) as { code?: unknown; error?: unknown };
  if (typeof o.code === "string" && ERRORS[lang][o.code]) return ERRORS[lang][o.code];
  return typeof o.error === "string" && o.error ? o.error : fallback;
}
