import { collected } from "./imports.generated.ts";

console.log(collected.Test.data);
console.log(collected.test02());
console.log(collected.test02Another());

import { actions } from "./features/actions.generated.ts";

const myTree = actions.data.tree.logTree("Tree");
const another = actions.nodes.test.file.doAction();
