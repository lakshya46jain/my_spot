import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { PlaceholderShell } from "@/components/PlaceholderShell";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { Heart, BookmarkCheck } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  // Database implementation required here — fetch user's saved favorites
  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <PlaceholderShell
          title="Your Favorites"
          description="Save the study spots you love and access them quickly whenever you need a place to focus."
          icon={<Heart className="h-7 w-7 text-warm-500" />}
        >
          <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-warm-200 flex items-center justify-center">
                <BookmarkCheck className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Saved Collections</h4>
            </div>
            <p className="text-sm text-muted-foreground">Organize your saved spots into custom collections — quiet spots, group study, late-night access, and more.</p>
          </div>
        </PlaceholderShell>
      </PageContainer>
    </>
  );
}
