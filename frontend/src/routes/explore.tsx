import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { PlaceholderShell } from "@/components/PlaceholderShell";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { Compass, TrendingUp, MapPin } from "lucide-react";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  // Database implementation required here — fetch and display study spots
  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <PlaceholderShell
          title="Explore Study Spots"
          description="Discover trending, top-rated, and nearby study locations. Browse by category, vibe, or amenities."
          icon={<Compass className="h-7 w-7 text-warm-500" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-warm-200 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Trending Now</h4>
              </div>
              <p className="text-sm text-muted-foreground">See what's popular among students this week — updated in real time.</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-warm-200 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Near You</h4>
              </div>
              <p className="text-sm text-muted-foreground">Find study spots close to your current location with walking distances.</p>
            </div>
          </div>
        </PlaceholderShell>
      </PageContainer>
    </>
  );
}
