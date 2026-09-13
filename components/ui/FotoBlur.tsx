"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Image from "next/image";
import { decodeBlurhash, validBlurhash } from "@/lib/blurhash";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<typeof Image>, "placeholder" | "blurDataURL"> & {
  blurhash?: string | null;
};

// next/image with a BlurHash painted on a canvas underneath. The canvas is
// drawn after hydration (no extra bytes in the HTML), the image fades in
// when it lands, and the box never changes size — no layout shift.
export function FotoBlur({ blurhash, className, alt, onLoad, ...rest }: Props) {
  const kanvas = useRef<HTMLCanvasElement>(null);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    const c = kanvas.current;
    if (!c || !validBlurhash(blurhash)) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const data = new ImageData(decodeBlurhash(blurhash, 32, 24), 32, 24);
    ctx.putImageData(data, 0, 0);
  }, [blurhash]);

  return (
    <>
      {validBlurhash(blurhash) && (
        <canvas ref={kanvas} width={32} height={24} aria-hidden="true" className={cn("absolute inset-0 h-full w-full", siap && "invisible")} />
      )}
      <Image
        {...rest}
        alt={alt}
        onLoad={(e) => {
          setSiap(true);
          onLoad?.(e);
        }}
        className={cn(className, "transition-opacity duration-200 ease-out", siap ? "opacity-100" : "opacity-0")}
      />
    </>
  );
}
