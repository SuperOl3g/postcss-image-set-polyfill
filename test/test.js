/* eslint-disable space-infix-ops */
var expect  = require('chai').expect;

var postcss = require('postcss');
var imageSet = require('../');

var test = (input, output, opts, done) => {
    expect(postcss(imageSet).process(input).css.replace(/[ \n]/g, ''))
        .to.eql(output.replace(/[ \n]/g, ''));

    done();
};

describe('postcss-image-set-polyfill', () => {
    it('parses the image-set', done => {
        let input =
            `a{
                background-image: image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 2x,
                    url(my-img-print.png) 600dpi
                );
            }`;
        let output =
            `a {
                background-image: url(img/test.png);
            }
            @media (min-resolution: 144dpi) {
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (min-resolution: 600dpi) {
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        test(input, output, {}, done);
    });

    it('parses the image-set without url', done => {
        let input =
            `a {
                background-image: image-set(
                    "img/test.png" 1x,
                    "img/test-2x.png" 2x,
                    "my-img-print.png" 600dpi
                );
            }`;

        let output =
            `a {
                background-image: url("img/test.png");
            }

            @media (min-resolution: 144dpi) {
                a {
                    background-image: url("img/test-2x.png");
                }
            }

            @media (min-resolution: 600dpi) {
                a {
                    background-image: url("my-img-print.png");
                }
            }`;

        test(input, output, {}, done);
    });

    it('parses the -webkit-image-set', done => {
        let input =
            `a {
                background-image: -webkit-image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 2x,
                    url(my-img-print.png) 600dpi
                );
            }`;
        let output =
            `a {
                background-image: url(img/test.png);
            }
            @media (min-resolution: 144dpi){
                a {
                    background-image: url(img/test-2x.png);
                }
            }
            @media (min-resolution: 600dpi){
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        test(input, output, {}, done);
    });

    it('parses the image-set in media query', done => {
        let input =
            `@media (min-width: 1000px) { 
                a {
                    background-image: image-set(
                        url(img/test.png) 1x,
                        url(img/test-2x.png) 2x,
                        url(my-img-print.png) 600dpi
                    );
                }
            }`;

        let output =
            `@media (min-width: 1000px) { 
                a {
                    background-image: url(img/test.png);
                }
            } 
            @media (min-width: 1000px) and (min-resolution: 144dpi) { 
                a {
                    background-image: url(img/test-2x.png);
                }
            } 
            @media (min-width: 1000px) and (min-resolution: 600dpi) { 
                a {
                    background-image: url(my-img-print.png);
                }
            }`;

        test(input, output, {}, done);
    });

    it('parses the image-set in background property', done => {
        let input =
            `a{
                background: image-set(
                    url(img/test.png) 1x,
                    url(img/test-2x.png) 2x,
                    url(my-img-print.png) 600dpi
                ) top left no-repeat red;
            }`;
        let output =
            `a {
                background: url(img/test.png) top left no-repeat red;
            }
            @media (min-resolution: 144dpi) {
                a {
                    background: url(img/test-2x.png) top left no-repeat red;
                }
            }
            @media (min-resolution: 600dpi) {
                a {
                    background: url(my-img-print.png) top left no-repeat red;
                }
            }`;

        test(input, output, {}, done);
    });
});
