var recursive = require("recursive-readdir");

recursive(process.cwd(), function (err, files) {
  // `files` is an array of file paths
  console.log(files);
});
