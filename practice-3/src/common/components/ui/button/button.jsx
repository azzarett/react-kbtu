import styles from "./button.module.css";

export function Button({
  children,
  variant = "primary",
  tone,
  type = "button",
  className = "",
  ...props
}) {
  const variantClass =
    variant === "text" ? styles.textButton : styles.primaryButton;
  return (
    <button
      type={type}
      className={[
        variantClass,
        tone === "danger" ? styles.removeButton : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
