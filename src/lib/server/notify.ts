import "server-only";
import type { Order, StoredFile } from "@/lib/orders";
import { tenant } from "@/lib/tenant";
import { signedFileUrl } from "./storage";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function fileLinks(order: Order, baseUrl: string) {
  const sideFiles = order.sides.flatMap((side) =>
    (["print", "preview", "svg", "design"] as const)
      .map((kind) => side[kind] as StoredFile | undefined)
      .filter((f): f is StoredFile => Boolean(f))
      .map((f) => ({ label: `${side.label} – ${f.name}`, url: signedFileUrl(f.key, baseUrl) })),
  );
  const extras = (order.attachments ?? []).map((f) => ({ label: `Attachment – ${f.name}`, url: signedFileUrl(f.key, baseUrl) }));
  return [...sideFiles, ...extras];
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const from = process.env.EMAIL_FROM || `${tenant.name} <onboarding@resend.dev>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) console.error("[email] failed", res.status, await res.text().catch(() => ""));
}

export async function notifyNewOrder(order: Order, baseUrl: string) {
  const links = fileLinks(order, baseUrl);
  const money = order.estimate != null ? `${tenant.currency}${order.estimate.toFixed(2)}` : "To quote";
  const rows: [string, string][] = [
    ["Product", order.productName],
    ["Size", `${order.sizeLabel} (${order.widthMm} × ${order.heightMm} mm)`],
    ["Material", order.materialLabel],
    ["Quantity", String(order.quantity)],
    ["Estimate", money],
    ["Customer", `${order.customer.name}${order.customer.company ? ` (${order.customer.company})` : ""}`],
    ["Email", order.customer.email],
    ["Phone", order.customer.phone],
    ["Fulfilment", order.fulfilment + (order.address ? ` – ${order.address}` : "")],
    ["Proof wanted", order.wantProof ? "Yes" : "No"],
    ["Notes", order.notes || "–"],
  ];
  const table = rows
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`)
    .join("");
  const previews = order.sides
    .filter((s) => s.preview)
    .map((s) => `<p><b>${esc(s.label)}</b><br><img src="${signedFileUrl(s.preview!.key, baseUrl)}" style="max-width:520px;border:1px solid #e2e8f0"></p>`)
    .join("");

  const adminHtml = `<h2>New order ${esc(order.id)}</h2><table>${table}</table>${previews}
<h3>Print files</h3><ul>${links.map((l) => `<li><a href="${l.url}">${esc(l.label)}</a></li>`).join("")}</ul>
<p><a href="${baseUrl}/admin">Open the orders dashboard</a></p>`;

  const customerHtml = `<h2>Thanks ${esc(order.customer.name.split(" ")[0] || "")}!</h2>
<p>We've received your ${esc(order.productName)} design (order <b>${esc(order.id)}</b>).</p>
<p>${order.wantProof ? "One of our team will check your artwork and send you a proof to approve before anything is printed." : "Our team will check your artwork and be in touch to confirm the details and payment."}</p>
${previews}
<p>Questions? Call us on ${esc(tenant.phone)} or reply to ${esc(tenant.email)}.</p>
<p>— ${esc(tenant.name)}</p>`;

  const notifyTo = process.env.ORDER_NOTIFY_EMAIL || tenant.email;
  const tasks: Promise<unknown>[] = [
    sendEmail(notifyTo, `New ${order.productName} order ${order.id} – ${order.customer.name}`, adminHtml),
    sendEmail(order.customer.email, `Your ${tenant.name} order ${order.id}`, customerHtml),
  ];
  if (process.env.ORDER_WEBHOOK_URL) {
    tasks.push(
      fetch(process.env.ORDER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "order.created", order, files: links }),
      }).catch((e) => console.error("[webhook]", e)),
    );
  }
  await Promise.allSettled(tasks);
}
