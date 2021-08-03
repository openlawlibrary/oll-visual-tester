const path = require('path')
const fs = require('fs')
const os = require('os')
const { joinImages } = require('join-images')
const { imgDiff } = require('img-diff-js')
const { screenshot } = require('./screenshot')
const { log, isFalsy } = require('./helpers')

/**
 * Reads directory if it exists and is accessible
 *
 * @param {String} dir - Path to check for access
 * @returns {Promise} Returns file list if it exists
 */
const readDir = (dir) => {
  return new Promise((resolve, reject) => {
    // Check if path is valid
    fs.access(dir, fs.R_OK, (error) => {
      if (error) {
        reject(new Error('Requested directory doesn\'t exist.'))
      } else {
        // Read requested directory
        fs.readdir(dir, (fileError, files) => {
          if (fileError) {
            reject(new Error(`Unable to read directory: ${fileError}`))
          } else {
            resolve(files)
          }
        })
      }
    })
  })
}

/**
 * Returns image names for a specified directory. By default it only returns
 * file names with `.jpg`, `.jpeg` and `.png` extensions, but you can override
 * that with a second argument and return files with specific extension.
 *
 * @param {String} dir - Directory where to look for images
 * @param {String} [extension=jpg, jpeg, png] - Single user defined extension OR all supported images
 * @returns {Array} Returns an array of file names
 *
 * @example
 * getImageNames('temp/baseline', '.png')
 *   .then(dir => { console.log(dir) })
 *   .catch(error => { console.error(error) })
 */
const getImageNames = (dir, extension = null) => {
  return new Promise((resolve, reject) => {
    readDir(dir)
      .then((files) => {
        const images = files.filter(file => {
          if (extension === null && file.match(/(.jpg)$|(.jpeg)$|(.png)$/gi)) {
            return file
          } else if (file.match(new RegExp('\\b' + extension + '$\\b'))) {
            return file
          }

          return null
        })

        resolve(images.length > 0 ? images : [])
      })
      .catch(error => { reject(error) })
  })
}

/**
 * Generates screenshots in serial or parallel mode.
 * Serial mode is recommended for low-end machines
 * Parallel mode is recommended for high end machines
 *
 * @param {Object} options - Configuration object
 * @param {Array} options.imagesConfig - Array of image configurations
 * @param {Boolean} [options.serial] - Generator mode `serial` = true, `parallel` = false. If not set, it will be automatically detected based on PC specs
 * @param {Boolean} [options.debug] - Show or hide debug messages, overrides individual settings from `imagesConfig`
 * @param {Boolean} [options.path] - If set overrides individual paths from `imagesConfig`
 * @returns {Promise} Returns array of results
 */
const generateImages = (options) => {
  const OPTIONS = {
    imagesConfig: null,
    serial: null,
    debug: null,
    path: null,
    ...options
  }

  // Internal functions
  // ---------------------------------------------------------------------------
  // Generate screenshots in series
  const generateInSeries = async () => {
    const results = []
    const errors = []

    log('Started to generate screenshots in serial mode', OPTIONS.debug)

    for (let i = 0; i < OPTIONS.imagesConfig.length; i++) {
      await screenshot(OPTIONS.imagesConfig[i])
        .then((result) => results.push(result))
        .catch((error) => errors.push(error))
    }

    return new Promise((resolve, reject) => {
      if (errors.length === 0) { resolve(results) } else { reject(errors) }
    })
  }

  // Generate screenshots in parallel
  const generateInParallel = () => {
    const configs = []

    log('Started to generate screenshots in parallel mode', OPTIONS.debug)

    for (let i = 0; i < OPTIONS.imagesConfig.length; i++) {
      configs.push(
        screenshot(OPTIONS.imagesConfig[i])
      )
    }

    return new Promise((resolve, reject) => {
      Promise.all(configs)
        .then(values => { resolve(values) })
        .catch(error => { reject(error) })
    })
  }

  // Main function
  // ---------------------------------------------------------------------------
  return new Promise((resolve, reject) => {
    // Error checks
    // ------------
    if (!Array.isArray(OPTIONS.imagesConfig) || OPTIONS.imagesConfig.length < 1) {
      reject(new Error('Cannot create screenshots without configuration array of objects'))
    }

    // Overrides
    // ---------
    // Debug
    if (OPTIONS.debug !== null) {
      OPTIONS.imagesConfig = OPTIONS.imagesConfig.map(image => {
        image.debug = Boolean(OPTIONS.debug)

        return image
      })
    }

    // Path
    if (OPTIONS.path !== null) {
      OPTIONS.imagesConfig = OPTIONS.imagesConfig.map(image => {
        image.path = OPTIONS.path

        return image
      })
    }

    // Determine CPU capability
    // ------------------------
    const cpuCores = os.cpus().length
    const cpuSpeed = os.cpus()[0].speed
    const freeRam = Math.round(os.freemem() / Math.pow(1024, 2))
    let capability = 'low' // Default state is low

    log(
      `PC specs: ${cpuCores} CPU cores / ${cpuSpeed} GHz / ${freeRam} MB RAM free`,
      OPTIONS.debug
    )

    // Check if PC could generate screenshots in parallel
    if (OPTIONS.serial === null) {
      if (cpuCores >= 4 && cpuSpeed > 2500 && freeRam >= 8096) {
        capability = 'capable'
      }
    }

    // Start generating screenshots
    // -------------------------------------------------------------------------
    if (
      (OPTIONS.serial === true) ||
      (OPTIONS.serial === null && capability === 'low')
    ) {
      generateInSeries()
        .then((result) => { resolve(result) })
        .catch((error) => { reject(error) })
    } else {
      generateInParallel()
        .then((result) => { resolve(result) })
        .catch((error) => { reject(error) })
    }
  })
}

