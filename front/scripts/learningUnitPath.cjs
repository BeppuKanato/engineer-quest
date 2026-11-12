const fs = require("node:fs");
const path = require("node:path");
// 段階移行中のみ旧配置を解決する。全単元移動後に分岐を取り除く。
module.exports = (root, slug) => path.join(root, fs.existsSync(path.join(root, "units", slug)) ? "units" : "", slug);