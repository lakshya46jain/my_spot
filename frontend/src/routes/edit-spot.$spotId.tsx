import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Pencil, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { SectionCard } from "@/components/SectionCard";
import { OperatingHoursSection, createDefaultHours, type DayHours } from "@/components/OperatingHoursSection";
import { GoogleAddressField } from "@/components/GoogleAddressField";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getAttributeMenu } from "@/server/attributes";
import { uploadSpotMedia } from "@/server/media";
import { getSpot, submitSpotEdit } from "@/server/spots";
import {
  ATTRIBUTE_TYPE_OPTIONS,
  getAttributeTypeLabel,
  parseDelimitedValues,
} from "@/lib/attributes";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { prepareImageUpload } from "@/lib/image-upload";
import type { AttributeDefinition, SpotAttribute, SpotOperatingHour } from "@/types/api";

type EditableAttribute = {
  spot_attribute_id: number;
  attribute_id: number | null;
  label: string;
  attribute_type: AttributeDefinition["attribute_type"];
  allowed_values: string[];
  value: string;
  notes: string;
};

type SelectedAttributeDraft = {
  attribute_id: number;
  value: string;
  notes: string;
};

type CustomAttributeDraft = {
  name: string;
  attribute_type: (typeof ATTRIBUTE_TYPE_OPTIONS)[number]["value"];
  suggested_allowed_values_text: string;
  value: string;
  notes: string;
};

const DAYS_OF_WEEK = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const);

function formatStoredTimeParts(value: string | null) {
  if (!value) {
    return {
      hour: "",
      minute: "",
      meridiem: "",
    } as const;
  }

  const [hoursText = "0", minute = "00"] = value.split(":");
  let hours = Number.parseInt(hoursText, 10);
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return {
    hour: String(hours),
    minute,
    meridiem,
  } as const;
}

function mapOperatingHoursToEditor(hours: SpotOperatingHour[] | undefined) {
  const defaults = createDefaultHours();

  for (const hourEntry of hours ?? []) {
    if (!DAYS_OF_WEEK.has(hourEntry.day as never)) {
      continue;
    }

    const dayIndex = defaults.findIndex((day) => day.day === hourEntry.day);
    if (dayIndex === -1) {
      continue;
    }

    const openParts = formatStoredTimeParts(hourEntry.open_time);
    const closeParts = formatStoredTimeParts(hourEntry.close_time);
    const hasRange =
      openParts.hour !== "" &&
      openParts.minute !== "" &&
      openParts.meridiem !== "" &&
      closeParts.hour !== "" &&
      closeParts.minute !== "" &&
      closeParts.meridiem !== "";

    defaults[dayIndex] = {
      day: defaults[dayIndex].day,
      closed: !hasRange,
      timeRanges: hasRange
        ? [
            {
              openHour: openParts.hour,
              openMinute: openParts.minute,
              openMeridiem: openParts.meridiem,
              closeHour: closeParts.hour,
              closeMinute: closeParts.minute,
              closeMeridiem: closeParts.meridiem,
            },
          ]
        : defaults[dayIndex].timeRanges,
      notes: hourEntry.notes ?? "",
    };
  }

  return defaults;
}

function getMinutesFromRange(
  hour: string,
  minute: string,
  meridiem: "AM" | "PM",
) {
  let parsedHour = Number.parseInt(hour, 10);

  if (meridiem === "AM" && parsedHour === 12) {
    parsedHour = 0;
  } else if (meridiem === "PM" && parsedHour !== 12) {
    parsedHour += 12;
  }

  return parsedHour * 60 + Number.parseInt(minute, 10);
}

function isBlankTimeRange(range: DayHours["timeRanges"][number]) {
  return (
    range.openHour === "" &&
    range.openMinute === "" &&
    range.openMeridiem === "" &&
    range.closeHour === "" &&
    range.closeMinute === "" &&
    range.closeMeridiem === ""
  );
}

function getOperatingHoursError(hours: DayHours[]) {
  for (const dayHours of hours) {
    if (dayHours.closed) {
      continue;
    }

    for (const range of dayHours.timeRanges) {
      if (isBlankTimeRange(range)) {
        continue;
      }

      const isPartialRange =
        range.openHour === "" ||
        range.openMinute === "" ||
        range.openMeridiem === "" ||
        range.closeHour === "" ||
        range.closeMinute === "" ||
        range.closeMeridiem === "";

      if (isPartialRange) {
        return `${dayHours.day}: complete both open and close times or leave the range blank.`;
      }

      const openMinutes = getMinutesFromRange(
        range.openHour,
        range.openMinute,
        range.openMeridiem as "AM" | "PM",
      );
      const closeMinutes = getMinutesFromRange(
        range.closeHour,
        range.closeMinute,
        range.closeMeridiem as "AM" | "PM",
      );

      if (closeMinutes <= openMinutes) {
        return `${dayHours.day}: closing time must be after opening time.`;
      }
    }
  }

  return null;
}

