'use strict';

const expect  = require('chai').expect;

const postcss = require('postcss');
const imageSet = require('../');

const test = function(input, output, done) {
    expect(postcss(imageSet).process(input).css.replace(/[ \n]/g, ''))
        .to.eql(output.replace(/[ \n]/g, ''));

    done();
};

describe('postcss-image-set-polyfill', function() {
    it('don\'t break simple background-image property' , function(done) {
        const input =
            `a {
                background-image: url("img/test.png");
            }`;

        test(input, input, done);
    });

    it('don\'t break simple background property' , function(done) {
        const input =
            `a {
                background: url(my-img-print.png) top left no-repeat red;
            }`;

        test(input, input, done);
    });

    it('parses the image-set', function(done) {
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
            @media (min-resolution: 192dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (min-resolution: 600dpi) {
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        test(input, output, done);
    });

    it('parses the image-set with only 1x', function(done) {
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

        test(input, output, done);
    });

    it('parses the image-set with only 2x', function(done) {
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

        test(input, output, done);
    });

    it('parses dppx unit', function(done) {
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
            @media (min-resolution: 192dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }`;

        test(input, output, done);
    });

    it('parses dpcm unit', function(done) {
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
            @media (min-resolution: 50dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }`;

        test(input, output, done);
    });

    it('throws exeption with unknown units', function(done) {
        const input =
            `a{
                background-image: image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 2wtfunit
                );
            }`;


        expect(() => postcss(imageSet).process(input).css)
            .to.throw();

        done();
    });


    it('generate styles in correct order', function(done) {
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
            @media (min-resolution: 192dpi) {
                a {
                    background: url(../images/bck@2x.png);
                }
            }
            @media (min-resolution: 288dpi) {
                a {
                    background: url(../images/bck@3x.png);
                }
            }`;

        test(input, output, done);
    });

    it('parses the image-set without url', function(done) {
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
            @media (min-resolution: 192dpi) {
                a {
                    background-image: url("img/test-2x.png");
                }
            }
            @media (min-resolution: 600dpi) {
                a {
                    background-image: url("my-img-print.png");
                }
            }`;

        test(input, output, done);
    });

    it('parses the -webkit-image-set', function(done) {
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
            @media (min-resolution: 192dpi){
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (min-resolution: 600dpi){
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        test(input, output, done);
    });

    it('parses the image-set in media query', function(done) {
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
            @media (min-width: 1000px) and (min-resolution: 192dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (min-width: 1000px) and (min-resolution: 600dpi) {
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        test(input, output, done);
    });

    it('parses the image-set in background property', function(done) {
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
            @media (min-resolution: 192dpi) {
                a {
                    background: url(img/test-2x.png) top left no-repeat red;
                }
            }
            @media (min-resolution: 600dpi) {
                a {
                    background: url(my-img-print.png) top left no-repeat red;
                }
            }`;

        test(input, output, done);
    });

    it('parses multiple values in background property', function(done) {
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
            @media (min-resolution: 192dpi) {
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

        test(input, output, done);
    });

    it('parses densities between 1x and 2x', function(done) {
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
            @media (min-resolution: 124dpi) {
                a {
                    background-image: url(img/test-1.3x.png);
                }
            }
            @media (min-resolution: 144dpi) {
                a {
                    background-image: url(img/test-1.5x.png);
                }
            }`;

        test(input, output, done);
    });
});
