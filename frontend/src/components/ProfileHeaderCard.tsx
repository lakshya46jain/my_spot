import { cn } from "@/lib/utils";
import { Camera, User } from "lucide-react";

interface ProfileHeaderCardProps {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  badge?: string;
  onAvatarChange?: () => void;
  className?: string;
}

export function ProfileHeaderCard({
  name = "Your Name",
  email = "you@example.com",
  avatarUrl,
  badge = "Student",
  onAvatarChange,
  className,
}: ProfileHeaderCardProps) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border p-6 shadow-sm", className)}>
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="h-20 w-20 rounded-full bg-warm-200 flex items-center justify-center overflow-hidden border-2 border-warm-300">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-9 w-9 text-warm-500" />
            )}
          </div>
          {onAvatarChange ? (
            <button
              type="button"
              onClick={onAvatarChange}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-5 w-5 text-primary-foreground" />
            </button>
          ) : null}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{name}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-warm-200 px-3 py-0.5 text-xs font-medium text-warm-700">
            {badge}
          </span>
        </div>
      </div>
    </div>
  );
}
