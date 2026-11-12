const path = require("node:path");
module.exports = (root, slug) => path.join(root, "units", slug);