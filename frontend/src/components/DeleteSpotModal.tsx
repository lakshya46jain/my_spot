import { ConfirmationModal } from "@/components/ConfirmationModal";

interface DeleteSpotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spotName: string;
  onConfirm: () => void;
}

export function DeleteSpotModal({
  open,
  onOpenChange,
  spotName,
  onConfirm,
}: DeleteSpotModalProps) {
  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete "${spotName}"?`}
      description="This will permanently remove this study spot and all associated reviews, media, and data. This action cannot be undone."
      confirmLabel="Yes, delete spot"
      cancelLabel="Keep it"
      onConfirm={onConfirm}
      destructive
    />
  );
}
