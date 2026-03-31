import { clerkClient } from "@clerk/nextjs/server";
import { AdminEmailClient } from "@/components/AdminEmailClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Administration | Traders League",
};

export default async function AdminEmailPage() {
    const client = await clerkClient();
    const userCount = await client.users.getCount();

    return (
        <AdminEmailClient userCount={userCount} />
    );
}
