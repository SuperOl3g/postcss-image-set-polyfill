const Benchmark = require('benchmark');
const postcss = require('postcss');
const imageSet = require('./');


const suite = new Benchmark.Suite;

const input =
    `a{  
        background-image: image-set(  
            url(img/test.png) 1x,   
            url(img/test-2x.png) 2x,   
            url(my-img-print.png) 600dpi   
        );  
    }`;

suite
    .add('Process CSS', () => {
        postcss(imageSet).process(input).css;
    })
    .on('cycle', event => {
        console.log(String(event.target));
    })
    .run({ 'async': true });