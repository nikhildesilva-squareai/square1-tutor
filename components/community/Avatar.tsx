import Image from "next/image";

interface AvatarProps {
  name?: string;
  initials?: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

/** Circular member avatar: photo when present, else brand-tinted initials. */
export function Avatar({ name, initials, avatarUrl, size = 40, className = "" }: AvatarProps) {
  const label = initials ?? (name ? name.slice(0, 2).toUpperCase() : "?");
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name ?? "Member"}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-surface-tint text-brand flex items-center justify-center font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size <= 36 ? 13 : 15 }}
    >
      {label}
    </div>
  );
}
