import debugPkg from 'debug';
import mongoEql from './mongo-core/mongo-eql';
import * as ops from './ops';
import getType from './utils/get-type';


const debug = debugPkg('declaration-update');

/**
 * Filters an `obj` by the given `query` for subdocuments.
 *
 * @return {Object|Boolean} false if no match, or matched subdocs
 * @api public
 */
/* eslint-disable @typescript-eslint/camelcase */
function filter (obj, query): Record<string, any> | boolean {
    obj = obj || {};
    const ret = {};

    /**
     * Compares the given matcher with the document value.
     *
     * @param {Mixed} matcher
     * @param {Mixed} value
     * @api private
     */
    function compare (matcher, val) {
        if ('object' !== getType(matcher)) {
            return mongoEql(matcher, val);
        }

        const keys = Object.keys(matcher);
        if ('$' === keys[0][0]) {
            for (let i = 0; i < keys.length; i++) {
            // special case for sub-object matching
                if ('$elemMatch' === keys[i]) {
                    return false !== filter(val, matcher.$elemMatch);
                } else {
                    if (!ops[keys[i]](matcher[keys[i]], val)) return false;
                }
            }
            return true;
        } else {
            return mongoEql(matcher, val);
        }
    }

    for (const key in query) {
        if (!query.hasOwnProperty(key)) continue;

        // search value
        const val = query[key];

        // split the key into prefix and suffix
        const keys = key.split('.');
        let target = obj;
        let prefix, search;
        const matches = [];

        walk_keys:
        for (let i = 0; i < keys.length; i++) {
            target = target[keys[i]];

            switch (getType(target)) {
                case 'array':
                    // if it's an array subdocument search we stop here
                    prefix = keys.slice(0, i + 1).join('.');
                    search = keys.slice(i + 1).join('.');

                    debug('searching array "%s"', prefix);

                    // we special case operators that don't walk the array
                    if (val.$size && !search.length) {
                        return compare(val, target);
                    }

                    // walk subdocs
                    const subset = ret[prefix] || target;

                    for (let ii = 0; ii < subset.length; ii++) {
                        if (search.length) {
                            const q = {};
                            q[search] = val;
                            if ('object' === getType(subset[ii])) {
                                debug('attempting subdoc search with query %j', q);
                                if (filter(subset[ii], q)) {
                                    // we ignore the ret value of filter
                                    if (!ret[prefix] || !~ret[prefix].indexOf(subset[ii])) {
                                        matches.push(subset[ii]);
                                    }
                                }
                            }
                        } else {
                            debug('performing simple array item search');
                            if (compare(val, subset[ii])) {
                                if (!ret[prefix] || !~ret[prefix].indexOf(subset[ii])) {
                                    matches.push(subset[ii]);
                                }
                            }
                        }
                    }

                    if (matches.length) {
                        ret[prefix] = ret[prefix] || [];
                        ret[prefix] = [...ret[prefix], ...matches]
                    }

                    // we don't continue the key search
                    break walk_keys;

                case 'undefined':
                    // if we can't find the key
                    return false;

                case 'object':
                    if (null !== keys[i + 1] && undefined !== keys[i + 1]) {
                        continue;
                    } else if (!compare(val, target)) {
                        return false;
                    }
                    break;

                default:
                    if (!compare(val, target)) return false;
            }
        }
    }

    return ret;
}
/* eslint-enable @typescript-eslint/camelcase */

export default filter