# Third-party code in this folder

`qrcode.js` is `dist/qrcode.js` from the npm package **qrcode-generator 2.0.4** by Kazuhiko Arase (https://github.com/kazuhikoarase/qrcode-generator), copied unchanged.
Licence: MIT, as stated in the file header ("Licensed under the MIT license"; the npm package ships no separate licence file). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
We checked the file contains no network calls, `eval` or dynamic code loading. It is used only by `web/app/ward.js` to draw the QR code for a ward page, in the browser.
Retrieved 2026-11-10 from registry.npmjs.org (56,694 bytes).
