import styles from "./visually-hidden.module.css";

export function VisuallyHidden({ as: Component = "span", children, ...props }) {
  return (
    <Component className={styles.srOnly} {...props}>
      {children}
    </Component>
  );
}
