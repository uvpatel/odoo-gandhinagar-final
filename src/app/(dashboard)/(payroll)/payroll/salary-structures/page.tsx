"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCan } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Structure = { id: string; name: string; code: string; description: string | null; isActive: boolean; ruleIds: string[]; ruleCount: number };
type Rule = { id: string; name: string; code: string; isActive: boolean };

async function read<T>(url: string): Promise<T[]> { const response = await fetch(url); const body = await response.json(); if (!response.ok) throw new Error(body.error); return body.data; }
export default function SalaryStructuresPage() {
  const { can } = useCan();
  const client = useQueryClient();
  const structures = useQuery({ queryKey: ["salary-structures"], queryFn: () => read<Structure>("/api/payroll/structures") });
  const rules = useQuery({ queryKey: ["salary-rules"], queryFn: () => read<Rule>("/api/payroll/rules") });
  const [form, setForm] = useState<Omit<Structure, "ruleCount"> | null>(null);
  const save = useMutation({ mutationFn: async () => {
    const response = await fetch("/api/payroll/structures", { method: form?.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, id: form?.id || undefined }) });
    const body = await response.json(); if (!response.ok) throw new Error(body.error);
  }, onSuccess: async () => { await client.invalidateQueries(); setForm(null); toast.success("Salary structure saved"); }, onError: (error) => toast.error(error.message) });
  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <div className="flex justify-between"><h1 className="text-2xl font-semibold">Salary structures</h1>{can("salaryStructure", "create") && <Button onClick={() => setForm({ id: "", name: "", code: "", description: "", isActive: true, ruleIds: [] })}>New structure</Button>}</div>
    <p className="text-muted-foreground">Each structure runs its selected salary rules in the order shown below.</p>
    {(structures.isLoading || rules.isLoading) && <p>Loading salary configuration…</p>}
    {(structures.error || rules.error) && <p role="alert">{structures.error?.message || rules.error?.message}</p>}
    <div className="grid gap-4 sm:grid-cols-2">{structures.data?.map((s) => <article key={s.id} className="space-y-3 rounded-xl border p-5"><h2 className="font-semibold">{s.name} · {s.code}</h2><p>{s.isActive ? "Active" : "Inactive"} · {s.ruleCount} rules</p><p className="text-sm text-muted-foreground">{s.description}</p><ol className="list-inside list-decimal text-sm">{s.ruleIds.map((id) => <li key={id}>{rules.data?.find((r) => r.id === id)?.name || id}</li>)}</ol>{can("salaryStructure", "update") && <Button variant="outline" onClick={() => setForm(s)}>Edit</Button>}</article>)}</div>
    {structures.data?.length === 0 && <p>No salary structures yet.</p>}
    {form && <form className="space-y-4 rounded-xl border p-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <h2 className="text-lg font-semibold">{form.id ? "Edit" : "Create"} salary structure</h2>
      <label className="block">Name<Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
      <label className="block">Code<Input required pattern="[A-Z][A-Z0-9_]*" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}/></label>
      <label className="block">Description<Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })}/></label>
      <label className="flex gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}/>Active</label>
      <fieldset className="space-y-2"><legend className="font-medium">Select rules</legend>{rules.data?.map((r) => <label key={r.id} className="flex gap-2"><input type="checkbox" checked={form.ruleIds.includes(r.id)} onChange={(e) => setForm({ ...form, ruleIds: e.target.checked ? [...form.ruleIds, r.id] : form.ruleIds.filter((id) => id !== r.id) })}/>{r.code} — {r.name}{!r.isActive && " (inactive)"}</label>)}</fieldset>
      <ol className="space-y-2">{form.ruleIds.map((id, i) => <li key={id} className="flex items-center gap-3">{i + 1}. {rules.data?.find((r) => r.id === id)?.code}<Button type="button" variant="outline" disabled={!i} onClick={() => { const order = [...form.ruleIds]; [order[i - 1], order[i]] = [order[i], order[i - 1]]; setForm({ ...form, ruleIds: order }); }}>Move up</Button></li>)}</ol>
      <div className="flex gap-3"><Button disabled={save.isPending}>Save structure</Button><Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button></div>
    </form>}
  </main>;
}
