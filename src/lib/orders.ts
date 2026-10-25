/** Shared order types (used by the browser and the server). */

export type OrderStatus = "new" | "proof-sent" | "approved" | "printing" | "ready" | "completed" | "cancelled";

export const ORDER_STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "proof-sent", label: "Proof sent" },
  { id: "approved", label: "Approved" },
  { id: "printing", label: "Printing" },
  { id: "ready", label: "Ready / dispatched" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

/** A stored file. `key` is a Blob URL or `local:<path>`. */
export interface StoredFile {
  key: string;
  name: string;
  size: number;
  contentType: string;
}

export interface OrderSide {
  label: string;
  print?: StoredFile;
  preview?: StoredFile;
  svg?: StoredFile;
  design?: StoredFile;
  printPx?: { width: number; height: number; dpi: number };
}

export interface OrderInput {
  productId: string;
  widthMm: number;
  heightMm: number;
  sizeLabel: string;
  materialId: string;
  quantity: number;
  sides: OrderSide[];
  customer: { name: string; email: string; phone: string; company?: string };
  fulfilment: "collect" | "deliver" | "install";
  address?: string;
  notes?: string;
  wantProof: boolean;
  /** Extra files the customer attached (logos, PDFs, site photos). */
  attachments?: StoredFile[];
}

export interface Order extends OrderInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  productName: string;
  materialLabel: string;
  estimate?: number;
  history: { at: string; status: OrderStatus; note?: string }[];
}
