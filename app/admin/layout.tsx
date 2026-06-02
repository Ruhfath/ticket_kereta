import React from "react";

export const metadata = {
  title: "Admin Portal - RailTicket",
  description: "Halaman khusus administrasi RailTicket",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50 font-sans antialiased">{children}</div>;
}
