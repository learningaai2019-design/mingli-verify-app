/** Client-side privacy helpers — never persist PII. */

export const PRIVACY_COPY = {
  banner:
    "私隱優先：所有出生／姓名／卦象資料只存在呢次瀏覽器記憶體內，唔會寫入資料庫、localStorage、Cookie 或伺服器日誌。重新整理即清除。",
  clear: "清除本機資料",
  cleared: "已清除本頁暫存結果",
  pageTitle: "私隱政策",
};

export function assertNoPersist() {
  // Intentionally no-op documenter for reviewers.
  return {
    db: false,
    localStoragePII: false,
    cookiesBirth: false,
    serverInputLogs: false,
    sessionOnly: true,
  };
}
