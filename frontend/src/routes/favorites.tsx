import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { PageTitleBlock } from "@/components/PageTitleBlock";
import { SpotCard } from "@/components/SpotCard";
import { SpotCardSkeleton } from "@/components/SpotCardSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import {
  addFavoriteSpot,
  getFavoriteSpots,
  removeFavoriteSpot,
} from "@/server/favorites";
import type { Spot } from "@/types/api";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const navigate = useNavigate();
  const { isHydrated, isLoggedIn, user } = useAuth();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoritePendingIds, setFavoritePendingIds] = useState<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isLoggedIn || !user) {
      setLoading(false);
      setSpots([]);
      return;
    }

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getFavoriteSpots({
          data: { userId: user.userId },
        });
        setSpots(result ?? []);
      } catch (err) {
        setError(
          getUserFriendlyErrorMessage(
            err,
            "Something went wrong while loading your favorites.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadFavorites();
  }, [isHydrated, isLoggedIn, refreshKey, user]);

  const handleViewDetails = (spotId: number) => {
    navigate({
      to: "/spot/$spotId",
      params: { spotId: String(spotId) },
      search: { from: "favorites", adminPreview: false },
    });
  };

  const handleToggleFavorite = async (
    spotId: number,
    nextIsFavorited: boolean,
  ) => {
    if (!user) {
      toast.error("Sign in to save favorites.");
      return;
    }

    const previousSpots = spots;

    setFavoritePendingIds((current) => [...current, spotId]);
    setSpots((current) =>
      nextIsFavorited
        ? current.map((spot) =>
            spot.spot_id === spotId
              ? { ...spot, is_favorited: true }
              : spot,
          )
        : current.filter((spot) => spot.spot_id !== spotId),
    );

    try {
      const result = nextIsFavorited
        ? await addFavoriteSpot({
            data: { userId: user.userId, spotId },
          })
        : await removeFavoriteSpot({
            data: { userId: user.userId, spotId },
          });

      toast.success(result.message);

      if (nextIsFavorited) {
        setRefreshKey((current) => current + 1);
      }
    } catch (err) {
      setSpots(previousSpots);
      toast.error(
        getUserFriendlyErrorMessage(
          err,
          "We couldn't update favorites right now.",
        ),
      );
    } finally {
      setFavoritePendingIds((current) =>
        current.filter((pendingId) => pendingId !== spotId),
      );
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading favorites...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Sign In Required
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to save spots and view your favorites collection.
          </p>
          <Button asChild>
            <Link to="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <PageTitleBlock
          title="Your Favorites"
          subtitle="Quick access to the study spots you’ve saved from Explore."
        />

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SpotCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 max-w-md mx-auto">
              <p className="text-destructive font-medium mb-2">
                Something went wrong
              </p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={() => setRefreshKey((current) => current + 1)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        ) : spots.length === 0 ? (
          <div className="text-center py-16">
            <div className="rounded-2xl border border-border bg-card p-10 max-w-md mx-auto shadow-sm">
              <Heart className="h-12 w-12 text-warm-300 mx-auto mb-4" />
              <h3 className="text-xl font-display text-foreground mb-2">
                No favorites yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Hover over a spot tile in Explore and tap the heart to save it here.
              </p>
              <Button asChild className="gap-2">
                <Link to="/explore">
                  <Heart className="h-4 w-4" />
                  Browse Explore
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {spots.map((spot) => (
                <SpotCard
                  key={spot.spot_id}
                  spot={spot}
                  isLoggedIn={isLoggedIn}
                  isOwner={user?.userId === spot.user_id}
                  favoritePending={favoritePendingIds.includes(spot.spot_id)}
                  onViewDetails={handleViewDetails}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                You’ve saved{" "}
                <span className="font-semibold text-foreground">
                  {spots.length}
                </span>{" "}
                favorite spot{spots.length === 1 ? "" : "s"}.
              </p>
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
