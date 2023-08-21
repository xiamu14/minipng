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
import { getHashOfFile } from "./get-hash.mjs";
const nanoid = customAlphabet("abcdefghiklmnopkrstu", 10);
const cwd = process.cwd();

const root = path.resolve(cwd, ".images");
const exts = [".jpg", ".png", ".jpeg"];
const maxSize = 5200000; // 5MB == 5242848.754299136
const filenameType = "useId"; // or 'useName'
let filenamePreset = "";
let destDir = "";

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
  fileList(root);
}

// 生成随机IP， 赋值给 X-Forwarded-For
function getRandomIP() {
  return Array.from(Array(4))
    .map(() => parseInt(Math.random() * 255))
    .join(".");
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
    if (len[1] && Number(len[1] > 0)) {
      hash = md5.slice(0, Number(len[1]));
    }
    filename = filename.replace(/\[hash:?\d*\]/, hash);
  }
  return `${filename}${extname}`;
}

// 获取文件列表
function fileList(folder) {
  fs.readdir(folder, (err, files) => {
    if (err) console.error(err);
    files.forEach((file) => {
      fileFilter(path.join(folder, file));
    });
  });
}

// 过滤文件格式，返回所有jpg,png图片
function fileFilter(file) {
  fs.stat(file, (err, stats) => {
    if (err) return console.error(err);
    if (
      // 必须是文件，小于5MB，后缀 jpg||png
      stats.size <= maxSize &&
      stats.isFile() &&
      exts.includes(path.extname(file))
    ) {
      // 通过 X-Forwarded-For 头部伪造客户端IP
      options.headers["X-Forwarded-For"] = getRandomIP();

      fileUpload(file); // console.log('可以压缩：' + file);
    } else {
      copy(file);
    }
    // if (stats.isDirectory()) fileList(file + '/');
  });
}

// 异步API,压缩图片
// {"error":"Bad request","message":"Request is invalid"}
// {"input": { "size": 887, "type": "image/png" },"output": { "size": 785, "type": "image/png", "width": 81, "height": 81, "ratio": 0.885, "url": "https://tinypng.com/web/output/7aztz90nq5p9545zch8gjzqg5ubdatd6" }}
function fileUpload(img) {
  var req = https.request(options, function (res) {
    res.on("data", (buf) => {
      let obj = JSON.parse(buf.toString());
      if (obj.error) {
        console.log(`[${img}]：压缩失败！报错：${obj.message}`);
      } else {
        fileUpdate(img, obj);
      }
    });
  });

  req.write(fs.readFileSync(img), "binary");
  req.on("error", (e) => {
    console.error("error-0", e);
  });
  req.end();
}
// 该方法被循环调用,请求图片数据
function fileUpdate(imgPath, obj) {
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
        console.log(
          `图片：${filename} \n原图：${path.basename(
            imgPath
          )} \n原始大小：${formatBytes(
            obj.input.size
          )} \n压缩大小：${formatBytes(obj.output.size)} \n压缩率：${text.green(
            compressRatio
          )}\n`
        );
        // 删除原文件
        fs.unlinkSync(imgPath, () => {});
      });
    });
  });
  req.on("error", (e) => {
    console.error("error:", e);
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

  console.log(
    `图片：${filename} \n原图：${path.basename(imgPath)}\n✨ 复制完成\n`
  );
  // 删除原文件
  fs.unlinkSync(imgPath, () => {});
}
