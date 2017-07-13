const postcss = require('postcss');
const mediaParser = require('postcss-media-query-parser').default;

const DPI_RATIO = {
    x: 96,
    dppx: 96,
    dpcm: 2.54
};

// get the list of images
const extractList = value => {
    const stripped = value.replace(/(\r\n|\n)/g, '');
    const inside = stripped.match(/image-set\(([\s\S]+)\)/)[1];

    return postcss.list.comma(inside);
};

// get the size of image
const extractSize = image => {
    const l = postcss.list.space(image);

    if (l.length === 1) {
        return DPI_RATIO.x;
    }

    const m = l[1].match(/^([0-9|\.]+)(dpi|dppx|dpcm|x)$/);

    if (m) {
        return Math.floor(m[1] * (DPI_RATIO[m[2]] || 1));
    }
    throw 'Incorrect size value';
};

// get the url of an image
const extractUrl = image => {
    const url = postcss.list.space(image)[0];

    return url.match(/url\(/) || url.match(/image\(/) ?
        url :
        `url(${url})`;
};

// split url and size
const split = image => ({
    size: extractSize(image),
    url:  extractUrl(image)
});

const getSuffix = value => {
    const beautifiedlVal = value.replace(/(\n|\r)\s+/g, ' ');

    return  /.*\)(.*)/.exec(beautifiedlVal)[1];
};

module.exports = postcss.plugin('postcss-image-set-polyfill', () =>
    css => {
        css.walkDecls(/^(background-image|background)$/, decl => {

            // ignore nodes we already visited
            if (decl.__visited) {
                return;
            }

            // make sure we have image-set
            if (!decl.value || decl.value.indexOf('image-set') === -1) {
                return;
            }

            const commaSeparatedValues = postcss.list.comma(decl.value);
            const mediaQueryList = [];

            const parsedValues = commaSeparatedValues.map(value => {
                const result = {};

                if (value.indexOf('image-set') === -1) {
                    result.default = value;
                    return result;
                }

                const images = extractList(value).map(split);

                // remember other part of property if it's 'background' property
                const suffix = decl.prop === 'background' ? getSuffix(value) : '';

                result.default = images[0].url + suffix;

                // for each image add a media query
                if (images.length > 1) {
                    images.forEach(img => {
                        if (img.size !== DPI_RATIO.x) {
                            if (mediaQueryList.indexOf(img.size) === -1) {
                                mediaQueryList.push(img.size);
                            }
                            result[img.size] = img.url + suffix;
                        }
                        else {
                            result.default = img.url + suffix;
                        }
                    });
                }

                return result;
            });

            // add the default image to the decl
            decl.value = parsedValues.map(val => val.default).join(',');

            // check for the media queries
            const media = decl.parent.parent.params;
            const parsedMedia = media && mediaParser(media);

            mediaQueryList
                .sort()
                .forEach(size => {
                    const minResQuery = `(min-resolution: ${size}dpi)`;

                    const paramStr = parsedMedia ?
                        parsedMedia.nodes.map(queryNode => `${queryNode.value} and ${minResQuery}`).join(',') :
                        minResQuery;

                    const atrule = postcss.atRule({
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

                    // mark nodes as visited by us
                    d.__visited = true;

                    parent.append(d);
                    atrule.append(parent);

                    decl.root().append(atrule);
                });
        });
    }
);