/**
 * Compare two directories with images
 *
 * @param {Object} options - Configuration object
 * @param {String} options.dirBaseline - Directory where baseline images are stored
 * @param {String} options.dirNew - Directory where new images are stored
 * @returns {Promise} Returns an object with key `compare` designating which
 * files should be compared, and `missing` designating which baseline files are
 * missing, and `outdated` which are present in baseline, but not in new
 */
const compareImageDirectories = (options) => {
  const OPTIONS = {
    dirBaseline: null,
    dirNew: null,
    ...options
  }

  return new Promise((resolve, reject) => {
    // Error checks
    // ------------
    if (OPTIONS.dirBaseline === null) { reject(new Error('"dirBaseline" is not set')) }
    if (OPTIONS.dirNew === null) { reject(new Error('"dirNew" is not set')) }

    // Find pairs to compare
    // We are ignoring missing images, but will output missing files in an array
    getImageNames(OPTIONS.dirBaseline).then(filesBaseline => {
      getImageNames(OPTIONS.dirNew).then(filesNew => {
        const missing = []
        const compare = []
        const outdated = []

        // Create a list of files to compare (present in new and in baseline)
        filesNew.forEach(newFile => {
          filesBaseline.forEach(baselineFile => {
            if (newFile === baselineFile) {
              compare.push(newFile)
            }
          })
        })

        // Create a list of missing files (present in new, but not in baseline)
        filesNew.forEach(newFile => {
          if (!compare.some(fileToCompare => fileToCompare === newFile)) {
            missing.push(newFile)
          }
        })

        // Create a list of outdated files (present in baseline folder, but not in new)
        filesBaseline.forEach(baselineFile => {
          if (!filesNew.some(newFile => newFile === baselineFile)) {
            outdated.push(baselineFile)
          }
        })

        resolve({
          compare,
          missing,
          outdated,
        })
      })
        .catch(error => { reject(error) })
    })
      .catch(error => { reject(error) })
  })
}

/**
 * Asynchronously check if file has been generated
 *
 * @param {Object} options - Configuration object
 * @param {String} options.path - Path to file, including file name
 * @param {Number} [options.timeout=10000] - Milliseconds to wait for file to be generated
 * @param {Number} [options.interval=50] - Interval to check for generated file
 * @returns {Promise} Returns promise that resolves `true` if file was found, otherwise will throw an error
 *
 * @example
 * fileExists({ path: './temp/screenshot.jpg' })
 */
const fileExists = (options) => {
  const OPTIONS = {
    path: null,
    timeout: 10000,
    interval: 50,
    debug: null,
    ...options
  }

  return new Promise((resolve, reject) => {
    if (OPTIONS.path === null) { reject(new Error('File path is missing')) }

    let timer = 0

    const waitForFile = setInterval(() => {
      timer += OPTIONS.interval

      fs.stat(path.normalize(OPTIONS.path), function (err, stat) {
        if (err === null) {
          clearInterval(waitForFile)

          resolve(true)
        }
      })

      if (timer >= OPTIONS.timeout) {
        clearInterval(waitForFile)

        reject(new Error(`File ${OPTIONS.path} was not found for ${OPTIONS.timeout / 1000}s`))
      }
    })
  })
}

