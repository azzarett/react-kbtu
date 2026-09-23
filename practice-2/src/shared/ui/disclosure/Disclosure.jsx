import { useId, useState } from "react";
import { Plus, Minus } from "lucide-react";
import styles from "./Disclosure.module.css";

export function Disclosure({ label, expandedLabel = "Show less", children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {open ? expandedLabel : label}
        {open ? (
          <Minus size={13} aria-hidden="true" />
        ) : (
          <Plus size={13} aria-hidden="true" />
        )}
      </button>
      <div id={id} hidden={!open} className={styles.content}>
        {children}
      </div>
    </div>
  );
}
