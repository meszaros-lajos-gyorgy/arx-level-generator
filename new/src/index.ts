import { constants } from "node-pkware";
import { add, tmp } from "./helpers/functions";

const x = null;

console.log(process.env.OUTPUTDIR);

console.log("hello: ", add(x, 0));

console.log("ascii:", constants.COMPRESSION_ASCII);
console.log("binary:", constants.COMPRESSION_BINARY);
console.log("flatmapping:", tmp());
