const path = require('path')
const fse = require('fs-extra')
const chalk = require('chalk')
const { firefox, chromium, webkit } = require('playwright')
const { log } = require('./helpers')

/**
 * Return one of 3 supported browser engines. Function is used internally in
 * `screenshot()` function.
 *
 * @param {String} engine - Accepts `chromium`, `webkit` or defaults to `firefox`
 * @returns {Promise} Initialized browser
 */

const browserEngine = (engine) => {
  return new Promise((resolve, reject) => {
    switch (engine) {
      case 'chromium':
        resolve(chromium.launch())
        break
      case 'webkit':
        resolve(webkit.launch())
        break
      case 'firefox':
      default:
        resolve(firefox.launch())
        break
    }
  })
}

/**
 * Returns supported file types based on file name
 *
 * @param {String} name - file name with extension
 * @returns {String} Returns `jpg`, `png` or `null`
 */
const imageType = (name) => {
  const jpg = /(.jpg)$|(.jpeg)$/gi
  const png = /(.png)$/gi

  if (name.toLowerCase().match(jpg)) { return 'jpg' }
  if (name.toLowerCase().match(png)) { return 'png' }

  return null
}

/**
 * Screenshot function which uses Playwright to browse to required page, perform
 * clicks and create screenshots from either full page or desired element
 *
 * @param {Object} options - Object which accepts parameters required to
 * create a screenshot.
 * @param {String} options.goto - URL for the page where screenshot will be performed
 * @param {Number} options.width - Browser window width
 * @param {Number} options.height - Browser window height
 * @param {String} options.path - (optional) Directory where screenshot should be saved.
 * @param {String} options.name - (optional) File name with `.png` or `.jpg` extension
 * @param {Boolean} options.fullPage - Sets if we are creating full page screenshot
 * @param {Array} options.clicks - Array of objects where clicks are performed. See `performClicks()`
 * @param {String} options.el - selector of an element whose screenshot should
 * be taken. If left empty, regular page screenshot should be performed
 * @param {Boolean} options.debug - If `true`, outputs additional messages
 *
 * @return {Promise} object - with `msg` and `binary` values
 */
const screenshot = async (options) => {
  const OPTIONS = {
    goto: 'http://localhost',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: null,
    name: null,
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: false,
    ...options
  }

  // Messages
  const MESSAGE = {
    start: `Generating screenshot ${chalk.magenta(OPTIONS.name)} in ${chalk.green(OPTIONS.engine)} browser`,
    created: `Saved to: ${chalk.blue(path.normalize(OPTIONS.path + path.sep + OPTIONS.name))}`,
    createdClean: `Saved to: ${path.normalize(OPTIONS.path + path.sep + OPTIONS.name)}`,
    click (element) {
      return `${element.button || 'left'} click on ` +
        chalk.cyan(element.selector) +
        (
          'waitAfter' in element
            ? chalk.magenta(` [wait ${element.waitAfter}ms]`)
            : ''
        )
    },
  }

  const browser = await browserEngine(OPTIONS.engine)

  log(MESSAGE.start, OPTIONS.debug)

  const page = await browser.newPage()

  // Set up the page dimensions
  await page.setViewportSize({
    width: OPTIONS.width,
    height: OPTIONS.height,
  })

  await page.goto(OPTIONS.goto, { waitUntil: 'networkidle' })

  // Perform clicks
  if (OPTIONS.clicks.length > 0) {
    let currentClick = 0

    const pageClicks = async () => {
      log(MESSAGE.click(OPTIONS.clicks[currentClick]), OPTIONS.debug)

      await page.click(
        OPTIONS.clicks[currentClick].selector,
        { button: OPTIONS.clicks[currentClick].button || 'left' }
      )

      if (
        'waitAfter' in OPTIONS.clicks[currentClick] &&
        OPTIONS.clicks[currentClick].waitAfter > 0
      ) {
        await page.waitForTimeout(OPTIONS.clicks[currentClick].waitAfter)
      }

      currentClick++

      if (currentClick < OPTIONS.clicks.length) { await pageClicks() }

      return page
    }

    await pageClicks()

    // If we have decided to save screenshot, ensure that the
    // requested path exists or make it instead
    if (OPTIONS.path) { fse.ensureDir(path.normalize(OPTIONS.path)) }
  }

  return new Promise((resolve, reject) => {
    if (OPTIONS.el === null) {
      page.screenshot(
        OPTIONS.path !== null
          ? {
              path: OPTIONS.path + path.sep + OPTIONS.name,
              fullPage: OPTIONS.fullPage
            }
          : { fullPage: OPTIONS.fullPage }
      )
        .then((image) => {
          browser.close()

          if (OPTIONS.path) {
            log(MESSAGE.created, OPTIONS.debug)

            resolve({
              msg: MESSAGE.createdClean,
              name: OPTIONS.name,
              path: OPTIONS.path,
              el: OPTIONS.el,
              binary: image
            })
          } else {
            resolve({
              msg: MESSAGE.createdClean,
              name: OPTIONS.name,
              path: OPTIONS.path,
              el: OPTIONS.el,
              binary: image
            })
          }
        })
        .catch(error => reject(error))
    } else {
      // Create element screenshot
      page.waitForSelector(OPTIONS.el)
        .then((element) => {
          element.screenshot(
            OPTIONS.path !== null
              ? {
                  path: OPTIONS.path + path.sep + OPTIONS.name,
                  fullPage: OPTIONS.fullPage
                }
              : { fullPage: OPTIONS.fullPage }
          )
            .then((image) => {
              browser.close()

              if (OPTIONS.path) {
                log(MESSAGE.created, OPTIONS.debug)

                resolve({
                  msg: MESSAGE.createdClean,
                  name: OPTIONS.name,
                  path: OPTIONS.path,
                  el: OPTIONS.el,
                  binary: image
                })
              } else {
                resolve({
                  msg: MESSAGE.createdClean,
                  name: OPTIONS.name,
                  path: OPTIONS.path,
                  el: OPTIONS.el,
                  binary: image
                })
              }
            })
            .catch(error => { reject(error) })
        })
        .catch(error => { reject(error) })
    }
  })
}

