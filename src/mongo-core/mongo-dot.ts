import getType from '../utils/get-type';

function parent (obj: Record<string, any>, key: string, init?: boolean): Record<string, any> {
    if (key.includes(".")) {
        const pieces = key.split('.');
        let ret = obj;

        for (let i = 0; i < pieces.length - 1; i++) {
            // if the key is a number string and parent is an array
            if (Number(pieces[i]).toString() === pieces[i] && 'array' === getType(ret)) {
                ret = ret[pieces[i]];
            } else if ('object' === getType(ret)) {
                if (init && !ret.hasOwnProperty(pieces[i])) {
                    ret[pieces[i]] = {};
                }
                if (ret) ret = ret[pieces[i]];
            }
        }

        return ret;
    } else {
        return obj;
    }
}

/**
 * Gets a certain `path` from the `obj`.
 *
 * @param {Object} target
 * @param {String} key
 * @return {Object} found object, or `undefined
 * @api public
 */
const get = function (obj: Record<string, any>, path: string): Record<string, any> {
    if (path.includes(".")) {
        const par = parent(obj, path);
        const mainKey = path.split('.').pop();
        const t = getType(par);
        if ('object' === t || 'array' === t) return par[mainKey];
    } else {
        return obj[path];
    }
};

/**
 * Sets the given `path` to `val` in `obj`.
 *
 * @param {Object} target
 * @Param {String} key
 * @param {Object} value
 * @api public
 */
const set = function (obj: Record<string, any>, path: string, val: any): void {
    if (path.includes(".")) {
        const par = parent(obj, path, true);
        const mainKey = path.split('.').pop();
        if (par && 'object' === getType(par)) par[mainKey] = val;
    } else {
        obj[path] = val;
    }
};

export { parent, set, get };

