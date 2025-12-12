"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <div className="min-h-screen bg-[hsl(var(--background))]">
                <Sidebar />
                <div className="pl-64">
                    <TopBar />
                    <main className="p-6">{children}</main>
                </div>
            </div>
        </SessionProvider>
    );
}
