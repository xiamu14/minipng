#!/usr/bin/env node

import cac from "cac";
import text from "picocolors";
import path from "path";
import tinypng from "./tinypng.mjs";
const cli = cac();

cli
  .command("[...files]", "default")
  .option("--dest", "destination directory. example: dist")
  .option(
    "--filename <filename>",
    "custom filename rule, support <id> <name> <hash:<number>>. example: [name]-[hash]. default: [id]-[hash:10]"
  )
  .action((_, options) => {
    let filename = "[id]-[hash:10]";
    if (options.filename) {
      filename = options.filename;
    }
    let dest = path.resolve(process.cwd(), "dist");
    if (options.dest) {
      dest = path.resolve(process.cwd(), options.dest);
    }
    console.log(
      `\nfilename will follow the rule \n${text.blue(text.bold(filename))}\n`
    );
    console.log(
      `file will save be stored in this directory \n${text.blue(
        text.bold(dest)
      )}\n`
    );
    tinypng({ filename, dest });
  });

cli.help();
cli.parse();
