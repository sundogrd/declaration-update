// code borrowed from https://github.com/feross/is-buffer/blob/master/index.js
function isBuffer (obj) {
    return !!(obj !== null && obj !== undefined &&
      (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
        (obj.constructor &&
        typeof obj.constructor.isBuffer === 'function' &&
        obj.constructor.isBuffer(obj))
      ))
}

const getType = (val): string => {
    switch (Object.prototype.toString.call(val)) {
        case '[object Date]': return 'date';
        case '[object RegExp]': return 'regexp';
        case '[object Arguments]': return 'arguments';
        case '[object Array]': return 'array';
        case '[object Error]': return 'error';
    }

    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (val !== val) return 'nan';
    if (val && val.nodeType === 1) return 'element';

    if (isBuffer(val)) return 'buffer';

    val = val.valueOf
        ? val.valueOf()
        : Object.prototype.valueOf.apply(val);

    return typeof val;

}

export default getType