import { ArrowUpRight } from "lucide-react";
import styles from "./text-link.module.css";

export function TextLink({
  href,
  children,
  external = false,
  className = "",
  ...props
}) {
  return (
    <a
      className={`${styles.link} ${className}`}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      {external && (
        <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
      )}
    </a>
  );
}
