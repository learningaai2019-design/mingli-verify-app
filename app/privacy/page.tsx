import { PRIVACY_COPY, assertNoPersist } from "@/lib/shared/privacy";

export default function PrivacyPage() {
  const flags = assertNoPersist();
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-[var(--ac)]">{PRIVACY_COPY.pageTitle}</h1>
      <div className="card p-5 space-y-4 text-sm text-[var(--tx-1)]">
        <p>{PRIVACY_COPY.banner}</p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--tx-2)]">
          <li>冇資料庫（DB = {String(flags.db)}）</li>
          <li>唔會將出生／姓名等 PII 寫入 localStorage（{String(flags.localStoragePII)}）</li>
          <li>唔會用 Cookie 保存出生資料（{String(flags.cookiesBirth)}）</li>
          <li>伺服器 API 路由唔會將輸入內容寫入磁碟日誌（設計目標：{String(!flags.serverInputLogs)}）</li>
          <li>狀態僅存在 React 元件記憶體；重新整理／關閉分頁即清除</li>
          <li>各模組頁面有大顆「{PRIVACY_COPY.clear}」按鈕，可即時清掉本頁結果</li>
        </ul>
        <p className="text-[var(--tx-3)]">
          可選 LLM API key 若存在，亦唔會將含 PII 嘅 prompt 寫入磁碟。請勿喺共用電腦留下未清除嘅畫面截圖。
        </p>
      </div>
    </div>
  );
}
