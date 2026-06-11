import { ICON_MAP, IconName } from "@/data/icon-data";

export default function Icon({
  name,
  className,
  style,
}: {
  name: IconName;
  className?: string;
  style?: React.CSSProperties;
}) {
  const svgString = ICON_MAP[name];

  if (!svgString) {
    console.warn(`Icon with name "${name}" not found.`);
    return null;
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
