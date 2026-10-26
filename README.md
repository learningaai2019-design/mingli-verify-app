# 命理核對 · Mingli Verify

Privacy-first Traditional Chinese (HK Cantonese-friendly) web app for **命理顧問 verification**.

Let others input birth / name / 卦 data and run analyses across all modules to spot-check accuracy — **without storing personal data**.

## Privacy

- **No DB**, no PII in `localStorage`, no birth-data cookies, no server disk logs of inputs.
- State lives in React memory / request lifetime only. Refresh = gone.
- Big **「清除本機資料」** button on every module page.
- Details: in-app `/privacy`.

## Modules

| Module | Engine | Notes |
|--------|--------|-------|
| 八字 | `lunar-javascript` | 四柱、真太陽時、十二領域＋流年貴小人／逐月 |
| 紫微 | `iztro` | 排盘＋宮位模板；披露流派；**非倪師授權／非專有數據集** |
| 西洋 | Python `kerykeion` via `/workspace/.venv-astro` | Tropical Placidus |
| 人類圖 | same venv + gate wheel | Type / Authority / Profile / Centers / Channels |
| 六爻 | in-house | 铜钱／手動／時間；用神；五大纲领短判；愚人公開線 disclaimer |
| 姓名 | 康熙筆畫表 | 五格三才；熊崎系華語主流 disclosure |

All readings are labeled **「規則／模板解讀・文化參考」**. Optional `OPENAI_API_KEY` / Anthropic env vars are never required and never write PII prompts to disk.

## Run

```bash
cd /workspace/mingli-verify-app
npm install
npm run dev
```

Open **http://localhost:3456**

Western / Human Design need `/workspace/.venv-astro` (kerykeion). Override with `ASTRO_PYTHON=/path/to/python` if needed.

## Disclaimer

Cultural-reference tooling for consultant QA. Not medical, legal, or investment advice. MIT-licensed original app; visual patterns inspired by public demo aesthetics only.

## Known gaps

- 六爻：装卦為簡化版（未完整排出六親／六神／伏神／動爻細節表）。
- 姓名：康熙筆畫表為常用字子集；缺字標 `fallback` 估算，需人工覆核辭典。複姓規則簡化。
- 紫微：排盘用 `iztro`，解讀為自研模板，非倪海廈教材／專有數據。
- 西洋／人類圖：依賴 box 上 `/workspace/.venv-astro`（kerykeion）。
- 解讀全部為規則／模板；可選 LLM key 未強制接入主流程。

## UI / 系統比對 (2026-10)

- Warm light theme + subtle decorative SVG background (`public/bg-pattern.svg`).
- `/compare`「系統比對」: after running 2+ modules, side-by-side matrix / cards across domains.
- Compare cache: **sessionStorage** holds reading summaries only (no birth dates / names). Cleared on tab close or via clear buttons.
