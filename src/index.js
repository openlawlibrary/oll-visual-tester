const { screenshot } = require('./functions/screenshot')
const { generateImages, compareImages } = require('./functions/image-diff')

module.exports = {
  screenshot,
  generateImages,
  compareImages,
}
