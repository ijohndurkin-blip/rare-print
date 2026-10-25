"use client";

import dynamic from "next/dynamic";

// The canvas editor depends on browser APIs, so it is never server-rendered.
const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-slate-100">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
        <p className="text-sm font-medium">Opening the design studio…</p>
      </div>
    </div>
  ),
});

export function StudioLoader({ productId }: { productId: string }) {
  return <Studio productId={productId} />;
}