function renderAttributeValueInput(params: {
  attributeType: AttributeDefinition["attribute_type"];
  allowedValues: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (params.attributeType === "boolean" || params.attributeType === "single_choice") {
    const options =
      params.attributeType === "boolean" ? ["Yes", "No"] : params.allowedValues;

    return (
      <Select value={params.value} onValueChange={params.onChange}>
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue placeholder="Choose a value" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      type={params.attributeType === "number" ? "number" : "text"}
      value={params.value}
      onChange={(event) => params.onChange(event.target.value)}
      className="h-11 rounded-xl"
      placeholder="Enter a value"
    />
  );
}

export const Route = createFileRoute("/edit-spot/$spotId")({
  component: EditSpotPage,
});

function EditSpotPage() {
  const { spotId: spotIdParam } = Route.useParams();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const spotId = Number(spotIdParam);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [spotName, setSpotName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [operatingHours, setOperatingHours] = useState<DayHours[]>(createDefaultHours());
  const [editableAttributes, setEditableAttributes] = useState<EditableAttribute[]>([]);
  const [attributeMenu, setAttributeMenu] = useState<AttributeDefinition[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributeDraft[]>([]);
  const [newAttributeId, setNewAttributeId] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [newAttributeNotes, setNewAttributeNotes] = useState("");
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeDraft[]>([]);
  const [customAttributeDraft, setCustomAttributeDraft] = useState<CustomAttributeDraft>({
    name: "",
    attribute_type: "unsure",
    suggested_allowed_values_text: "",
    value: "",
    notes: "",
  });
  const [photoFiles, setPhotoFiles] = useState<Array<File | null>>([
    null,
    null,
    null,
    null,
    null,
  ]);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setPageError("");

        const [spot, attributes] = await Promise.all([
          getSpot({ data: { spotId } }),
          getAttributeMenu(),
        ]);

        setSpotName(spot.spot_name);
        setDescription(spot.short_description ?? "");
        setAddress(spot.address ?? "");
        setLatitude(spot.latitude === null ? "" : String(spot.latitude));
        setLongitude(spot.longitude === null ? "" : String(spot.longitude));
        setOperatingHours(mapOperatingHoursToEditor(spot.operating_hours));
        setAttributeMenu(attributes);
        setEditableAttributes(
          (spot.attributes ?? [])
            .filter((attribute) => attribute.moderation_status !== "rejected")
            .map((attribute) => ({
              spot_attribute_id: attribute.spot_attribute_id,
              attribute_id: attribute.attribute_id,
              label: attribute.attribute_name ?? attribute.submitted_name ?? "Attribute",
              attribute_type: attribute.attribute_type,
              allowed_values:
                attribute.attribute_id !== null
                  ? attribute.allowed_values
                  : attribute.submitted_allowed_values,
              value: attribute.value,
              notes: attribute.notes ?? attribute.submitted_notes ?? "",
            })),
        );
      } catch (error) {
        setPageError(
          getUserFriendlyErrorMessage(error, "Could not load this spot for editing."),
        );
      } finally {
        setLoading(false);
      }
    }

    if (spotId) {
      void loadPage();
    }
  }, [spotId]);

  const existingAttributeIds = useMemo(
    () =>
      new Set(
        editableAttributes
          .map((attribute) => attribute.attribute_id)
          .filter((value): value is number => value !== null),
      ),
    [editableAttributes],
  );

  const availableAttributes = attributeMenu.filter(
    (attribute) =>
      attribute.is_active &&
      !existingAttributeIds.has(attribute.attribute_id) &&
      !selectedAttributes.some((selected) => selected.attribute_id === attribute.attribute_id),
  );

  const selectedAttributeDefinition = attributeMenu.find(
    (attribute) => String(attribute.attribute_id) === newAttributeId,
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.error("Sign in to edit this spot.");
      return;
    }

    const operatingHoursError = getOperatingHoursError(operatingHours);
    if (operatingHoursError) {
      toast.error(operatingHoursError);
      return;
    }

    try {
      setSaving(true);
      setPageError("");

      await submitSpotEdit({
        data: {
          userId: user.userId,
          spotId,
          short_description: description,
          address,
          latitude,
          longitude,
          operatingHours,
          existingAttributeUpdates: editableAttributes.map((attribute) => ({
            spot_attribute_id: attribute.spot_attribute_id,
            value: attribute.value,
            notes: attribute.notes,
          })),
          selectedAttributes,
          customAttributes: customAttributes.map((attribute) => ({
            name: attribute.name,
            attribute_type: attribute.attribute_type,
            value: attribute.value,
            notes: attribute.notes,
            suggested_allowed_values: parseDelimitedValues(
              attribute.suggested_allowed_values_text,
            ),
          })),
        },
      });

      const selectedPhotos = photoFiles.filter((file): file is File => file !== null);

      if (selectedPhotos.length > 0) {
        const preparedImages = await Promise.all(
          selectedPhotos.map((file) => prepareImageUpload(file)),
        );

        await uploadSpotMedia({
          data: {
            userId: user.userId,
            spotId,
            images: preparedImages,
          },
        });
      }

      toast.success("Your edit was submitted for admin review.");
      navigate({
        to: "/spot/$spotId",
        params: { spotId: String(spotId) },
      });
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not submit your edits."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <FloatingRightNav />
        <PageContainer>
          <div className="text-center py-16">
            <div className="rounded-2xl border border-border bg-card p-10 max-w-md mx-auto shadow-sm">
              <Pencil className="h-12 w-12 text-warm-300 mx-auto mb-4" />
              <h2 className="text-xl font-display text-foreground mb-2">
                Sign in to suggest edits
              </h2>
              <Button asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="text-center mb-10">
            <Pencil className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl font-display text-foreground mb-2">
              Suggest an Edit
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Improve the details for {spotName}. Your changes will be reviewed before going live.
            </p>
          </div>

          {pageError ? (
            <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {pageError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <SectionCard
              title="What You Can Update"
              description="Names, spot type, hierarchy, and parent location stay moderator-controlled."
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Spot Name
                  </label>
                  <Input value={spotName} disabled className="h-11 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="rounded-xl"
                    rows={4}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Location"
              description="Suggest a corrected address or coordinates if needed."
            >
              <div className="space-y-4">
                <GoogleAddressField
                  value={address}
                  onChange={setAddress}
                  onLocationResolved={(location) => {
                    setAddress(location.address);
                    setLatitude(location.latitude);
                    setLongitude(location.longitude);
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Operating Hours"
              description="Update weekly hours for this location."
            >
              <OperatingHoursSection
                hours={operatingHours}
                onChange={setOperatingHours}
              />
            </SectionCard>

            <SectionCard
              title="Current Attributes"
              description="You can update values for attributes already attached to this spot, but not remove them."
            >
              <div className="space-y-4">
                {editableAttributes.map((attribute) => (
                  <div
                    key={attribute.spot_attribute_id}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{attribute.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {getAttributeTypeLabel(attribute.attribute_type)}
                      </p>
                    </div>
                    {renderAttributeValueInput({
                      attributeType: attribute.attribute_type,
                      allowedValues: attribute.allowed_values,
                      value: attribute.value,
                      onChange: (value) =>
                        setEditableAttributes((current) =>
                          current.map((currentAttribute) =>
                            currentAttribute.spot_attribute_id === attribute.spot_attribute_id
                              ? { ...currentAttribute, value }
                              : currentAttribute,
                          ),
                        ),
                    })}
                    <Textarea
                      value={attribute.notes}
                      onChange={(event) =>
                        setEditableAttributes((current) =>
                          current.map((currentAttribute) =>
                            currentAttribute.spot_attribute_id === attribute.spot_attribute_id
                              ? { ...currentAttribute, notes: event.target.value }
                              : currentAttribute,
                          ),
                        )
                      }
                      className="rounded-xl"
                      rows={2}
                      placeholder="Optional notes"
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Add Approved Attribute"
              description="Add another approved attribute to this spot."
            >
              <div className="space-y-4">
                <Select value={newAttributeId} onValueChange={setNewAttributeId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Choose an approved attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAttributes.map((attribute) => (
                      <SelectItem
                        key={attribute.attribute_id}
                        value={String(attribute.attribute_id)}
                      >
                        {attribute.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAttributeDefinition ? (
                  <>
                    {renderAttributeValueInput({
                      attributeType: selectedAttributeDefinition.attribute_type,
                      allowedValues: selectedAttributeDefinition.allowed_values,
                      value: newAttributeValue,
                      onChange: setNewAttributeValue,
                    })}
                    <Textarea
                      value={newAttributeNotes}
                      onChange={(event) => setNewAttributeNotes(event.target.value)}
                      className="rounded-xl"
                      rows={2}
                      placeholder="Optional notes"
                    />
                    <Button
                      type="button"
                      className="rounded-xl"
                      onClick={() => {
                        if (!selectedAttributeDefinition || !newAttributeValue.trim()) {
                          toast.error("Choose an attribute and enter a value.");
                          return;
                        }

                        setSelectedAttributes((current) => [
                          ...current,
                          {
                            attribute_id: selectedAttributeDefinition.attribute_id,
                            value: newAttributeValue.trim(),
                            notes: newAttributeNotes.trim(),
                          },
                        ]);
                        setNewAttributeId("");
                        setNewAttributeValue("");
                        setNewAttributeNotes("");
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Attribute
                    </Button>
                  </>
                ) : null}

                {selectedAttributes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAttributes.map((attribute) => {
                      const definition = attributeMenu.find(
                        (item) => item.attribute_id === attribute.attribute_id,
                      );

                      return (
                        <div
                          key={attribute.attribute_id}
                          className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground"
                        >
                          {definition?.name ?? "Attribute"}: {attribute.value}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Suggest New Attribute"
              description="Propose a new detail if the current attribute menu is missing something."
            >
              <div className="space-y-4">
                <Input
                  value={customAttributeDraft.name}
                  onChange={(event) =>
                    setCustomAttributeDraft((draft) => ({
                      ...draft,
                      name: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl"
                  placeholder="Attribute name"
                />
                <Select
                  value={customAttributeDraft.attribute_type}
                  onValueChange={(value) =>
                    setCustomAttributeDraft((draft) => ({
                      ...draft,
                      attribute_type: value as CustomAttributeDraft["attribute_type"],
                    }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Choose attribute type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customAttributeDraft.attribute_type === "single_choice" ? (
                  <Input
                    value={customAttributeDraft.suggested_allowed_values_text}
                    onChange={(event) =>
                      setCustomAttributeDraft((draft) => ({
                        ...draft,
                        suggested_allowed_values_text: event.target.value,
                      }))
                    }
                    className="h-11 rounded-xl"
                    placeholder="Choices, separated by commas"
                  />
                ) : null}
                <Input
                  value={customAttributeDraft.value}
                  onChange={(event) =>
                    setCustomAttributeDraft((draft) => ({
                      ...draft,
                      value: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl"
                  placeholder="Value"
                />
                <Textarea
                  value={customAttributeDraft.notes}
                  onChange={(event) =>
                    setCustomAttributeDraft((draft) => ({
                      ...draft,
                      notes: event.target.value,
                    }))
                  }
                  className="rounded-xl"
                  rows={2}
                  placeholder="Optional notes"
                />
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() => {
                    if (!customAttributeDraft.name.trim() || !customAttributeDraft.value.trim()) {
                      toast.error("Custom attributes need a name and value.");
                      return;
                    }

                    setCustomAttributes((current) => [
                      ...current,
                      { ...customAttributeDraft },
                    ]);
                    setCustomAttributeDraft({
                      name: "",
                      attribute_type: "unsure",
                      suggested_allowed_values_text: "",
                      value: "",
                      notes: "",
                    });
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Custom Attribute
                </Button>

                {customAttributes.length > 0 ? (
                  <div className="space-y-2">
                    {customAttributes.map((attribute, index) => (
                      <div
                        key={`${attribute.name}-${index}`}
                        className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground"
                      >
                        {attribute.name}: {attribute.value}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Add Photos"
              description="You can add new photos, but existing photos stay moderation-controlled."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {photoFiles.map((file, index) => (
                    <FileUpload
                      key={index}
                      label={index === 0 ? "Photo 1" : `Photo ${index + 1}`}
                      onFileSelect={(nextFile) =>
                        setPhotoFiles((current) => {
                          const next = [...current];
                          next[index] = nextFile;
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add up to 5 new photos with this edit submission.
                </p>
              </div>
            </SectionCard>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sticky bottom-4">
              <p className="text-xs text-muted-foreground hidden sm:block">
                Your changes will send this spot back into admin review.
              </p>
              <div className="flex gap-3 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => navigate({ to: "/spot/$spotId", params: { spotId: String(spotId) } })}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="rounded-xl gap-2 px-6">
                  {saving ? (
                    "Submitting..."
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Submit Edit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </PageContainer>
    </>
  );
}
