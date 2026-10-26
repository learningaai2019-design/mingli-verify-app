/** Client-side privacy helpers — never persist birth/name PII on the server. */

export const PRIVACY_COPY = {
  banner:
    "私隱優先：出生／姓名等個人資料只留喺呢次瀏覽器記憶體，唔會寫入伺服器資料庫。比對摘要同大事年表可選存 sessionStorage（關分頁即清），唔含出生資料。",
  clear: "清除本機資料",
  cleared: "已清除本頁暫存結果",
  pageTitle: "私隱政策",
};

export function assertNoPersist() {
  return {
    db: false,
    localStoragePII: false,
    cookiesBirth: false,
    serverInputLogs: false,
    sessionOnly: true,
    /** Reading summaries + user-typed life events (no birth/name) may live in sessionStorage. */
    sessionStorageReadingsOnly: true,
  };
}
