import { writeFile, appendFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { randomInt } from "node:crypto";
const numberFile = "numbers.txt";
const maxRandomNumber = 10_000;
const sizeOfFileInMb = 100;

// usage:
// npm start generate - creates a 1 MB file with random numbers
// npm start compute - builds a trie, counts the dupes, prints them out

class Node {
  constructor(prefix: string) {}
  next: Map<string, Node> = new Map();
  count = 0;
}

export async function generateNumbers() {
  await writeFile(numberFile, "");

  let buffer: string[] = [];
  async function purgeBuffer() {
    await appendFile(numberFile, buffer.join("\n"));
    buffer = [];
  }

  while (true) {
    if (buffer.length >= 10_000) {
      let size = (await stat(numberFile)).size / 1_000_000;
      await purgeBuffer();

      console.log("size: " + size);

      // minimum size in MB
      if (size > sizeOfFileInMb) {
        break;
      }
    }
    buffer.push(randomInt(maxRandomNumber).toString());
  }
  await purgeBuffer();
}

export function recurseNode(
  currentNode: Node | undefined,
  fullString: string,
  remainderOfString: string
) {
  if (!currentNode) {
    throw new Error("invalid args");
  }

  if (!remainderOfString[0]) {
    currentNode.count = currentNode.count + 1;
    return;
  }

  // does key exist? create it if not.
  if (!currentNode.next.has(remainderOfString[0])) {
    currentNode.next.set(remainderOfString[0], new Node(remainderOfString[0]));
  }

  // do any chars remain? if not, increment count and exit.
  recurseNode(
    currentNode.next.get(remainderOfString[0]),
    fullString,
    remainderOfString.substring(1)
  );
}

export function* findDuplicates(
  currentNode: Node,
  builtString: string
): Generator<string, void, void> {
  if (currentNode.count > 1) {
    yield builtString;
  }
  for (let childNodes of currentNode.next) {
    for (let duplicate of findDuplicates(
      childNodes[1],
      builtString + childNodes[0]
    )) {
      yield duplicate;
    }
  }

  return;
}

export async function compute() {
  let root = new Node("");

  await new Promise<void>((resolve) => {
    let stream = createInterface(createReadStream(numberFile));

    stream.on("line", (line) => {
      if (!line[0]) {
        return;
      }

      recurseNode(root, line, line);
    });
    stream.on("close", () => resolve());
  });

  // find dupes, traversal will be O(N) ?
  console.log("finding dupes");

  let resultsOutput = ``;
  for (let result of findDuplicates(root, "")) {
    resultsOutput = resultsOutput + result + "\n";
  }

  writeFile("results.txt", resultsOutput);
}
async function main() {
  if (process.argv[2] === "generate") {
    await generateNumbers();
  }
  if (process.argv[2] === "compute") {
    await compute();
  }

  console.log("done");
}

main().catch((x) => {
  console.error(x);
  process.exit(1);
});
