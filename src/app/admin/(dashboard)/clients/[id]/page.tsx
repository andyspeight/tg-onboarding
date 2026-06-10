import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientDetail } from "@/components/admin/ClientDetail";
import { fetchAdminClientDetail } from "@/lib/onboarding/airtable";

export const metadata: Metadata = {
  title: "Client detail · Travelgenix onboarding",
  robots: { index: false, follow: false },
};

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) notFound();

  const detail = await fetchAdminClientDetail(id);
  if (!detail) notFound();

  return (
    <div className="anim-fade-up">
      <Link
        href="/admin"
        className="text-[12px] font-medium text-fg-muted transition-colors hover:text-fg"
      >
        ← Back to overview
      </Link>
      <div className="mt-3">
        <ClientDetail detail={detail} />
      </div>
    </div>
  );
}
