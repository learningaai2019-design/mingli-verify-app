"use client";
import { useState } from "react";
import type { BirthInput, Gender } from "@/lib/shared/types";

export interface BirthFormProps {
  onSubmit: (input: BirthInput) => void;
  loading?: boolean;
  showName?: boolean;
  submitLabel?: string;
}

const HK = { place: "香港", lat: 22.3193, lng: 114.1694 };

export default function BirthForm({
  onSubmit,
  loading,
  showName = false,
  submitLabel = "開始分析",
}: BirthFormProps) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("1990");
  const [month, setMonth] = useState("5");
  const [day, setDay] = useState("10");
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("0");
  const [gender, setGender] = useState<Gender>("female");
  const [useTrueSolar, setUseTrueSolar] = useState(true);
  const [lng, setLng] = useState(String(HK.lng));
  const [lat, setLat] = useState(String(HK.lat));
  const [place, setPlace] = useState(HK.place);

  return (
    <form
      className="card p-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name: name || undefined,
          year: parseInt(year, 10),
          month: parseInt(month, 10),
          day: parseInt(day, 10),
          hour: parseInt(hour, 10),
          minute: parseInt(minute, 10),
          gender,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          place,
          useTrueSolar,
          timezone: "Asia/Hong_Kong",
        });
      }}
    >
      {showName && (
        <div>
          <label className="label">稱呼（可選・唔會儲存）</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="僅本頁顯示" />
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          ["年", year, setYear],
          ["月", month, setMonth],
          ["日", day, setDay],
          ["時", hour, setHour],
          ["分", minute, setMinute],
        ].map(([label, val, set]) => (
          <div key={label as string}>
            <label className="label">{label as string}</label>
            <input
              className="input"
              type="number"
              value={val as string}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
              required
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="label">性別</label>
          <div className="flex gap-2">
            {(["female", "male"] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                className="px-3 py-1.5 rounded-full text-sm border"
                style={{
                  borderColor: gender === g ? "var(--ac-bdr)" : "var(--bdr)",
                  background: gender === g ? "var(--ac-bg)" : "transparent",
                  color: gender === g ? "var(--ac)" : "var(--tx-2)",
                }}
                onClick={() => setGender(g)}
              >
                {g === "female" ? "女" : "男"}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--tx-2)] mt-5">
          <input type="checkbox" checked={useTrueSolar} onChange={(e) => setUseTrueSolar(e.target.checked)} />
          真太陽時（按經度）
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">地點</label>
          <input className="input" value={place} onChange={(e) => setPlace(e.target.value)} />
        </div>
        <div>
          <label className="label">緯度</label>
          <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} />
        </div>
        <div>
          <label className="label">經度</label>
          <input className="input" value={lng} onChange={(e) => setLng(e.target.value)} />
        </div>
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "計算中…" : submitLabel}
      </button>
    </form>
  );
}
