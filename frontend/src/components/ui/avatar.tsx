import * as React from "react";

export const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted ${className}`}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

export const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className = "", src, alt = "avatar", ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    if (hasError || !src) return null;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className={`aspect-square h-full w-full object-cover ${className}`}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm select-none ${className}`}
      {...props}
    />
  )
);
AvatarFallback.displayName = "AvatarFallback";
