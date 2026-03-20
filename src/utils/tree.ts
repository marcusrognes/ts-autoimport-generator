export type TreeNode = { [key: string]: TreeNode | string };

export function getRootSegments(patterns: string[]): string[] {
  const prefixes = patterns.map((p) => {
    const segs = p.split("/");
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
    if (!node[keyPath[i]]) node[keyPath[i]] = {};
    node = node[keyPath[i]] as TreeNode;
  }

  node[keyPath[keyPath.length - 1]] = varName;
}

export function serializeTree(node: TreeNode, indentSize: number): string {
  const indent = " ".repeat(indentSize);

  return Object.entries(node)
    .map(([key, value]) => {
      if (typeof value === "string") {
        return `${indent}${key}: { ...${value} },`;
      }
      return `${indent}${key}: {\n${serializeTree(value, indentSize + 2)}\n${indent}},`;
    })
    .join("\n");
}

export function stripExtension(name: string): string {
  return name.includes(".") ? name.split(".").slice(0, -1).join(".") : name;
}
