import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Shield, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hasAdminAccess } from "@/lib/admin";
import { ATTRIBUTE_TYPE_OPTIONS } from "@/lib/attributes";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { getAdminAttributes, updateAdminAttribute } from "@/server/attributes";
import type { AdminAttributeRow } from "@/types/admin";

export const Route = createFileRoute("/admin/attributes")({
  component: AdminAttributesPage,
});

type EditingAttributeState = {
  attribute_id: number;
  name: string;
  attribute_type: (typeof ATTRIBUTE_TYPE_OPTIONS)[number]["value"];
  allowed_values_text: string;
  number_unit: string;
  min_value: string;
  max_value: string;
  help_text: string;
  is_active: boolean;
};

function AdminAttributesPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = hasAdminAccess(user);
  const [attributes, setAttributes] = useState<AdminAttributeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [editingAttribute, setEditingAttribute] = useState<EditingAttributeState | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadAttributes() {
    try {
      setLoading(true);
      setPageError("");
      setAttributes(await getAdminAttributes());
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not load the attribute library."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccessAdmin) {
      void loadAttributes();
    }
  }, [canAccessAdmin]);

  if (!isLoggedIn || !canAccessAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Access Restricted</h2>
          <Button asChild><Link to="/admin">Back to Admin</Link></Button>
        </div>
      </div>
    );
  }

  const handleOpenEdit = (attribute: AdminAttributeRow) => {
    setEditingAttribute({
      attribute_id: attribute.attribute_id,
      name: attribute.name,
      attribute_type: attribute.attribute_type,
      allowed_values_text: attribute.allowed_values.join(", "),
      number_unit: attribute.number_unit ?? "",
      min_value: attribute.min_value === null ? "" : String(attribute.min_value),
      max_value: attribute.max_value === null ? "" : String(attribute.max_value),
      help_text: attribute.help_text ?? "",
      is_active: attribute.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingAttribute || !user) {
      return;
    }

    try {
      setSaving(true);
      setPageError("");
      setActionMessage("");
      await updateAdminAttribute({
        data: {
          attribute_id: editingAttribute.attribute_id,
          name: editingAttribute.name,
          attribute_type: editingAttribute.attribute_type,
          allowed_values: editingAttribute.allowed_values_text
            .split(",")
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
          number_unit: editingAttribute.number_unit,
          min_value: editingAttribute.min_value,
          max_value: editingAttribute.max_value,
          help_text: editingAttribute.help_text,
          is_active: editingAttribute.is_active,
          adminUserId: user.userId,
        },
      });
      setActionMessage("Attribute updated successfully.");
      setEditingAttribute(null);
      await loadAttributes();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not save the attribute changes."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <FloatingRightNav />
      <div className="pr-20">
        <AdminSectionShell
          title="Attributes"
          subtitle="Manage the approved attribute library used across spot submissions and moderation."
        >
          <div className="space-y-4">
            {actionMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {actionMessage}
              </div>
            ) : null}

            {pageError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {pageError}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                Loading attribute library...
              </div>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Type</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Rules</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attributes.map((attribute) => (
                      <tr key={attribute.attribute_id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 align-top">
                          <div>
                            <p className="font-medium text-foreground">{attribute.name}</p>
                            {attribute.help_text ? (
                              <p className="text-xs text-muted-foreground mt-0.5">{attribute.help_text}</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell align-top">
                          {ATTRIBUTE_TYPE_OPTIONS.find((option) => option.value === attribute.attribute_type)?.label ?? attribute.attribute_type}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell align-top">
                          {attribute.attribute_type === "single_choice"
                            ? attribute.allowed_values.join(", ")
                            : attribute.attribute_type === "number"
                              ? [
                                  attribute.number_unit ? `Unit: ${attribute.number_unit}` : null,
                                  attribute.min_value !== null ? `Min: ${attribute.min_value}` : null,
                                  attribute.max_value !== null ? `Max: ${attribute.max_value}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(" • ") || "No numeric limits"
                              : "No extra rules"}
                        </td>
                        <td className="p-3 align-top">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${attribute.is_active ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                            {attribute.is_active ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-lg px-3"
                              onClick={() => handleOpenEdit(attribute)}
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AdminSectionShell>
      </div>

      <Sheet open={editingAttribute !== null} onOpenChange={(open) => !open && setEditingAttribute(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Edit Attribute</SheetTitle>
          </SheetHeader>
          {editingAttribute ? (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input
                  value={editingAttribute.name}
                  onChange={(event) => setEditingAttribute((current) => current ? { ...current, name: event.target.value } : current)}
                  className="mt-1 h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select
                  value={editingAttribute.attribute_type}
                  onValueChange={(value) =>
                    setEditingAttribute((current) =>
                      current
                        ? {
                            ...current,
                            attribute_type: value as EditingAttributeState["attribute_type"],
                            allowed_values_text:
                              value === "boolean"
                                ? "Yes, No"
                                : value === "single_choice"
                                  ? current.allowed_values_text
                                  : "",
                          }
                        : current,
                    )
                  }
                >
                  <SelectTrigger className="mt-1 h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingAttribute.attribute_type === "single_choice" ? (
                <div>
                  <label className="text-sm font-medium text-foreground">Allowed Values</label>
                  <Input
                    value={editingAttribute.allowed_values_text}
                    onChange={(event) => setEditingAttribute((current) => current ? { ...current, allowed_values_text: event.target.value } : current)}
                    className="mt-1 h-11 rounded-xl"
                    placeholder="Comma-separated values"
                  />
                </div>
              ) : null}
              {editingAttribute.attribute_type === "number" ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Unit</label>
                    <Input
                      value={editingAttribute.number_unit}
                      onChange={(event) => setEditingAttribute((current) => current ? { ...current, number_unit: event.target.value } : current)}
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Min</label>
                    <Input
                      type="number"
                      value={editingAttribute.min_value}
                      onChange={(event) => setEditingAttribute((current) => current ? { ...current, min_value: event.target.value } : current)}
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Max</label>
                    <Input
                      type="number"
                      value={editingAttribute.max_value}
                      onChange={(event) => setEditingAttribute((current) => current ? { ...current, max_value: event.target.value } : current)}
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>
                </div>
              ) : null}
              <div>
                <label className="text-sm font-medium text-foreground">Help Text</label>
                <Textarea
                  value={editingAttribute.help_text}
                  onChange={(event) => setEditingAttribute((current) => current ? { ...current, help_text: event.target.value } : current)}
                  className="mt-1 rounded-xl"
                  rows={3}
                  placeholder="Optional guidance shown while contributors fill this in"
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Visible for new submissions</p>
                  <p className="text-xs text-muted-foreground">Inactive attributes stay on existing spots but disappear from the add-spot form.</p>
                </div>
                <Switch
                  checked={editingAttribute.is_active}
                  onCheckedChange={(checked) => setEditingAttribute((current) => current ? { ...current, is_active: checked } : current)}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 rounded-xl" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditingAttribute(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