/**
 * Performs clicks on an initialized page. This function is used within the
 * `screenshotPromise()` function.
 *
 * @param {Object} page - Initialized browser page
 * @param {Array} clicks - Array of objects with information about clicks
 * @param {String} clicks[].selector - CSS selector where to perform click
 * @param {Number} clicks[].waitAfter - Number of milliseconds to wait after the click
 * @param {String} clicks[].button - Mouse button to click: `left`, `middle` or `right`
 * @param {Boolean} debug - Display log if debug is turned on
 * @returns {Object} Returns promise with page where clicks were performed
 */
const _performClicks = (page, clicks, debug = false) => {
  return new Promise((resolve, reject) => {
    // Error checks
    if (typeof page === 'undefined') {
      reject(new Error('Cannot perform clicks if browser page is not initialized'))
    }

    // We don't need to click on a page, in that case we can just return it
    if (clicks.length === 0) { resolve(page) }

    // Otherwise, perform clicks
    let currentClick = 0

    const performClick = () => {
      log(
        `${clicks[currentClick].button || 'left'} click on ` + chalk.cyan(clicks[currentClick].selector) +
        (
          'waitAfter' in clicks[currentClick]
            ? chalk.magenta(` [wait ${clicks[currentClick].waitAfter}ms]`)
            : ''
        ),
        debug
      )

      page.click(
        clicks[currentClick].selector,
        { button: clicks[currentClick].button || 'left' }
      )
        .then(() => {
          if (
            'waitAfter' in clicks[currentClick] &&
            clicks[currentClick].waitAfter > 0
          ) {
            page.waitForTimeout(clicks[currentClick].waitAfter)
              .then(() => {
                currentClick++

                if (currentClick === clicks.length) { resolve(page) } else { performClick() }
              })
              .catch(error => { reject(error) })
          } else {
            currentClick++

            if (currentClick === clicks.length) { resolve(page) } else { performClick() }
          }
        })
        .catch(error => { reject(error) })
    }

    performClick()
  })
}

