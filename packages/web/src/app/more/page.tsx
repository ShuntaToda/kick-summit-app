import { AdminToggle } from "@/components/admin-toggle";

export default function MorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">その他</h1>
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">管理者</h2>
        <AdminToggle />
      </section>
    </div>
  );
}
