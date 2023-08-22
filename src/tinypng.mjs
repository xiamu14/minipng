/**
 *
 * 参考： https://segmentfault.com/a/1190000015467084
 * 优化：通过 X-Forwarded-For 添加了动态随机伪IP，绕过 tinypng 的上传数量限制
 *
 *  */

import fs from "fs";
import https from "https";
import path from "path";
import { customAlphabet } from "nanoid";
import { URL } from "url";
import text from "picocolors";
import ora from "ora";
import niceSpinner from "./spinner.mjs";
import logs from "./logs.mjs";
import { getHashOfFile } from "./get-hash.mjs";
import { rootPath } from "./const.mjs";

const nanoid = customAlphabet("abcdefghiklmnopkrstu", 10);
const cwd = process.cwd();

const logUtil = logs();

const exts = [".jpg", ".png", ".jpeg"];
const maxSize = 5200000; // 5MB == 5242848.754299136
const filenameType = "useId"; // or 'useName'
let filenamePreset = "";
let destDir = "";
let processNumber = 0;
const options = {
  method: "POST",
  hostname: "tinypng.com",
  path: "/backend/opt/shrink",
  headers: {
    rejectUnauthorized: false,
    "Postman-Token": Date.now(),
    "Cache-Control": "no-cache",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
  },
};

export default function tinypng({ filename, dest }) {
  filenamePreset = filename;
  destDir = dest;
  fileList(rootPath);
}

// 生成随机IP， 赋值给 X-Forwarded-For
function getRandomIP() {
  return Array.from(Array(4))
    .map(() => parseInt(Math.random() * 255))
    .join(".");
}

function getFilename(file) {
  const extname = path.extname(file);
  const filename = path.basename(file, extname);
  return filename;
}

function createFileName(imgPath) {
  const id = nanoid(4);
  const extname = path.extname(imgPath);
  const basename = path.basename(imgPath, extname);
  const md5 = getHashOfFile(imgPath);
  let filename = filenamePreset;

  // /\[id\]/, /\[name\]/, /\[hash:\d*\]/
  if (filename.includes("[id]")) {
    filename = filename.replace("[id]", id);
  }
  if (filename.includes("[name]")) {
    filename = filename.replace("[name]", basename);
  }
  if (/\[hash:?\d*\]/.test(filename)) {
    const len = filename.match(/\[hash:?(\d*)\]/);
    let hash = md5;
    if (len[1] && Number(len[1] >= 6)) {
      // NOTE: 防止超出长度
      const end = Math.min(Number(len[1]), md5.length);
      hash = md5.slice(0, end);
    }
    filename = filename.replace(/\[hash:?\d*\]/, hash);
  }
  return `${filename}${extname}`;
}

// 获取文件列表
function fileList(folder) {
  fs.readdir(folder, async (err, files) => {
    if (err) console.error(err);
    const spinner = niceSpinner(`tiny images`);
    spinner.start();
    const list = files.map((file) => {
      return fileFilter(path.join(folder, file));
    });
    await Promise.allSettled(list);
    spinner.finalize("stop");
    logUtil.show();
  });
}

// 过滤文件格式，返回所有jpg,png图片
function fileFilter(file) {
  try {
    const fileStat = fs.statSync(file);
    if (fileStat.isFile()) {
      // 判断文件是否已存在\
      const basename = path.basename(file);
      const supposeFile = path.resolve(destDir, basename);
      if (fs.existsSync(supposeFile)) {
        logUtil.addItem([
          `${text.bgRed(basename)} has exit, please rename it. `,
        ]);
        return Promise.reject();
      }
      if (
        // 文件必须小于5MB，后缀 jpg||png
        fileStat.size <= maxSize &&
        exts.includes(path.extname(file))
      ) {
        // 通过 X-Forwarded-For 头部伪造客户端IP
        options.headers["X-Forwarded-For"] = getRandomIP();
        processNumber += 1;
        return fileUpload(file);
      } else {
        return copy(file);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// 异步API,压缩图片
// {"error":"Bad request","message":"Request is invalid"}
// {"input": { "size": 887, "type": "image/png" },"output": { "size": 785, "type": "image/png", "width": 81, "height": 81, "ratio": 0.885, "url": "https://tinypng.com/web/output/7aztz90nq5p9545zch8gjzqg5ubdatd6" }}
function fileUpload(img) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, function (res) {
      res.on("data", (buf) => {
        let obj = JSON.parse(buf.toString());
        if (obj.error) {
          logUtil.addItem([
            `[${img}]：compressed failed, error：${obj.message}`,
          ]);
          reject();
        } else {
          fileUpdate(img, obj, { resolve, reject });
        }
      });
    });

    req.write(fs.readFileSync(img), "binary");
    req.on("error", (e) => {
      reject();
      console.error("error", e);
    });
    req.end();
  });
}
// 该方法被循环调用,请求图片数据
function fileUpdate(imgPath, obj, { resolve, reject }) {
  const outputDir = destDir;
  const filename = createFileName(imgPath);
  const tinyImgPath = path.join(
    outputDir,
    filename
    // imgPath.replace(root, "")
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  let options = new URL(obj.output.url);
  let req = https.request(options, (res) => {
    let body = "";
    res.setEncoding("binary");
    res.on("data", function (data) {
      body += data;
    });

    res.on("end", function () {
      fs.writeFile(tinyImgPath, body, "binary", (err) => {
        if (err) return console.error(err);
        const compressRatio = `${((1 - obj.output.ratio) * 100).toFixed(2)}%`;

        logUtil.addItem([
          `filename：        ${filename}`,
          `source：          ${path.basename(imgPath)}`,
          `original size：   ${formatBytes(obj.input.size)}`,
          `compressed size： ${formatBytes(obj.output.size)}`,
          `compressed ratio：${text.green(compressRatio)}`,
        ]);
        // 删除原文件
        fs.unlinkSync(imgPath, () => {});
        resolve();
      });
    });
  });
  req.on("error", (e) => {
    console.error("error:", e);
    reject();
  });
  req.end();
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// 不符合压缩工具要求的图片直接复制过去
function copy(imgPath) {
  const outputDir = destDir;
  const filename = createFileName(imgPath);

  const imgDestPath = path.join(
    outputDir,
    filename
    // imgPath.replace(root, "")
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.copyFileSync(imgPath, imgDestPath);

  // console.log(
  //   `图片：${filename} \n原图：${path.basename(imgPath)}\n✨ 复制完成\n`
  // );
  logUtil.addItem([
    `filename：${filename}`,
    `source：${path.basename(imgPath)}`,
    `✨ copy succeeded`,
  ]);
  // 删除原文件
  fs.unlinkSync(imgPath, () => {});
  return Promise.resolve();
}
