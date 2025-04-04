export const ChunkOptionConstants = Object.freeze({
  CSV: {
    SHEET: "sheet",
    ROW: "row",
  },
  CODE: {
    LINE: "line",
    BLOCK: "block", // tree-sitter (ASTs)
    FILE: "file",
    REPO: "repo",
  },
  URL: {
    PAGE: "page",
    SITE: "site",
    HTML: "html", // expects "chunkElements" string array (e.g. ["h1", "section", "p"])
  },
  MARKDOWN: "markdown", // expects "chunkElements" string array (e.g. ["#", "[[", "()[]"])
  PDF: {
    PAGE: "page",
    DOC: "doc",
  },
  TEXT: {
    PARAGRAPH: "paragraph",
    SENTENCE: "sentence",
    LENGTH: "length",
  },
});

export const EmailTemplateTypeConstants = Object.freeze({
  CONFIRM: "confirm",
  RESET: "reset",
});

export const PUBLIC_ID = "1";

export const BrandConstants = Object.freeze({
  USERNAME: "Faith Copilot"
});

export const EntityConstants = Object.freeze({
  EMAIL: "email",
  USER: "uid",
  KEY: "key",
  CODE: "code",
  NOTIFICATION: "notif",
  DATA: "data",
  INDEX: "idx", // index?
  MODEL: "mdl",
  ENV: "env",
  PROFILE_CHAT: "prof#chat",
  PROFILE_SEARCH: "prof#srch",
  APP_CHAT: "app#chat",
  APP_SEARCH: "app#srch",
  SESSION_CHAT: "sess#chat",
  SESSION_SEARCH: "sess#srch",
  WIDGET: "wgt",
  SAFETY: "safe"
});

export const EventConstants = Object.freeze({
  SIGNUP: "signup",
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  PASSWORD_FORGOT: "password_forgot",
  PASSWORD_RESET: "password_reset",
  API_KEY_CREATE: "api_key_create",
  API_KEY_REVOKE: "api_key_revoke",
  API_REQUEST: "api_request",
  App: {
    SEARCH: "search",
    UPLOAD: "upload",
    TOKENS: "tokens",
  },
});

export const GrantTypeConstants = Object.freeze({
  PASSWORD: "password",
  TOKEN_EXCHANGE: "urn:ietf:params:oauth:grant-type:token-exchange",
});

export const LocationConstants = Object.freeze({
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  CONFIRM_EMAIL: "/confirm-email",
  RESET_PASSWORD: "/reset-password",
  MFA: "/mfa",
});

export const SchemaConstants = Object.freeze({
  Email: {
    V1: "email/v1",
  },
  User: {
    V1: "user/v1",
  },
  Code: {
    V1: "code/v1",
  },
});