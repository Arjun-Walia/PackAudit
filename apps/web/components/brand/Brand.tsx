import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/site";

export function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M11 5H5v6m24-6h6v6M5 29v6h6m24-6v6h-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="12"
        y="11"
        width="16"
        height="18"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path d="M14.2 16.5h11.6" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

export function BrandLink({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link className={className} href={href} aria-label={`${PRODUCT_NAME} home`}>
      <BrandMark />
      <span>{PRODUCT_NAME}</span>
    </Link>
  );
}
