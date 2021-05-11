const mediaParser = require('postcss-media-query-parser').default;
const valueParser = require('postcss-value-parser');

const DPI_RATIO = {
    x: 96,
    dppx: 96,
    dpcm: 2.54,
    dpi: 1
};

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

function transform(decl, {list, atRule}) {
    // make sure we have image-set
    if (!decl.value || decl.value.indexOf('image-set') === -1) {
        return;
    }

    const commaSeparatedValues = list.comma(decl.value);
    const mediaQueryList = {};

    const parsedValues = commaSeparatedValues.map(value => {
        const result = {};

        if (value.indexOf('image-set') === -1) {
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
    decl.value = parsedValues.map(val => val.default).join(',');

    // check for the media queries
    const media = decl.parent.parent.params;
    const parsedMedia = media && mediaParser(media);

    Object.keys(mediaQueryList)
        .sort()
        .forEach(size => {
            const minResQuery = `(min-resolution: ${size}dpi)`;
            const minDPRQuery = `(-webkit-min-device-pixel-ratio: ${mediaQueryList[size]})`;

            const paramStr = parsedMedia ?
                parsedMedia.nodes
                    .map(queryNode => `${queryNode.value} and ${minDPRQuery}, ${queryNode.value} and ${minResQuery}`)
                    .join(',') :
                `${minDPRQuery}, ${minResQuery}`;

            const atrule = atRule({
                name: 'media',
                params: paramStr
            });

            // clone empty parent with only relevant decls
            const parent = decl.parent.clone({
                nodes: []
            });

            const d = decl.clone({
                value: parsedValues.map(val => val[size] || val.default).join(',')
            });

            parent.append(d);
            atrule.append(parent);

            decl.root().append(atrule);
        });
}

module.exports = () => {
    return {
        postcssPlugin: 'postcss-image-set-polyfill',
        Declaration: {
            "background-image": transform,
            background: transform
        }
    };
};

module.exports.postcss = true;