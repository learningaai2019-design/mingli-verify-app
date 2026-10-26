# 命理核對 · Mingli Verify

Privacy-first Traditional Chinese (HK Cantonese-friendly) web app for **命理顧問 verification**.

The product goal is to **embody chat-quality consultant readings** in the app — not a farm of piecemeal feature patches.

## Product shape

1. **Home** → run modules (八字 / 紫微 first-class)
2. **Module pages** default to full consultant-depth prose
3. **One integrated 「跟進詢問」** box (module pages + compare) reuses the already-computed chart/session — ask about a 大運 decade, a year, 感情/事業, a 宮位
4. **系統比對 + 大事自動核對** on `/compare`
5. Session-only privacy; clear buttons wipe compare cache + chart snapshots

## Privacy

- **No DB**, no PII in `localStorage`, no birth-data cookies, no server disk logs of inputs.
- Chart snapshots for follow-up live in **sessionStorage** (no name / raw birth string); tab close = gone.
- Big **「清除本機資料」** on every module page.
- Details: in-app `/privacy`.

## Modules (reading depth)

| Module | Engine | Default output |
|--------|--------|----------------|
| **八字** | `lunar-javascript` | 十神總覽、格局傾向、用神框架意識 → 性格／學業／事業／財／田宅／父母／兄弟／朋輩／婚姻／子女／健康（早→晚）→ **十年大運** → 流年領域＋逐月 → 口語綜合；跟進詢問 |
| **紫微** | `iztro` | 十二宮人生域＋**四化**提要＋口語綜合；跟進詢問宮／域；披露流派；**非倪師授權** |
| 西洋 | Python `kerykeion` | Tropical Placidus＋行星宮位模板 |
| 人類圖 | same venv | Type / Authority / Profile / Centers / Channels |
| 六爻 | in-house | 一事一問＋用神＋五大纲领 |
| 姓名 | 康熙筆畫 | 五格三才 |

All readings labeled **「規則／模板解讀・文化參考」**.

## Run

```bash
cd /workspace/mingli-verify-app
npm install
npm run dev
```

Open **http://localhost:3456**

Western / Human Design need `/workspace/.venv-astro` (kerykeion). Override with `ASTRO_PYTHON=/path/to/python` if needed.

## 大事核對（/compare）

Enter 2010–2026 life events → App **auto-judges** 中／一半／唔中 by heuristic theme match against cached module readings (prefers **大運** covering that year, then 流年). sessionStorage only.

## Disclaimer

Cultural-reference tooling for consultant QA. Not medical, legal, or investment advice. MIT-licensed original app.

## Known gaps

- 六爻：装卦為簡化版。
- 姓名：康熙筆畫常用字子集。
- 紫微：iztro 排盘＋自研模板，非倪海廈教材。
- 西洋／人類圖：依賴 box `/workspace/.venv-astro`。
- 解讀為規則／模板；可選 LLM key 未強制接入主流程。
