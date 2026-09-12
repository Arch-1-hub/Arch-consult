import Link from "next/link";
import Image from "next/image";

/**
 * Official Arch Consult mark, extracted from the supplied logo artwork
 * (background removed, provided as /public/logo-icon-dark.png for light
 * surfaces and /public/logo-icon-light.png for dark surfaces). Never
 * distort, recolor, or restretch the icon itself — only its surrounding
 * wordmark and color context change between variants.
 */
export default function Logo({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const src =
    variant === "dark" ? "/logo-icon-dark.png" : "/logo-icon-light.png";
  const textClass = variant === "dark" ? "text-ink" : "text-paper-white";

  return (
    <Link
      href="/"
      aria-label="Arch Consult home"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <Image
        src={src}
        alt=""
        width={28}
        height={19}
        priority
        className="shrink-0"
      />
      <span className={`font-display text-[19px] leading-none ${textClass}`}>
        Arch <span className="text-gold">Consult</span>
      </span>
    </Link>
  );
}
