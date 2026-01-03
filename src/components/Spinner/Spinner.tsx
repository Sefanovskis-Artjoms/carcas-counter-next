import styles from "./Spinner.module.scss";

export default function Spinner({
  size = 24,
  color,
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`${styles.spinner} ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: size * 0.1,
        borderTopColor: color,
      }}
      role="status"
      aria-label="Loading"
    />
  );
}
