import sources from "@/lib/yj/figma-assets.json";
import { Asset } from "./ui";
export function DesignAsset({
  screen,
  name,
  className = "",
  alt = "",
}: {
  screen: string;
  name: string;
  className?: string;
  alt?: string;
}) {
  const file = (sources as Record<string, Record<string, string>>)[screen]?.[
    name
  ];
  return file ? <Asset name={file} className={className} alt={alt} /> : null;
}
