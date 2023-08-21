import crypto from "crypto";
import fs from "fs";

/**
 * 获得内容的hash值
 *
 * @param {String} content 文件内容
 * @param {String} encoding 文件的编码，例如：'utf8' 等
 * @param {String} type hash算法，例如：'md5'、'sha1'、'sha256'、'sha512' 等
 * @returns {String}
 * @author helinjiang
 * @date   2015-11-15
 */
export function getHash(content, encoding, type) {
  return crypto.createHash(type).update(content, encoding).digest("hex");
}

/**
 * 获得文件的hash值
 *
 * @param {String} filePath 文件路径
 * @returns {String}
 * @author helinjiang
 * @date   2015-11-15
 */
export function getHashOfFile(filePath) {
  return getHash(fs.readFileSync(filePath, "utf8"), "utf8", "md5");
}
