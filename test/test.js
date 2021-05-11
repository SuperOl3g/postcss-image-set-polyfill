'use strict';

const expect  = require('chai').expect;

const postcss = require('postcss');
const imageSet = require('../');

const test = async function(input, output) {
    const result = await postcss([imageSet]).process(input, {from: undefined});

    expect(result.css.replace(/[ \n]/g, ''))
        .to.eql(output.replace(/[ \n]/g, ''));
};

describe('postcss-image-set-polyfill', () => {
    it('don\'t break simple background-image property', async () => {
        const input =
            `a {
                background-image: url("img/test.png");
            }`;

        return test(input, input);
    });

    it('don\'t break simple background property', async () => {
        const input =
            `a {
                background: url(my-img-print.png) top left no-repeat red;
            }`;

        return test(input, input);
    });

    it('parses the image-set', async () => {
        const input =
            `a{
                background-image: image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 2x,
                    url(my-img-print.png) 600dpi
                );
            }`;
        const output =
            `a {
                background-image: url(img/test.png);
            }
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (-webkit-min-device-pixel-ratio: 6.25), (min-resolution: 600dpi) {
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        return test(input, output);
    });

    it('parses the image-set with only 1x', async () => {
        const input =
            `a{
                background-image: image-set(
                    url(img/test.png) 1x
                );
            }`;
        const output =
            `a {
                background-image: url(img/test.png);
            }`;

        return test(input, output);
    });

    it('parses the image-set with only 2x', async () => {
        const input =
            `a{
                background-image: image-set(
                    url(img/test.png) 2x
                );
            }`;
        const output =
            `a {
                background-image: url(img/test.png);
            }`;

        return test(input, output);
    });

    it('parses dppx unit', async () => {
        const input =
            `a{
                background-image: image-set(
                    url(img/test.png) 1x, 
                    url(img/test-2x.png) 2dppx
                );
            }`;
        const output =
            `a {
                background-image: url(img/test.png);
            }
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }`;

        return test(input, output);
    });

    it('parses dpcm unit', async () => {
        const input =
            `a{
                background-image: image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 20dpcm
                );
            }`;
        const output =
            `a {
                background-image: url(img/test.png);
            }
            @media (-webkit-min-device-pixel-ratio: 0.52), (min-resolution: 50dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }`;

        return test(input, output);
    });

    it('throws exeption with unknown units', done => {
        const input =
            `a{
                background-image: image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 2wtfunit
                );
            }`;


        expect(() => postcss(imageSet).process(input).css)
            .to.throw(/Incorrect size value/);

        done();
    });


    it('generate styles in correct order', async () => {
        const input =
            `a {
                background: image-set(
                    url(../images/bck@3x.png) 3x,
                    url(../images/bck.png) 1x,
                    url(../images/bck@2x.png) 2x
                );
            }`;
        const output =
            `a {
                background: url(../images/bck.png);
            }
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                a {
                    background: url(../images/bck@2x.png);
                }
            }
            @media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
                a {
                    background: url(../images/bck@3x.png);
                }
            }`;

        return test(input, output);
    });

    it('parses the image-set without url', async () => {
        const input =
            `a {
                background-image: image-set(
                    "img/test.png" 1x,
                    "img/test-2x.png" 2x,
                    "my-img-print.png" 600dpi
                );
            }`;

        const output =
            `a {
                background-image: url("img/test.png");
            }
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                a {
                    background-image: url("img/test-2x.png");
                }
            }
            @media (-webkit-min-device-pixel-ratio: 6.25), (min-resolution: 600dpi) {
                a {
                    background-image: url("my-img-print.png");
                }
            }`;

        return test(input, output);
    });

    it('parses the -webkit-image-set', async () => {
        const input =
            `a {
                background-image: -webkit-image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 2x,
                    url(my-img-print.png) 600dpi
                );
            }`;
        const output =
            `a {
                background-image: url(img/test.png);
            }
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi){
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (-webkit-min-device-pixel-ratio: 6.25), (min-resolution: 600dpi){
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        return test(input, output);
    });

    it('parses the image-set in media query', async () => {
        const input =
            `@media (min-width: 1000px) {
                a {
                    background-image: image-set(
                        url(img/test.png) 1x,
                        url(img/test-2x.png) 2x,
                        url(my-img-print.png) 600dpi
                    );
                }
            }`;

        const output =
            `@media (min-width: 1000px) {
                a {
                    background-image: url(img/test.png);
                }
            }
            @media (min-width: 1000px) and (-webkit-min-device-pixel-ratio: 2), 
                (min-width: 1000px) and (min-resolution: 192dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (min-width: 1000px) and (-webkit-min-device-pixel-ratio: 6.25),
                (min-width: 1000px) and (min-resolution: 600dpi) {
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        return test(input, output);
    });

    it('parses the image-set in media query with "AND"', async () => {
        const input =
            `@media (min-width: 768px) and (max-width: 1024px) {
                a {
                    background-image: image-set(
                        url(img/test.png) 1x,
                        url(img/test-2x.png) 2x,
                        url(my-img-print.png) 600dpi
                    );
                }
            }`;

        const output =
            `@media (min-width: 768px) and (max-width: 1024px) {
                a {
                    background-image: url(img/test.png);
                }
            }
            @media (min-width: 768px) and (max-width: 1024px) and (-webkit-min-device-pixel-ratio: 2),
                (min-width: 768px) and (max-width: 1024px) and (min-resolution: 192dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (min-width: 768px) and (max-width: 1024px) and (-webkit-min-device-pixel-ratio: 6.25),
                (min-width: 768px) and (max-width: 1024px) and (min-resolution: 600dpi) {
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        return test(input, output);
    });

    it('parses the image-set in media query with "OR"', async () => {
        const input =
            `@media (min-width: 768px), (max-width: 1024px) {
                a {
                    background-image: image-set(
                        url(img/test.png) 1x,
                        url(img/test-2x.png) 2x,
                        url(my-img-print.png) 600dpi
                    );
                }
            }`;

        const output =
            `@media (min-width: 768px), (max-width: 1024px) {
                a {
                    background-image: url(img/test.png);
                }
            }
            @media (min-width: 768px) and (-webkit-min-device-pixel-ratio: 2),
                (min-width: 768px) and (min-resolution: 192dpi),
                (max-width: 1024px) and (-webkit-min-device-pixel-ratio: 2),
                (max-width: 1024px) and (min-resolution: 192dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (min-width: 768px) and (-webkit-min-device-pixel-ratio: 6.25),
                (min-width: 768px) and (min-resolution: 600dpi),
                (max-width: 1024px) and (-webkit-min-device-pixel-ratio: 6.25),
                (max-width: 1024px) and (min-resolution: 600dpi) {
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        return test(input, output);
    });


    it('parses the image-set in background property', async () => {
        const input =
            `a{
                background: image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 2x,
                    url(my-img-print.png) 600dpi
                ) top left no-repeat red;
            }`;
        const output =
            `a {
                background: url(img/test.png) top left no-repeat red;
            }
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                a {
                    background: url(img/test-2x.png) top left no-repeat red;
                }
            }
            @media (-webkit-min-device-pixel-ratio: 6.25), (min-resolution: 600dpi) {
                a {
                    background: url(my-img-print.png) top left no-repeat red;
                }
            }`;

        return test(input, output);
    });

    it('parses multiple values in background property', async () => {
        const input =
            `a {
                background:
                    image-set(
                        url(../images/overlay.png)    1x,
                        url(../images/overlay@2x.png) 2x
                    ) no-repeat center,
                    image-set(
                        url(../images/bck.png)    1x,
                        url(../images/bck@2x.png) 2x
                    ) no-repeat top,
                    linear-gradient(
                        rgba(255, 0, 0, 0.5),
                        rgba(255, 0, 0, 0.5)
                    );
            }`;

        const output =
            `a {
                background:
                    url(../images/overlay.png) no-repeat center,
                    url(../images/bck.png) no-repeat top,
                    linear-gradient(
                        rgba(255, 0, 0, 0.5),
                        rgba(255, 0, 0, 0.5)
                    );
            }
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                a {
                    background:
                        url(../images/overlay@2x.png) no-repeat center,
                        url(../images/bck@2x.png) no-repeat top,
                        linear-gradient(
                            rgba(255, 0, 0, 0.5),
                            rgba(255, 0, 0, 0.5)
                        );
                }
            }`;

        return test(input, output);
    });

    it('parses densities between 1x and 2x', async () => {
        const input =
            `a{
                background-image: image-set(
                    url(img/test.png) 1x, 
                    url(img/test-1.3x.png) 1.3x, 
                    url(img/test-1.5x.png) 1.5x 
                );
            }`;
        const output =
            `a {
                background-image: url(img/test.png);
            }
            @media (-webkit-min-device-pixel-ratio: 1.3), (min-resolution: 124dpi) {
                a {
                    background-image: url(img/test-1.3x.png);
                }
            }
            @media (-webkit-min-device-pixel-ratio: 1.5), (min-resolution: 144dpi) {
                a {
                    background-image: url(img/test-1.5x.png);
                }
            }`;

        return test(input, output);
    });

    it('parses multiple brackets constructions', async () => {
        const input =
            `.foo {
                background: image-set(url('../img/cancel@x1.png') 1x,
                                      url('../img/cancel@x2.png') 2x,
                                      url('../img/cancel@x3.png') 3x)
                            no-repeat calc(100% - 5px) 50% / 32px;
            }`;

        const output =
            `.foo {
               background: url('../img/cancel@x1.png') no-repeat calc(100% - 5px) 50% / 32px;
            }
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                .foo {
                    background: url('../img/cancel@x2.png') no-repeat calc(100% - 5px) 50% / 32px;
                }
            }
            @media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
                .foo {
                    background: url('../img/cancel@x3.png') no-repeat calc(100% - 5px) 50% / 32px;
                }
            }`;

        return test(input, output);
    });


});
