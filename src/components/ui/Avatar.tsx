import * as React from "react";
import clsx from "clsx";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt = "", size = 32, className }: AvatarProps) {
  const fallback = alt?.[0]?.toUpperCase() ?? "U";
  return (
    <div
      className={clsx(
        "relative rounded-full overflow-hidden bg-[#10131a] border border-[#2c3344] text-white grid place-items-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm">{fallback}</span>
      )}
    </div>
  );
}
export default Avatar;

