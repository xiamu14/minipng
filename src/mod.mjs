#!/usr/bin/env node

import cac from "cac";
import text from "picocolors";
import path from "path";
import fs from "fs";
import tinypng from "./tinypng.mjs";
import { rootPath } from "./const.mjs";
const cli = cac();

cli
  .command("[...files]", "default")
  .option("--dest <directory>", "destination directory. example: dist")
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
      // console.log("dest", options.dest);
      dest = path.resolve(process.cwd(), options.dest);
    }
    // TODO: 检查 .images 文件夹是否存在
    if (!fs.existsSync(rootPath)) {
      console.log(
        text.red(`"${rootPath}" does not exist. please create id first.`)
      );
      process.exit(1);
    }
    // TODO: 检查 dest 是否存在
    if (!fs.existsSync(dest)) {
      console.log(
        text.red(`"${dest}" does not exist. please create id first.`)
      );
      process.exit(1);
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
