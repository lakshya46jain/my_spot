import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { Compass, MapPin, Star, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import type { Spot } from "@/types/api";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      const result = await apiService.getSpots();
      if (result.success) {
        setSpots(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch spots');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpot = async (spotId: number) => {
    if (!confirm('Are you sure you want to delete this spot?')) {
      return;
    }

    try {
      const result = await apiService.deleteSpot(spotId);
      if (result.success) {
        // Remove the spot from the local state
        setSpots(prev => prev.filter(spot => spot.spot_id !== spotId));
      } else {
        throw new Error(result.error || 'Failed to delete spot');
      }
    } catch (err) {
      alert('Error deleting spot: ' + (err instanceof Error ? err.message : 'An error occurred'));
    }
  };

  if (loading) {
    return (
      <>
        <FloatingRightNav />
        <PageContainer>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading study spots...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <FloatingRightNav />
        <PageContainer>
          <div className="text-center py-12">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-800">Error loading spots: {error}</p>
              <button
                onClick={fetchSpots}
                className="mt-2 px-4 py-2 bg-warm-500 text-white rounded-lg hover:bg-warm-600"
              >
                Try Again
              </button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <div className="mb-8">
          <Compass className="h-12 w-12 text-warm-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground text-center mb-2">Explore Study Spots</h1>
          <p className="text-muted-foreground text-center">
            Discover trending, top-rated, and nearby study locations.
          </p>
        </div>

        {spots.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-8 bg-card border border-border rounded-2xl max-w-md mx-auto">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No spots yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to add a study spot to the community!
              </p>
              <a
                href="/add-spot"
                className="inline-block px-6 py-3 bg-warm-500 text-white rounded-lg hover:bg-warm-600 transition-colors"
              >
                Add a Spot
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.map((spot) => (
              <div key={spot.spot_id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {spot.spot_name}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {spot.spot_type}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    spot.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : spot.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {spot.status}
                  </span>
                </div>

                {spot.short_description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {spot.short_description}
                  </p>
                )}

                {spot.address && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{spot.address}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(spot.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {/* TODO: Implement edit */}}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSpot(spot.spot_id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
