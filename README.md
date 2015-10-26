# postcss-image-set [![Build Status](https://travis-ci.org/alex499/postcss-image-set.svg)](https://travis-ci.org/alex499/postcss-image-set)

[PostCSS] plugin for fallback image-set.

[PostCSS]: https://github.com/postcss/postcss

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
    background-image: image-set(url(img/test.png) 1x,
                                url(img/test-2x.png) 2x,
                                url(my-img-print.png) 600dpi);
}

/* polyfill behaviour */
@media (screen and min-resolution: 2dppx) {
    background-image: url(img/test-2x.png);
    /* let browser that support image-set choose themselves */
    background-image: image-set(url(img/test.png) 1x,
                                url(img/test-2x.png) 2x,
                                url(my-img-print.png) 600dpi);
}

@media (screen and min-resolution: 600pdi) {
    background-image: url(my-img-print.png);
    /* let browser that support image-set choose themselves */
    background-image: image-set(url(img/test.png) 1x,
                                url(img/test-2x.png) 2x,
                                url(my-img-print.png) 600dpi);
}
```

## Usage

```js
postcss([ require('postcss-image-set') ])
```

See [PostCSS] docs for examples for your environment.
