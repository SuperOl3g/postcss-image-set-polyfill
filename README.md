# postcss-image-set-polyfill [![Build Status](https://travis-ci.org/alex499/postcss-image-set.svg)](https://travis-ci.org/alex499/postcss-image-set)

[PostCSS] plugin for fallback [image-set] property.

[PostCSS]: https://github.com/postcss/postcss
[image-set]: http://caniuse.com/#feat=css-image-set

```css
/* Input example */
.foo {
    background-image: image-set(url(img/test.png) 1x,
                                url(img/test-2x.png) 2x,
                                url(my-img-print.png) 600dpi);
}
```

```css
/* Output example */
.foo {
    background-image: url(img/test.png);
}

@media (screen and min-resolution: 2dppx) {
    .foo {
        background-image: url(img/test-2x.png);
    }
}

@media (screen and min-resolution: 600pdi) {
    .foo{
        background-image: url(my-img-print.png);
    }
}
```
## Installation

`npm i postcss-image-set-polyfill -D`

## Usage

```js
var postcssImageSet = require('postcss-image-set-polyfill');

postcss([postcssImageSet]).process(YOUR_CSS, /* options */);;
```

See [PostCSS] docs for examples for your environment.
