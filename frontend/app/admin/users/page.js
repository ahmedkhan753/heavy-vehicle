import UsersPanel from "@/components/admin/UsersPanel";

export const metadata = {
  title: "Users — HeavyWheels Admin",
};

export default function AdminUsersPage() {
  return (
    <>
      <h2 className="mb-4 text-2xl font-black text-[var(--hw-text-primary)]">User management</h2>
      <UsersPanel />
    </>
  );
}
