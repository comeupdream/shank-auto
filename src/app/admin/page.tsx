import AdminSchedule from "@/components/admin/AdminSchedule";
import LoginForm from "@/components/admin/LoginForm";
import { isAdminAuthed } from "@/lib/auth";

export const metadata = { title: "Schedule — Shank Auto Repair" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminAuthed();
  return (
    <div className="mx-auto max-w-4xl">
      {authed ? <AdminSchedule /> : <LoginForm />}
    </div>
  );
}
