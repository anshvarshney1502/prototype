"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

const STAGE: Record<string, string> = { interview: "Interview", jobcard: "Job card", trial: "Trial Day", coach: "Coach", live: "Live" };

export default function Recent() {
  const [list, setList] = useState<{ id: string; name: string; stage: string }[] | null>(null);
  useEffect(() => { api<{ id: string; name: string; stage: string }[]>("/api/clinics").then(setList).catch(() => setList([])); }, []);
  if (!list?.length) return null;
  return (
    <section className="pb-16" aria-labelledby="recent">
      <h2 id="recent" className="text-[18px] font-semibold">Your receptionists</h2>
      <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((c) => (
          <li key={c.id}>
            <Link href={`/c/${c.id}`} className="card p-4 flex items-center gap-3 hover:border-line-2">
              <span className="font-medium truncate">{c.name}</span>
              <span className={`ml-auto ${c.stage === "live" ? "badge-pass" : "badge-muted"}`}>{STAGE[c.stage] || c.stage}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