/**
 * Compare two images and checks if diff image has been generated
 *
 * @param {Object} options - Configuration object
 * @param {String} options.dirBaseline - Directory where baseline files are located
 * @param {String} options.dirNew - Directory where new files are located
 * @param {String} options.dirDiff - Directory where diff file will be saved
 * @param {String} options.diffImageName - Diff image name
 * @param {Boolean} [options.debug] - Show or hide debug messages
 * @returns {Promise} Returns object with these keys: `testedImageName`, `dirBaseline`, `dirNew`, `diffImagePath`, `width`, `height`, `imagesAreSame`, `diffCount`, `diffPercentage`
 */
const diffImages = (options) => {
  const OPTIONS = {
    dirBaseline: null,
    dirNew: null,
    dirDiff: null,
    imageName: null,
    diffImageName: null, // Diff files are always in PNG format
    debug: null,
    ...options
  }

  /**
   * Adds `temp` suffix to file name
   *
   * @param {String} regularName
   * @returns {String} File name with `temp` suffix
   */
  const tempFileName = (regularName) => {
    const diffName = regularName.split('.')

    diffName.splice(diffName.length - 1, 0, 'temp')

    return diffName.join('.')
  }

  return new Promise((resolve, reject) => {
    // Compare two images
    imgDiff({
      actualFilename: path.normalize(OPTIONS.dirBaseline + path.sep + OPTIONS.imageName),
      expectedFilename: path.normalize(OPTIONS.dirNew + path.sep + OPTIONS.imageName),
      diffFilename: path.normalize(OPTIONS.dirDiff + path.sep + tempFileName(OPTIONS.imageName)),
      options: {
        threshold: 0.1,
        includeAA: false,
      }
    })
      .then((imgDiffResult) => {
        // Wait for image to be generated before resolving.
        // Problem with this plugin is that it will generate images always, so we
        // need to delete them if both images used for comparison are same
        fileExists({ path: path.normalize(OPTIONS.dirDiff + path.sep + tempFileName(OPTIONS.imageName)) })
          .then(() => {
            if (imgDiffResult.imagesAreSame) {
              // Delete temp diff image
              fs.unlinkSync(path.normalize(OPTIONS.dirDiff + path.sep + tempFileName(OPTIONS.imageName)))

              resolve({
                testedImage: OPTIONS.imageName,
                dirBaseline: path.normalize(OPTIONS.dirBaseline),
                dirNew: path.normalize(OPTIONS.dirNew),
                diffImagePath: null,
                ...imgDiffResult,
              })
            } else {
              // Create composed image
              createDiffImage({
                pathBaseline: path.normalize(OPTIONS.dirBaseline + path.sep + OPTIONS.imageName),
                pathNew: path.normalize(OPTIONS.dirNew + path.sep + OPTIONS.imageName),
                pathDiff: path.normalize(OPTIONS.dirDiff + path.sep + tempFileName(OPTIONS.imageName)),
                pathDist: path.normalize(OPTIONS.dirDiff + path.sep + OPTIONS.diffImageName)
              })
                .then(() => {
                  // Delete temp diff image
                  fs.unlinkSync(path.normalize(OPTIONS.dirDiff + path.sep + tempFileName(OPTIONS.imageName)))

                  resolve({
                    testedImageName: OPTIONS.imageName,
                    dirBaseline: path.normalize(OPTIONS.dirBaseline),
                    dirNew: path.normalize(OPTIONS.dirNew),
                    diffImagePath: path.normalize(OPTIONS.dirDiff + path.sep + OPTIONS.diffImageName),
                    ...imgDiffResult,
                  })
                })
                .catch(error => { reject(error) })
            }
          })
          .catch(error => { reject(error) })
      })
      .catch(error => { reject(error) })
  })
}

/**
 * Compares images from two directories
 *
 * @param {Object} options - configuration object
 * @param {String} options.dirBaseline - Directory where baseline images are stored
 * @param {String} options.dirNew - Directory where new images are stored
 * @param {String} [options.dirDiff=./new/diff/] - Directory where generated diffs are stored
 * @param {Boolean} [options.debug] - Show or hide debug messages
 * @returns {Promise} Returns Array of objects for each compared image and generates diff images
 */
