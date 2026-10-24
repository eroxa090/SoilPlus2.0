import type { Lang } from "../dict";

const ru = {
  loginTitle: "Вход",
  loginSub: "С возвращением в SoilPlus",
  signupTitle: "Регистрация",
  signupSub: "Все ИИ-функции SoilPlus бесплатно",
  name: "Имя",
  email: "Email",
  password: "Пароль",
  passwordNew: "Пароль (минимум 8 символов)",
  login: "Войти",
  loggingIn: "Входим…",
  signup: "Создать аккаунт",
  signingUp: "Создаём аккаунт…",
  loginFailed: "Не удалось войти.",
  signupFailed: "Не удалось создать аккаунт.",
  network: "Сетевая ошибка",
  noAccount: "Нет аккаунта?",
  toSignup: "Зарегистрироваться",
  haveAccount: "Уже есть аккаунт?",
  toLogin: "Войти",
  privacy:
    "Регистрируясь, вы соглашаетесь, что мы храним email и хэш пароля для доступа к аккаунту. Пароль хэшируется PBKDF2 (100 000 итераций, SHA-512).",
};

const en: typeof ru = {
  loginTitle: "Log in",
  loginSub: "Welcome back to SoilPlus",
  signupTitle: "Sign up",
  signupSub: "Every SoilPlus AI feature, free",
  name: "Name",
  email: "Email",
  password: "Password",
  passwordNew: "Password (at least 8 characters)",
  login: "Log in",
  loggingIn: "Logging in…",
  signup: "Create account",
  signingUp: "Creating account…",
  loginFailed: "Couldn't log in.",
  signupFailed: "Couldn't create the account.",
  network: "Network error",
  noAccount: "No account yet?",
  toSignup: "Sign up",
  haveAccount: "Already have an account?",
  toLogin: "Log in",
  privacy:
    "By signing up you agree that we store your email and a password hash to give you access. Passwords are hashed with PBKDF2 (100,000 iterations, SHA-512).",
};

export const AUTH: Record<Lang, typeof ru> = { ru, en };
