export function getSafeName(name: string): string {
  return name
    .replace(/\./g, "_")
    .replace(new RegExp(`g\${path.delimiter}/g`), "_");
}
