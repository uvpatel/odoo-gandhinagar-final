"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCan } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  SearchIcon,
  Edit2Icon,
  Trash2Icon,
  MoveUpIcon,
  MoveDownIcon,
  LayersIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

type Structure = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  ruleIds: string[];
  ruleCount: number;
};

type Rule = {
  id: string;
  name: string;
  code: string;
  category: string;
  isActive: boolean;
};

async function fetcher<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || "Failed to load data");
  }
  return body.data;
}

export default function SalaryStructuresPage() {
  const { can } = useCan();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<Omit<Structure, "ruleCount"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Structure | null>(null);

  // Queries
  const structuresQuery = useQuery({
    queryKey: ["salary-structures"],
    queryFn: () => fetcher<Structure>("/api/payroll/structures"),
  });

  const rulesQuery = useQuery({
    queryKey: ["salary-rules"],
    queryFn: () => fetcher<Rule>("/api/payroll/rules"),
  });

  const structures = structuresQuery.data || [];
  const rules = rulesQuery.data || [];

  // Filtered structures
  const filteredStructures = useMemo(() => {
    if (!searchTerm.trim()) return structures;
    const term = searchTerm.toLowerCase();
    return structures.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term))
    );
  }, [structures, searchTerm]);

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const isEdit = Boolean(form.id);
      const payload = {
        id: form.id || undefined,
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description?.trim() || null,
        isActive: form.isActive,
        ruleIds: form.ruleIds,
      };

      const response = await fetch("/api/payroll/structures", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Failed to save salary structure");
      }
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
      setForm(null);
      toast.success(form?.id ? "Salary structure updated" : "Salary structure created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/payroll/structures?id=${id}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Failed to delete salary structure");
      }
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
      setDeleteTarget(null);
      toast.success("Salary structure deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleOpenNew = () => {
    setForm({
      id: "",
      name: "",
      code: "",
      description: "",
      isActive: true,
      ruleIds: rules.map((r) => r.id), // Default select all rules
    });
  };

  const handleOpenEdit = (s: Structure) => {
    setForm({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description || "",
      isActive: s.isActive,
      ruleIds: s.ruleIds || [],
    });
  };

  const handleToggleRule = (ruleId: string, checked: boolean) => {
    if (!form) return;
    if (checked) {
      setForm({ ...form, ruleIds: [...form.ruleIds, ruleId] });
    } else {
      setForm({
        ...form,
        ruleIds: form.ruleIds.filter((id) => id !== ruleId),
      });
    }
  };

  const handleMoveRule = (index: number, direction: "up" | "down") => {
    if (!form) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= form.ruleIds.length) return;

    const newRuleIds = [...form.ruleIds];
    const temp = newRuleIds[index];
    newRuleIds[index] = newRuleIds[targetIndex];
    newRuleIds[targetIndex] = temp;

    setForm({ ...form, ruleIds: newRuleIds });
  };

  const isLoading = structuresQuery.isLoading || rulesQuery.isLoading;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayersIcon className="size-6 text-primary" />
            <span>Salary Structures</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure salary computation frameworks and determine the evaluation order of earnings and deductions.
          </p>
        </div>

        {can("salaryStructure", "create") && (
          <Button onClick={handleOpenNew} className="gap-2">
            <PlusIcon className="size-4" />
            <span>New Structure</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search structure by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2Icon className="size-6 animate-spin text-primary" />
          <p className="text-sm">Loading salary structures and rule configurations...</p>
        </div>
      ) : structuresQuery.error ? (
        <Card className="border-destructive/50 bg-destructive/5 p-6 text-center text-destructive">
          <p className="font-semibold text-sm">Failed to load salary structures</p>
          <p className="text-xs mt-1">{(structuresQuery.error as Error).message}</p>
        </Card>
      ) : filteredStructures.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground space-y-3">
          <LayersIcon className="size-10 mx-auto text-muted-foreground/50" />
          <p className="font-medium text-base">No salary structures found</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {searchTerm
              ? "No structures match your search criteria. Try clearing the search."
              : "Create your first salary structure to begin processing payroll for your employees."}
          </p>
          {can("salaryStructure", "create") && !searchTerm && (
            <Button onClick={handleOpenNew} variant="outline" className="gap-2 mt-2">
              <PlusIcon className="size-4" />
              <span>Create Structure</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredStructures.map((s) => (
            <Card key={s.id} className="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span>{s.name}</span>
                      <Badge variant="outline" className="font-mono text-xs font-medium">
                        {s.code}
                      </Badge>
                    </CardTitle>
                    {s.description && (
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {s.description}
                      </CardDescription>
                    )}
                  </div>

                  {s.isActive ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 gap-1 text-[11px]">
                      <CheckCircle2Icon className="size-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-[11px]">
                      <XCircleIcon className="size-3" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="text-xs font-medium text-muted-foreground flex items-center justify-between border-t border-b py-2">
                  <span>Included Rules ({s.ruleCount})</span>
                  <span>Execution Sequence</span>
                </div>

                {s.ruleIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No rules attached to this structure.</p>
                ) : (
                  <ol className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {s.ruleIds.map((ruleId, index) => {
                      const ruleObj = rules.find((r) => r.id === ruleId);
                      return (
                        <li
                          key={ruleId}
                          className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/40"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-mono text-muted-foreground w-5 text-right font-medium">
                              {index + 1}.
                            </span>
                            <span className="font-medium text-foreground truncate">
                              {ruleObj ? ruleObj.name : ruleId}
                            </span>
                          </div>
                          {ruleObj && (
                            <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                              {ruleObj.code}
                            </Badge>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  {can("salaryStructure", "update") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(s)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Edit2Icon className="size-3.5" />
                      Edit
                    </Button>
                  )}
                  {can("salaryStructure", "delete") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(s)}
                      className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2Icon className="size-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit Salary Structure" : "Create Salary Structure"}</DialogTitle>
            <DialogDescription>
              Define the structure name, identifier code, and sequence of rules evaluated during payroll computation.
            </DialogDescription>
          </DialogHeader>

          {form && (
            <form
              id="structure-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-5 py-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="struct-name">Structure Name *</Label>
                  <Input
                    id="struct-name"
                    required
                    placeholder="e.g. Standard Corporate Structure"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="struct-code">Structure Code *</Label>
                  <Input
                    id="struct-code"
                    required
                    placeholder="e.g. STD_CORP"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="struct-desc">Description</Label>
                <Input
                  id="struct-desc"
                  placeholder="Optional brief description of this salary framework..."
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="struct-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isActive: Boolean(checked) })
                  }
                />
                <Label htmlFor="struct-active" className="cursor-pointer text-sm font-medium">
                  Active for new payruns
                </Label>
              </div>

              {/* Rules Selector & Ordering */}
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label className="text-sm font-semibold">Select Salary Rules</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Check the rules to include in this structure. Reorder rules using the controls below to dictate calculation order.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {rules.map((r) => {
                    const isSelected = form.ruleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleRule(r.id, Boolean(checked))}
                        />
                        <span className="font-medium">{r.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {r.code}
                        </Badge>
                      </label>
                    );
                  })}
                </div>

                {/* Selected Rules Sequence */}
                {form.ruleIds.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold">Execution Order ({form.ruleIds.length} rules selected)</Label>
                    <div className="space-y-1.5 border rounded-md p-2 max-h-52 overflow-y-auto">
                      {form.ruleIds.map((ruleId, index) => {
                        const ruleObj = rules.find((r) => r.id === ruleId);
                        return (
                          <div
                            key={ruleId}
                            className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground w-6 font-semibold">
                                #{index + 1}
                              </span>
                              <span className="font-medium">{ruleObj ? ruleObj.name : ruleId}</span>
                              {ruleObj && (
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {ruleObj.code}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                disabled={index === 0}
                                onClick={() => handleMoveRule(index, "up")}
                              >
                                <MoveUpIcon className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                disabled={index === form.ruleIds.length - 1}
                                onClick={() => handleMoveRule(index, "down")}
                              >
                                <MoveDownIcon className="size-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
                  {saveMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
                  <span>{form.id ? "Save Changes" : "Create Structure"}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Salary Structure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.code})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="gap-2"
            >
              {deleteMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              <span>Delete Structure</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