/**
 * Screenshot function which uses Playwright to browse to required page, perform
 * clicks and create screenshots from either full page or desired element.
 *
 * @param {Object} options - Object which accepts parameters required to
 * create a screenshot.
 * @param {String} options.goto - URL for the page where screenshot will be performed
 * @param {Number} options.width - Browser window width
 * @param {Number} options.height - Browser window height
 * @param {String} options.path - (optional) Directory where screenshot should be saved.
 * @param {String} options.name - (optional) File name with `.png` or `.jpg` extension
 * @param {Boolean} options.fullPage - Sets if we are creating full page screenshot
 * @param {Array} options.clicks - Array of objects where clicks are performed. See `_performClicks()`
 * @param {String} options.el - selector of an element whose screenshot should
 * be taken. If left empty, regular page screenshot should be performed
 * @param {Boolean} options.debug - If `true`, outputs additional messages
 *
 * @return {Promise} object - with `msg` and `binary` values
 */
// NOTE: This is the same function as `screenshot()` but with different internal
// code. It will be either updated or removed when this feature is complete
const screenshotPromise = (options) => {
  const OPTIONS = {
    goto: 'http://localhost',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: null,
    name: 'screenshot.png',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: false,
    ...options
  }

  // Messages
  const MESSAGE = {
    start: `Generating screenshot ${chalk.magenta(OPTIONS.name)} in ${chalk.green(OPTIONS.engine)} browser`,
    created: `Saved to: ${chalk.blue(path.normalize(OPTIONS.path + path.sep + OPTIONS.name))}`,
  }

  return new Promise((resolve, reject) => {
    browserEngine(OPTIONS.engine)
      .then((browser) => {
        log(MESSAGE.start, OPTIONS.debug)
        browser.newPage()
          .then((page) => {
            // Set up the page dimensions
            page.setViewportSize({
              width: OPTIONS.width,
              height: OPTIONS.height,
            })
              .then(() => {
                page.goto(OPTIONS.goto, { waitUntil: 'networkidle' })
                  .then(() => {
                    _performClicks(page, OPTIONS.clicks, OPTIONS.debug)
                      .then(() => {
                        if (OPTIONS.path) { fse.ensureDir(path.normalize(OPTIONS.path)) }

                        if (OPTIONS.el === null) {
                          // Create page screenshot
                          page.screenshot(
                            OPTIONS.path !== null
                              ? {
                                  path: OPTIONS.path + path.sep + OPTIONS.name,
                                  fullPage: OPTIONS.fullPage
                                }
                              : { fullPage: OPTIONS.fullPage }
                          )
                            .then((image) => {
                              browser.close()

                              if (OPTIONS.path) {
                                log(MESSAGE.created, OPTIONS.debug)

                                resolve({
                                  msg: MESSAGE.created,
                                  name: OPTIONS.name,
                                  path: OPTIONS.path,
                                  el: OPTIONS.el,
                                  binary: image
                                })
                              } else {
                                resolve({
                                  msg: MESSAGE.created,
                                  name: OPTIONS.name,
                                  path: OPTIONS.path,
                                  el: OPTIONS.el,
                                  binary: image
                                })
                              }
                            })
                            .catch(error => reject(error))
                        } else {
                          // Create element screenshot
                          page.waitForSelector(OPTIONS.el)
                            .then((element) => {
                              element.screenshot(
                                OPTIONS.path !== null
                                  ? {
                                      path: OPTIONS.path + path.sep + OPTIONS.name,
                                      fullPage: OPTIONS.fullPage
                                    }
                                  : { fullPage: OPTIONS.fullPage }
                              )
                                .then((image) => {
                                  browser.close()

                                  if (OPTIONS.path) {
                                    log(MESSAGE.created, OPTIONS.debug)

                                    resolve({
                                      msg: MESSAGE.created,
                                      name: OPTIONS.name,
                                      path: OPTIONS.path,
                                      el: OPTIONS.el,
                                      binary: image
                                    })
                                      .catch((error) => { reject(error) })
                                  } else {
                                    resolve({
                                      msg: MESSAGE.created,
                                      name: OPTIONS.name,
                                      path: OPTIONS.path,
                                      el: OPTIONS.el,
                                      binary: image
                                    })
                                  }
                                })
                                .catch(error => { reject(error) })
                            })
                            .catch(error => { reject(error) })
                        }
                      })
                      .catch(error => { reject(error) })
                  })
                  .catch(error => { reject(error) })
              })
              .catch(error => { reject(error) })
          })
          .catch(error => { reject(error) })
      })
      .catch(error => { reject(error) })
  })
}

module.exports = {
  screenshot
}
