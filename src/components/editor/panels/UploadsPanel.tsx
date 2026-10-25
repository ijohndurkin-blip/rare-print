"use client";

import { useRef, useState } from "react";
import { Upload, Sparkles } from "lucide-react";
import { useEditor } from "../context";
import { svgToObject } from "../engine";

const MAX_EDGE = 8000;

function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Downscale gigantic photos so the browser stays responsive. */
async function normalise(dataUrl: string): Promise<{ src: string; w: number; h: number }> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  if (scale === 1) return { src: dataUrl, w, h };
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return { src: c.toDataURL("image/png"), w: c.width, h: c.height };
}

export function UploadsPanel() {
  const { library, addToLibrary, addImage, addObject, dims, product, toast, openPanel } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.type === "image/svg+xml") {
          const group = await svgToObject(await file.text());
          const scale = Math.min((dims.W * 0.6) / group.width, (dims.H * 0.6) / group.height);
          group.scale(scale);
          addObject(group);
          continue;
        }
        if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
          toast(`${file.name}: please upload a PNG, JPG, WEBP or SVG file. Got a PDF? Attach it when you order.`, "error");
          continue;
        }
        const { src, w } = await normalise(await readAsDataURL(file));
        addToLibrary({ src, label: file.name, kind: "upload" });
        await addImage(src);
        const dpiFull = (w / dims.widthMm) * 25.4;
        if (dpiFull < product.minDpi) {
          toast(`${file.name} is quite small. It will look best used small rather than across the whole design.`, "info");
        }
      }
    } catch {
      toast("Sorry, that file couldn't be read.", "error");
    } finally {
      setBusy(false);
    }
  };

  const uploads = library.filter((l) => l.kind === "upload");
  const ai = library.filter((l) => l.kind === "ai");

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-brand bg-brand/5" : "border-slate-300 hover:border-brand"}`}
      >
        <Upload className="h-7 w-7 text-brand" />
        <p className="text-sm font-semibold text-ink">{busy ? "Adding…" : "Upload your logo or photos"}</p>
        <p className="text-xs text-slate-500">Drag &amp; drop or tap to choose. PNG, JPG, WEBP or SVG.</p>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <button className="btn-secondary w-full" onClick={() => openPanel("ai")}>
        <Sparkles className="h-4 w-4 text-brand" /> Create a picture with AI instead
      </button>

      {[
        ["Your uploads", uploads],
        ["AI artwork", ai],
      ].map(([title, items]) =>
        (items as typeof library).length ? (
          <div key={title as string}>
            <span className="label">{title as string}</span>
            <div className="grid grid-cols-2 gap-2">
              {(items as typeof library).map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.label} className="checker aspect-square w-full object-contain" />
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/70 p-1.5 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button className="flex-1 rounded-md bg-white/90 py-1 text-[11px] font-semibold" onClick={() => addImage(img.src)}>
                      Add
                    </button>
                    <button className="flex-1 rounded-md bg-white/90 py-1 text-[11px] font-semibold" onClick={() => addImage(img.src, { asBackground: true })}>
                      Background
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null,
      )}

      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-ink">Tips for sharp prints</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Use the biggest version of your logo you have. SVG is best.</li>
          <li>Photos from your phone are usually great.</li>
          <li>We&apos;ll warn you before ordering if anything looks blurry.</li>
        </ul>
      </div>
    </div>
  );
}
