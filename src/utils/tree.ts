export type TreeNode = { [key: string]: TreeNode | string };

export function getRootSegments(patterns: string[]): string[] {
  const prefixes = patterns.map((p) => {
    const normalized = p.startsWith("./") ? p.slice(2) : p;
    const segs = normalized.split("/");
    const firstGlob = segs.findIndex(
      (s) => s.includes("*") || s.includes("?") || s.includes("{"),
    );
    return firstGlob === -1 ? segs.slice(0, -1) : segs.slice(0, firstGlob);
  });

  const first = prefixes[0] ?? [];

  let i = 0;

  while (i < first.length && prefixes.every((p) => p[i] === first[i])) i++;

  return first.slice(0, i);
}

export function insertIntoTree(
  root: TreeNode,
  keyPath: string[],
  varName: string,
) {
  let node = root;

  for (let i = 0; i < keyPath.length - 1; i++) {
    const key = keyPath[i];
    if (typeof node[key] === "string") {
      throw new Error(
        `Tree conflict: "${keyPath.slice(0, i + 1).join("/")}" is used as both a file key and a directory`,
      );
    }
    if (!node[key]) node[key] = {};
    node = node[key] as TreeNode;
  }

  const leafKey = keyPath[keyPath.length - 1];
  if (leafKey in node) {
    throw new Error(
      `Tree key collision: two files resolve to the same tree key "${keyPath.join("/")}"`,
    );
  }
  node[leafKey] = varName;
}

export function serializeTree(node: TreeNode, indentSize: number): string {
  const indent = " ".repeat(indentSize);

  return Object.entries(node)
    .map(([key, value]) => {
      if (typeof value === "string") {
        return `${indent}...${value},`;
      }
      return `${indent}${key}: {\n${serializeTree(value, indentSize + 2)}\n${indent}},`;
    })
    .join("\n");
}

export function stripExtension(name: string): string {
  return name.includes(".") ? name.split(".").slice(0, -1).join(".") : name;
}

const SOURCE_EXTENSIONS = [".ts", ".tsx"];

export function stripSourceExtension(path: string): string {
  for (const ext of SOURCE_EXTENSIONS) {
    if (path.endsWith(ext)) return path.slice(0, -ext.length);
  }
  return path;
}
