import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline-dark" | "outline-light" | "ghost";
  size?: "md" | "lg";
  showArrow?: boolean;
  className?: string;
};

export default function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  showArrow = false,
  className,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-medium transition-colors duration-200 ease-arch";

  const sizes = {
    md: "px-5 py-3 text-sm",
    lg: "px-7 py-4 text-[15px]",
  };

  const variants = {
    primary: "bg-gold text-ink hover:bg-gold-light",
    "outline-dark":
      "border border-ink-line text-paper-white hover:border-gold hover:text-gold",
    "outline-light":
      "border border-paper-line text-ink hover:border-gold hover:text-gold-dim",
    ghost: "text-paper-white hover:text-gold",
  };

  return (
    <Link
      href={href}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {children}
      {showArrow && <ArrowUpRight size={16} strokeWidth={1.75} />}
    </Link>
  );
}
