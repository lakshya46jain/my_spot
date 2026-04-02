import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Compass, Heart, Star, Share2, Shield, Coffee } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  {
    icon: Compass,
    title: "Discover Study Spots",
    description: "Browse trending and highly rated study locations curated by fellow students.",
  },
  {
    icon: Heart,
    title: "Save Favorites",
    description: "Bookmark the spots that work best for you and access them anytime.",
  },
  {
    icon: Star,
    title: "Read Reviews",
    description: "Get real feedback from students who have been there, including noise levels and amenities.",
  },
  {
    icon: Share2,
    title: "Share Your Own Spot",
    description: "Know a hidden gem? Help the community by adding it to the platform.",
  },
  {
    icon: Shield,
    title: "Admin Moderation",
    description: "Quality content through community standards and moderation workflows.",
  },
];

function LandingPage() {
  const { loginAsGuest, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleContinueAsGuest = () => {
    // Database implementation required here — create guest session
    loginAsGuest();
    navigate({ to: "/explore" });
  };

  // If already authenticated/guest, redirect to explore (home)
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">You're already signed in.</p>
          <Button asChild>
            <Link to="/explore">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <span className="text-2xl font-display text-primary tracking-tight">MySpot</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl lg:text-6xl font-display text-foreground leading-tight"
          >
            Discover your next favorite study spot.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
          >
            MySpot helps you find, evaluate, and share the best places to study — from cozy coffee shops to quiet libraries. Join a community of students who know where to focus.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Button variant="hero" size="lg" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button variant="warm" size="lg" onClick={handleContinueAsGuest}>
              Continue as Guest
            </Button>
          </motion.div>
        </div>

        {/* Decorative abstract visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 rounded-3xl bg-gradient-to-br from-warm-100 via-warm-200 to-warm-100 border border-warm-300 p-12 relative overflow-hidden"
        >
          <div className="absolute top-6 right-8 h-24 w-24 rounded-full bg-primary/10" />
          <div className="absolute bottom-8 left-12 h-16 w-16 rounded-full bg-terracotta/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-warm-300/30" />
          <div className="relative flex items-center justify-center gap-6 py-8">
            <Coffee className="h-16 w-16 text-warm-500" />
            <div className="text-center">
              <p className="text-2xl font-display text-warm-700">Your perfect study space awaits</p>
              <p className="mt-2 text-warm-500">Trending spots · Reviews · Community picks</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-warm-50 border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display text-foreground">Everything you need to find your spot</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              A full suite of tools to discover, review, and share study locations with your community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="rounded-2xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-warm-200">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="text-lg font-display text-primary">MySpot</span>
          <p className="mt-2 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MySpot. Helping students find their perfect study space.
          </p>
        </div>
      </footer>
    </div>
  );
}
