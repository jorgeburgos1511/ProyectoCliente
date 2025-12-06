import AdminUsersPageClient from "./AdminUsersPageClient";
import AuthGuard from "@/lib/authGuard";

export const metadata = {
  title: "Administración / Usuarios | TaskFlow",
};

export default function AdminUsersPage() {
  return (
    <AuthGuard options={{ requireRole: "admin" }}>
      <AdminUsersPageClient />
    </AuthGuard>
  );
}
