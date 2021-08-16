# OLL Visual testing framework

This plugin is intended for the creation of screenshots and their comparison.

## Usage
Until this NPM package is published for the public, we can use it by including
it into `package.json` file directly.

```json
{
  "devDependencies": {
    "oll-visual-tester": "https://github.com/openlawlibrary/oll-visual-tester.git"
  }
}
```

Afterwards we can use it in out JS files like this:

```js
const { screenshot, generateImages, compareImages } = require('oll-visual-tester')
```

## Features

### Screenshot tool
Screenshot function is using Playwright to browse to required page, perform
clicks and then create screenshots from either full page or desired element.

Function accepts a configuration object, where we are setting how each
screenshot will be created.

To create screenshot, first import the function:

```js
const { screenshot } = require('oll-visual-tester')
```

Then prepare a configuration object which may look like this:

```js
const config = {
  goto: 'http://duckduckgo.com', // Web page that we are visiting
  engine: 'firefox', // Browser engine: 'firefox', 'chromium' or 'webkit'
  width: 800, // Page width
  height: 600, // Page height
  path: './temp/baseline/', // Directory where screenshot will be saved
  name: 'screenshot1.jpg', // Name of the screenshot (`png` or `jpg` format)
  fullPage: true, // Setting for full page screenshot
  clicks: [ // Array of clicks
    {
      selector: '.js-side-menu-open', // Selector to click on
      waitAfter: 300, // optional - Wait after click
      button: 'left', // optional - Button 'left' or 'right'
    },
  ],
  el: null, // Element CSS selector that we want to make screenshot of
  debug: true, // Display additional messages
}
```

Lastly start creating a screenshot:

```js
screenshot(config)
  .then(result => { console.log(result) })
  .catch(error => { console.error(error) })
```

### Generate multiple images tool
This tool is used to create multiple screenshots. Instead of passing one
configuration object, we are passing an array of objects.

```js
const { generateImages } = require('oll-visual-tester')

const configurationArray = [
  {
    goto: 'http://duckduckgo.com', // Web page that we are visiting
    engine: 'firefox', // Browser engine: 'firefox', 'chromium', 'webkit'
    width: 800, // Page width
    height: 600, // Page height
    path: './temp/baseline/', // Directory where screenshot will be saved
    name: 'screenshot1.jpg', // Name of the screenshot (`png` or `jpg`)
    fullPage: true, // Setting for full page screenshot
    clicks: [ // Array of clicks
      {
        selector: '.js-side-menu-open', // Selector to click on
        waitAfter: 300, // optional - Wait after click
        button: 'left', // optional - Button 'left' or 'right'
      },
    ],
    el: null, // Element CSS selector that we want to make screenshot of
    debug: true, // Displays additional messages
  },
    {
    goto: 'http://duckduckgo.com',
    engine: 'webkit',
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot2.jpg',
    fullPage: true,
    clicks: [],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
]

generateImages(configurationArray)
  .then(result => { console.log(result) })
  .catch(error => { console.error(error) })
```

### Compare images tool
This tool is used to compare images from two directories. When run, it will
find the files with the same name and will compare those files.

For files where there is a difference, a new PNG image will be created. It will
contain a baseline image, diff image and a new image, positioned side by side.

```js
const { compareImages } = require('oll-visual-tester')

compareImages({
  dirBaseline: './temp/baseline/', // Baseline directory
  dirNew: './temp/new/', // Directory where new images are stored
  dirDiff: './temp/diff/', // Optional - directory where diff images will be stored
  debug: true // Displays additional messages
})
  .then((result) => { console.log(result) })
  .catch((error) => { console.error(error) })
```

As a result, we will an get an object with 4 arrays:
- `passed` - Images that passed the test
- `failed` - Images that failed the test
- `missing` - Images that are missing in baseline directory, but are present in new.
- `outdated` - Images that are missing in new directory, but are present in baseline.

```bash
[18:46:09] Started to compare 2 screenshots
createDiffResult Diff image temp\diff\screenshot2.temp.png has been created
{
  passed: [
    {
      testedImage: 'screenshot1.jpg',
      dirBaseline: 'temp\\baseline\\',
      dirNew: 'temp\\new\\',
      diffImagePath: null,
      width: 800,
      height: 3665,
      imagesAreSame: true,
      diffCount: 0,
      diffPercentage: 0
    }
  ],
  failed: [
    {
      testedImageName: 'screenshot2.jpg',
      dirBaseline: 'temp\\baseline\\',
      dirNew: 'temp\\new\\',
      diffImagePath: 'temp\\diff\\screenshot2.png',
      width: 800,
      height: 3665,
      imagesAreSame: false,
      diffCount: 207717,
      diffPercentage: 7.084481582537518
    }
  ],
  missing: [ 'screenshot-new.png' ],
  outdated: [ 'screenshot-old.png' ]
}
```

Diff image may look like this:

![Diff](./static/diff-screenshot.png)
