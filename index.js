'use strict';

const postcss = require('postcss');
const valueParser = require('postcss-value-parser');

const DPI_RATIO = {
    x: 96,
    dppx: 96,
    dpcm: 2.54,
    dpi: 1
};

const IMAGE_SET_FUNC_REGEX = /(^|[^\w-])(-webkit-)?image-set\([\W\w]*\)/

// convert all sizes to dpi for sorting
const convertSize = (size, decl) => {
    if (!size) {
        return DPI_RATIO.x;
    }

    const m = size.match(/^([0-9|\.]+)(.*?)$/);

    if (m && DPI_RATIO[m[2]]) {
        const dpi = m[1] * DPI_RATIO[m[2]];

        return {
            dpi: Math.floor(dpi),
            pxRatio: Math.floor(dpi / DPI_RATIO.x * 100) / 100
        };
    }

    throw decl.error('Incorrect size value', { word: m && m[2] });
};

const stringify = chunk => valueParser.stringify(chunk);

const parseValue = (value, decl) => {
    const valueChunks = valueParser(value).nodes;

    const imageSetChunks = valueChunks.shift().nodes;

    const sizes = imageSetChunks
        .filter(chunk => chunk.type === 'word')
        .map(chunk => convertSize(stringify(chunk), decl));

    const urls = imageSetChunks
        .filter(chunk => chunk.type === 'function' || chunk.type === 'string')
        .map(chunk => {
            const str = stringify(chunk);
            return chunk.type === 'string' ? `url(${str})` : str;
        });

    const suffix = valueChunks.length ?
        valueChunks
            .map(stringify)
            .join('') :
        '';

    return {
        images: {
            size: sizes,
            url: urls
        },
        suffix
    };
};

module.exports = postcss.plugin('postcss-image-set-polyfill', opts => {
    const preserve = Boolean(Object(opts).preserve);

    return css => {
        css.walkDecls(decl => {
            // make sure we have image-set
            if (!IMAGE_SET_FUNC_REGEX.test(decl.value)) {
                return;
            }

            const commaSeparatedValues = postcss.list.comma(decl.value);
            const mediaQueryList = {};

            const parsedValues = commaSeparatedValues.map(value => {
                const result = {};

                if (!IMAGE_SET_FUNC_REGEX.test(value)) {
                    result.default = value;
                    return result;
                }

                const parsedValue = parseValue(value, decl);
                const images = parsedValue.images;
                const suffix = parsedValue.suffix;

                result.default = images.url[0] + suffix;

                // for each image add a media query
                if (images.url.length > 1) {
                    for (let i = 0, len = images.url.length; i < len; i++) {
                        const size = images.size[i].dpi;

                        if (size !== DPI_RATIO.x) {
                            if (!mediaQueryList[size]) {
                                mediaQueryList[size] = images.size[i].pxRatio;
                            }
                            result[size] = images.url[i] + suffix;
                        } else {
                            result.default = images.url[i] + suffix;
                        }
                    }
                }

                return result;
            });

            // add the default image to the decl
            const fallbackDecl = decl.clone({
                value: parsedValues.map(val => val.default).join(',')
            });

            const parent = decl.parent;
            const beforeNodes = parent.nodes.slice(0, parent.nodes.indexOf(decl));
            const atruleKeys = Object.keys(mediaQueryList).sort();

            // fallback atrules
            const atrules = atruleKeys
                .map(size => {
                    const minResQuery = `(min-resolution: ${size}dpi)`;
                    const minDPRQuery = `(-webkit-min-device-pixel-ratio: ${mediaQueryList[size]})`;

                    const paramStr = `${minDPRQuery}, ${minResQuery}`;

                    const atrule = postcss.atRule({
                        name: 'media',
                        params: paramStr
                    });

                    // clone empty parent with only relevant decls
                    const parentClone = parent.clone().removeAll();

                    const declClone = decl.clone({
                        value: parsedValues.map(val => val[size] || val.default).join(',')
                    });

                    parentClone.append(declClone);
                    atrule.append(parentClone);

                    return atrule;
                });

            // clone parent container
            const parentClone = parent.clone().removeAll();

            // append the previous nodes and the fallback to the cloned parent
            parentClone.append(beforeNodes.concat(fallbackDecl));

            // insert the cloned parent and fallback atrules before the parent
            parent.before([parentClone].concat(atrules));

            // conditionally remove the original declaration
            if (!preserve) {
                decl.remove();

                // cleanup leftover emptied parent
                if (!parent.nodes.length) {
                    parent.remove();
                }
            }
        });
    };
});
