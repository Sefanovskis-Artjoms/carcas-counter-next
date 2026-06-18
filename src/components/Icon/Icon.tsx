import { ICON_MAP, IconName } from "@/data/icon-data";

/**
 * Renders an icon by injecting its raw SVG markup inline.
 *
 * Why inline (dangerouslySetInnerHTML) instead of an <img>: inlining the SVG
 * keeps it in the DOM so CSS can style it (fill/stroke via `currentColor`, sizing
 * per usage) — needed because the same icon appears in different colours/sizes.
 *
 * Safe to use dangerouslySetInnerHTML here: the markup comes only from the local,
 * developer-authored ICON_MAP (`@/data/icon-data`) — never from user input — so
 * there's no untrusted-HTML/XSS vector.
 */
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
