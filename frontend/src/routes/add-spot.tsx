import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { PlaceholderShell } from "@/components/PlaceholderShell";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { PlusCircle, Image, FileText } from "lucide-react";

export const Route = createFileRoute("/add-spot")({
  component: AddSpotPage,
});

function AddSpotPage() {
  // Database implementation required here — handle spot submission form
  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <PlaceholderShell
          title="Add a Study Spot"
          description="Know a great place to study? Share it with the MySpot community and help others find their perfect space."
          icon={<PlusCircle className="h-7 w-7 text-warm-500" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-warm-200 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Spot Details</h4>
              </div>
              <p className="text-sm text-muted-foreground">Name, address, hours, noise level, Wi-Fi quality, and available amenities.</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-warm-200 flex items-center justify-center">
                  <Image className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Photos & Media</h4>
              </div>
              <p className="text-sm text-muted-foreground">Upload photos to give others a feel for the space before they visit.</p>
            </div>
          </div>
        </PlaceholderShell>
      </PageContainer>
    </>
  );
}
