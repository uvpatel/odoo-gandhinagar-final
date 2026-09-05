"use client";

import * as React from "react";
import { useCan } from "@/hooks/use-permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  ShieldCheckIcon,
  LockIcon,
  CalculatorIcon,
  SearchIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

export type SalaryRuleItem = {
  id: string;
  name: string;
  code: string;
  category: "basic" | "allowance" | "gross" | "deduction" | "contribution" | "net";
  computationType: "fixed" | "percentage" | "formula";
  fixedAmount: string | null;
  percentage: string | null;
  percentageBase: string | null;
  formula: string | null;
  sequence: number;
  isActive: boolean;
};

const categoryColors: Record<string, string> = {
  basic: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
  allowance: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  gross: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
  deduction: "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400",
  contribution: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  net: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:text-indigo-400",
};

export default function SalaryRulesPage({ initialRules = [] }: { initialRules?: SalaryRuleItem[] }) {
  const { can, role, isAdmin, isPayrollManager } = useCan();
  const [rules, setRules] = React.useState<SalaryRuleItem[]>(initialRules);
  const [isLoading, setIsLoading] = React.useState(initialRules.length === 0);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<SalaryRuleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (initialRules.length === 0) {
      fetch("/api/payroll/rules")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setRules(data.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load rules:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialRules.length]);

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    category: "allowance" as SalaryRuleItem["category"],
    computationType: "fixed" as SalaryRuleItem["computationType"],
    fixedAmount: "",
    percentage: "",
    percentageBase: "BASIC",
    formula: "",
    sequence: 10,
    isActive: true,
  });

  // Permission evaluation derived directly from centralized permissions
  const canCreate = can("salaryRule", "create");
  const canUpdate = can("salaryRule", "update");
  const canDelete = can("salaryRule", "delete");

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Permission denied", {
        description: "You need Payroll Manager or Admin privileges to create salary rules.",
      });
      return;
    }
    setEditingRule(null);
    setFormData({
      name: "",
      code: "",
      category: "allowance",
      computationType: "fixed",
      fixedAmount: "1000",
      percentage: "10",
      percentageBase: "BASIC",
      formula: "",
      sequence: (rules.length + 1) * 10,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rule: SalaryRuleItem) => {
    if (!canUpdate) {
      toast.error("Permission denied", {
        description: "You need Payroll Manager or Admin privileges to edit salary rules.",
      });
      return;
    }
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      code: rule.code,
      category: rule.category,
      computationType: rule.computationType,
      fixedAmount: rule.fixedAmount || "",
      percentage: rule.percentage || "",
      percentageBase: rule.percentageBase || "BASIC",
      formula: rule.formula || "",
      sequence: rule.sequence,
      isActive: rule.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (rule: SalaryRuleItem) => {
    if (!canDelete) {
      toast.error("Permission denied", {
        description: "You need Payroll Manager or Admin privileges to delete salary rules.",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete salary rule "${rule.name}" (${rule.code})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/payroll/rules?id=${rule.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete salary rule");
      }

      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      toast.success("Rule deleted", {
        description: `Salary rule "${rule.name}" has been removed.`,
      });
    } catch (err: any) {
      toast.error("Action failed", {
        description: err.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingRule) {
        const res = await fetch("/api/payroll/rules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingRule.id,
            ...formData,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update salary rule");

        setRules((prev) =>
          prev.map((r) => (r.id === editingRule.id ? data.data : r))
        );
        toast.success("Rule updated", {
          description: `Salary rule "${formData.name}" updated successfully.`,
        });
      } else {
        const res = await fetch("/api/payroll/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create salary rule");

        setRules((prev) => [...prev, data.data].sort((a, b) => a.sequence - b.sequence));
        toast.success("Rule created", {
          description: `Salary rule "${formData.name}" created successfully.`,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error("Action failed", {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering
  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header with Title and RBAC Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Salary Rules</h1>
            {canCreate ? (
              <Badge
                variant="outline"
                className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <ShieldCheckIcon className="size-3.5" />
                Full Editor ({role === "admin" ? "Admin" : "Payroll Manager"})
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <LockIcon className="size-3.5" />
                Read-Only ({role.replace("_", " ")})
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure computation rules, allowances, deductions, and statutory formulas for payroll processing.
          </p>
        </div>

        {/* Create Rule Action Button */}
        <div>
          <Button
            onClick={openCreateModal}
            disabled={!canCreate}
            className={!canCreate ? "opacity-60 cursor-not-allowed" : ""}
            title={
              canCreate
                ? "Add a new salary rule"
                : "Requires Payroll Manager or Admin privileges to create rules"
            }
          >
            {canCreate ? (
              <PlusIcon className="mr-1.5 size-4" />
            ) : (
              <LockIcon className="mr-1.5 size-4 text-muted-foreground" />
            )}
            New Rule
          </Button>
        </div>
      </div>

      {/* Access explanation card for read-only users */}
      {!canCreate && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            You have <strong>read-only</strong> access to salary rules as a <strong>Payroll User</strong>.
            Modifications, additions, and deletions require <strong>Payroll Manager</strong> or <strong>Admin</strong> privileges.
          </p>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by rule name or code (e.g., BASIC, HRA, PF)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Categories</option>
                <option value="basic">Basic</option>
                <option value="allowance">Allowance</option>
                <option value="gross">Gross</option>
                <option value="deduction">Deduction</option>
                <option value="contribution">Contribution</option>
                <option value="net">Net</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Seq</TableHead>
                <TableHead className="w-28">Code</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Computation</TableHead>
                <TableHead>Value / Base</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading salary rules...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No salary rules found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {rule.sequence}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold text-primary">{rule.code}</span>
                    </TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${categoryColors[rule.category] || ""}`}
                      >
                        {rule.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs capitalize text-muted-foreground">
                        <CalculatorIcon className="size-3" />
                        {rule.computationType}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {rule.computationType === "fixed" && rule.fixedAmount && (
                        <span>₹{Number(rule.fixedAmount).toLocaleString("en-IN")}</span>
                      )}
                      {rule.computationType === "percentage" && (
                        <span>
                          {rule.percentage}% of {rule.percentageBase || "BASIC"}
                        </span>
                      )}
                      {rule.computationType === "formula" && (
                        <span className="truncate max-w-[140px] inline-block text-muted-foreground">
                          {rule.formula || "Custom formula"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rule.isActive ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Action Button */}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEditModal(rule)}
                          disabled={!canUpdate}
                          title={
                            canUpdate
                              ? "Edit rule"
                              : "Permission required: Payroll Manager or Admin"
                          }
                          className={!canUpdate ? "opacity-40 cursor-not-allowed" : ""}
                        >
                          {canUpdate ? (
                            <PencilIcon className="size-3.5" />
                          ) : (
                            <LockIcon className="size-3 text-muted-foreground" />
                          )}
                        </Button>

                        {/* Delete Action Button */}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(rule)}
                          disabled={!canDelete}
                          title={
                            canDelete
                              ? "Delete rule"
                              : "Permission required: Payroll Manager or Admin"
                          }
                          className={
                            canDelete
                              ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                              : "opacity-40 cursor-not-allowed"
                          }
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Rule Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingRule ? `Edit Rule: ${editingRule.name}` : "Create Salary Rule"}
              </h2>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsModalOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Travel Allowance"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. TA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as SalaryRuleItem["category"],
                      })
                    }
                    className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="basic">Basic</option>
                    <option value="allowance">Allowance</option>
                    <option value="gross">Gross</option>
                    <option value="deduction">Deduction</option>
                    <option value="contribution">Contribution</option>
                    <option value="net">Net</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="computationType">Computation Type</Label>
                  <select
                    id="computationType"
                    value={formData.computationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        computationType: e.target.value as SalaryRuleItem["computationType"],
                      })
                    }
                    className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="formula">Python / Math Formula</option>
                  </select>
                </div>
              </div>

              {formData.computationType === "fixed" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fixedAmount">Fixed Amount (₹)</Label>
                  <Input
                    id="fixedAmount"
                    type="number"
                    step="0.01"
                    required
                    value={formData.fixedAmount}
                    onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                    placeholder="1000.00"
                  />
                </div>
              )}

              {formData.computationType === "percentage" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="percentage">Percentage (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      step="0.01"
                      required
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                      placeholder="12.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="percentageBase">Percentage Base</Label>
                    <Input
                      id="percentageBase"
                      value={formData.percentageBase}
                      onChange={(e) => setFormData({ ...formData, percentageBase: e.target.value })}
                      placeholder="BASIC"
                    />
                  </div>
                </div>
              )}

              {formData.computationType === "formula" && (
                <div className="space-y-1.5">
                  <Label htmlFor="formula">Formula Expression</Label>
                  <Input
                    id="formula"
                    value={formData.formula}
                    onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                    placeholder="BASIC * 0.4 + HRA"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sequence">Execution Sequence</Label>
                  <Input
                    id="sequence"
                    type="number"
                    value={formData.sequence}
                    onChange={(e) => setFormData({ ...formData, sequence: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Rule Active
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editingRule
                    ? "Update Rule"
                    : "Create Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

