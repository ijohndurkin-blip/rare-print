import type { Metadata } from "next";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

export default function AdminPage() {
  return <AdminDashboard />;
}
