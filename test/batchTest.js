const { generateImages } = require('../src/index')

const config = [
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
  {
    goto: 'http://duckduckgo.com',
    engine: 'firefox', // 'firefox', 'chromium', 'webkit'
    width: 800,
    height: 600,
    path: './temp/baseline/',
    name: 'screenshot1.jpg',
    fullPage: true,
    clicks: [
      // {
      //  selector: '.js-side-menu-open',
      //  waitAfter: 300, // optional
      //  button: 'left', // optional
      // },
    ],
    el: null, // Element selector we want to make screenshot of
    debug: true,
  },
]

config.map(c => {
  c.name = `scr${Math.floor(Math.random() * 10000)}.jpg`
  return c
})

generateImages({
  imagesConfig: config,
  serial: false,
  debug: true
})
  .then(results => { console.log(results) })
  .catch(error => { console.error(error) })