const compareImages = (options) => {
  const OPTIONS = {
    dirBaseline: null,
    dirNew: null,
    dirDiff: null,
    debug: null,
    ...options
  }

  /**
    * Rename file with `jpg` or `jpeg` extensions to `png` extension
    * @param {String} name
    * @returns {String} Returns filename with `png` extension
    */
  const pngExtension = name => name.replace(/(.jpg)$|(.jpeg)$/i, '.png')

  return new Promise((resolve, reject) => {
    compareImageDirectories({
      dirBaseline: OPTIONS.dirBaseline,
      dirNew: OPTIONS.dirNew,
    })
      .then((files) => {
        if (files.compare.length === 0) {
          resolve({
            passed: [],
            failed: [],
            missing: files.missing,
            outdated: files.outdated
          })
        }

        log(`Started to compare ${files.compare.length} screenshots`, OPTIONS.debug)

        // Start adding images to array of promises
        const imagesToCompare = [] // Array of promises

        files.compare.forEach(fileName => {
          // Set diff path where we will save new screenshots
          // If the path is not specified, new diff images will be saved into
          // a `diff` subfolder under `new` images
          const diffPath = OPTIONS.dirDiff !== null
            ? path.normalize(OPTIONS.dirDiff)
            : path.normalize(OPTIONS.dirNew + path.sep + '/diff/')

          // Add promise to array of promises
          imagesToCompare.push(
            diffImages({
              dirBaseline: OPTIONS.dirBaseline,
              dirNew: OPTIONS.dirNew,
              dirDiff: diffPath,
              imageName: fileName,
              diffImageName: pngExtension(fileName),
              debug: OPTIONS.debug,
            })
          )
        })

        // Start comparing images
        Promise.all(imagesToCompare)
          .then(results => {
            // Sort results
            let passed = []
            const failed = []

            results.forEach(result => {
              result.diffPercentage = (100 / (result.width * result.height)) * result.diffCount

              if (result.imagesAreSame) {
                passed.push(result)
              } else {
                failed.push(result)
              }
            })

            // Clean up results
            passed = passed.map(result => {
              delete result.diffPath
              delete result.diffImageName

              return result
            })

            resolve({
              passed,
              failed,
              missing: files.missing,
              outdated: files.outdated,
            })
          })
          .catch(error => { reject(error) })
      })
      .catch((error) => { reject(error) })
  })
}

/**
 * Create diff image from 3 image sources
 *
 * @param {Object} options - Configuration object
 * @param {String} options.pathBaseline - Path to baseline file
 * @param {String} options.pathNew - Path to new file
 * @param {String} options.pathDiff - Path to an existing diff image
 * @param {String} options.pathDist - Path where a final diff image will be saved
 * @returns {Promise} Returns promise with notification where the diff image has been saved. Also saves image.
 *
 * @example
 * createDiffImage({
 *  pathBaseline: './temp/baseline/screenshot.jpg',
 *  pathNew: './temp/new/screenshot.jpg',
 *  pathDiff: './temp/new/diff/screenshot.png'
 * })
 *  .then((result) => { console.log(result) })
 *  .catch((error) => { console.error(error) })
 */
const createDiffImage = (options = null) => {
  const OPTIONS = {
    pathBaseline: null,
    pathNew: null,
    pathDiff: null,
    pathDist: null,
    ...options
  }

  return new Promise((resolve, reject) => {
    // Error checks
    if (options === null) {
      reject(new Error('Cannot create diff image, missing configuration object `options`'))
    }

    if (isFalsy(OPTIONS.pathBaseline)) {
      reject(new Error('Cannot create diff image, missing option `pathBaseline`'))
    }

    if (isFalsy(OPTIONS.pathNew)) {
      reject(new Error('Cannot create diff image, missing option `pathNew`'))
    }

    if (isFalsy(OPTIONS.pathDiff)) {
      reject(new Error('Cannot create diff image, missing option `pathDiff`'))
    }

    if (isFalsy(OPTIONS.pathDist)) {
      reject(new Error('Cannot create diff image, missing option `pathDist`'))
    }

    // Check if files exist
    const imageBaseline = fileExists({ path: OPTIONS.pathBaseline })
    const imageNew = fileExists({ path: OPTIONS.pathNew })
    const imageDiff = fileExists({ path: OPTIONS.pathDiff })

    Promise.all([imageBaseline, imageNew, imageDiff])
      .then(() => {
        joinImages(
          [
            OPTIONS.pathBaseline,
            OPTIONS.pathDiff,
            OPTIONS.pathNew
          ],
          {
            direction: 'horizontal',
            offset: 10, // Space between images
            margin: '10 10 10 10', // Margins on the side
          }
        )
          .then((img) => {
            img.toFile(OPTIONS.pathDist)
            resolve(`Diff image ${OPTIONS.pathDist} has been created`)
          })
      })
      .catch(error => {
        reject(new Error(`Cannot create diff image, reason: \n\t${error}`))
      })
  })
}

module.exports = {
  generateImages,
  compareImages,
}
