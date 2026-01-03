import { ICON_MAP, IconName } from "@/data/icon-data";

export default function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
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
      }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
