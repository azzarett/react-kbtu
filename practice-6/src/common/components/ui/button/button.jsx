import styles from "./button.module.css";

export function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
