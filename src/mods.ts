
/**
 * Module dependencies.
 */
import debugPkg from 'debug';
import * as mongoDot from './mongo-core/mongo-dot';
import mongoEql from './mongo-core/mongo-eql';
import getType from './utils/get-type';

const debug = debugPkg('mongo-query');



/**
 * Helper to determine if a value is numeric.
 *
 * @param {String|Number} value
 * @return {Boolean} true if numeric
 * @api private
 */

function numeric (val: string | number): boolean {
    return 'number' === getType(val) || Number(val) === val;
}

/**
 * Helper for determining if an array has the given value.
 *
 * @param {Array} array
 * @param {Object} value to check
 * @return {Boolean}
 */

function has (array, val): boolean {
    for (let i = 0, l = array.length; i < l; i++) {
        if (mongoEql(val, array[i])) return true;
    }
    return false;
}


/**
 * Array#filter function generator for `$pull`/`$pullAll` operations.
 *
 * @param {Array} array of values to match
 * @param {Array} array to populate with results
 * @return {Function} that splices the array
 */

function pull (arr, vals, pulled) {
    const indexes = [];

    for (let a = 0; a < arr.length; a++) {
        const val = arr[a];

        for (let i = 0; i < vals.length; i++) {
            const matcher = vals[i];
            if ('object' === getType(matcher)) {
                // we only are only interested in obj <-> obj comparisons
                if ('object' === getType(val)) {
                    let match = false;

                    if (Object.keys(matcher).length) {
                        for (const i in matcher) {
                            if (matcher.hasOwnProperty(i)) {
                                // we need at least one matching key to pull
                                if (mongoEql(matcher[i], val[i])) {
                                    match = true;
                                } else {
                                    // if a single key doesn't match we move on
                                    match = false;
                                    break;
                                }
                            }
                        }
                    } else if (!Object.keys(val).length) {
                        // pull `{}` matches [{}]
                        match = true;
                    }

                    if (match) {
                        indexes.push(a);
                        pulled.push(val);
                        continue;
                    }
                } else {
                    debug('ignoring pull match against object');
                }
            } else {
                if (mongoEql(matcher, val)) {
                    indexes.push(a);
                    pulled.push(val);
                    continue;
                }
            }
        }
    }

    return function () {
        for (let i = 0; i < indexes.length; i++) {
            const index = indexes[i];
            arr.splice(index - i, 1);
        }
    };
}

/**
 * Performs a `$set`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

const $set = function $set (obj, path, val) {
    const key = path.split('.').pop();
    obj = mongoDot.parent(obj, path, true);

    switch (getType(obj)) {
        case 'object':
            if (!mongoEql(obj[key], val)) {
                return function () {
                    obj[key] = val;
                    return val;
                };
            }
            break;

        case 'array':
            if (numeric(key)) {
                if (!mongoEql(obj[key], val)) {
                    return function () {
                        obj[key] = val;
                        return val;
                    };
                }
            } else {
                throw new Error('can\'t append to array using string field name [' + key + ']');
            }
            break;

        default:
            throw new Error('$set only supports object not ' + getType(obj));
    }
};

/**
 * Performs an `$unset`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

const $unset = function $unset (obj, path) {
    const key = path.split('.').pop();
    obj = mongoDot.parent(obj, path);

    switch (getType(obj)) {
        case 'array':
        case 'object':
            if (obj.hasOwnProperty(key)) {
                return function () {
                    // reminder: `delete arr[1]` === `delete arr['1']` [!]
                    delete obj[key];
                };
            } else {
                // we fail silently
                debug('ignoring unset of inexisting key');
            }
    }
};

/**
 * Performs a `$rename`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

const $rename = function $rename (obj, path, newKey) {
    // target = source
    if (path === newKey) {
        throw new Error('$rename source must differ from target');
    }

    // target is parent of source
    if (0 === path.indexOf(newKey + '.')) {
        throw new Error('$rename target may not be a parent of source');
    }

    const p = mongoDot.parent(obj, path);
    const t = getType(p);

    if ('object' === t) {
        const key = path.split('.').pop();

        if (p.hasOwnProperty(key)) {
            return function () {
                const val = p[key];
                delete p[key];

                // target does initialize the path
                const newp = mongoDot.parent(obj, newKey, true);

                // and also fails silently upon type mismatch
                if ('object' === getType(newp)) {
                    newp[newKey.split('.').pop()] = val;
                } else {
                    debug('invalid $rename target path type');
                }

                // returns the name of the new key
                return newKey;
            };
        } else {
            debug('ignoring rename from inexisting source');
        }
    } else if ('undefined' !== t) {
        throw new Error('$rename source field invalid');
    }
};

/**
 * Performs an `$inc`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

const $inc = function $inc (obj, path, inc) {
    if ('number' !== getType(inc)) {
        throw new Error('Modifier $inc allowed for numbers only');
    }

    obj = mongoDot.parent(obj, path, true);
    const key = path.split('.').pop();

    switch (getType(obj)) {
        case 'array':
        case 'object':
            if (obj.hasOwnProperty(key)) {
                if ('number' !== getType(obj[key])) {
                    throw new Error('Cannot apply $inc modifier to non-number');
                }

                return function () {
                    obj[key] += inc;
                    return inc;
                };
            } else if('object' === getType(obj) || numeric(key)) {
                return function () {
                    obj[key] = inc;
                    return inc;
                };
            } else {
                throw new Error('can\'t append to array using string field name [' + key + ']');
            }
            break;

        default:
            throw new Error('Cannot apply $inc modifier to non-number');
    }
};

/**
 * Performs an `$pop`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

const $pop = function $pop (obj, path, val) {
    obj = mongoDot.parent(obj, path);
    const key = path.split('.').pop();

    // we make sure the array is not just the parent of the main key
    switch (getType(obj)) {
        case 'array':
        case 'object':
            if (obj.hasOwnProperty(key)) {
                switch (getType(obj[key])) {
                    case 'array':
                        if (obj[key].length) {
                            return function () {
                                if (-1 === val) {
                                    return obj[key].shift();
                                } else {
                                    // mongodb allows any value to pop
                                    return obj[key].pop();
                                }
                            };
                        }
                        break;

                    case 'undefined':
                        debug('ignoring pop to inexisting key');
                        break;

                    default:
                        throw new Error('Cannot apply $pop modifier to non-array');
                }
            } else {
                debug('ignoring pop to inexisting key');
            }
            break;

        case 'undefined':
            debug('ignoring pop to inexisting key');
            break;
    }
};

/**
 * Performs a `$push`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {Object} value to push
 * @return {Function} transaction (unless noop)
 */

const $push = function $push (obj, path, val) {
    obj = mongoDot.parent(obj, path, true);
    const key = path.split('.').pop();

    switch (getType(obj)) {
        case 'object':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    return function () {
                        obj[key].push(val);
                        return val;
                    };
                } else {
                    throw new Error('Cannot apply $push/$pushAll modifier to non-array');
                }
            } else {
                return function () {
                    obj[key] = [val];
                    return val;
                };
            }
            break;

        case 'array':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    return function () {
                        obj[key].push(val);
                        return val;
                    };
                } else {
                    throw new Error('Cannot apply $push/$pushAll modifier to non-array');
                }
            } else if (numeric(key)) {
                return function () {
                    obj[key] = [val];
                    return val;
                };
            } else {
                throw new Error('can\'t append to array using string field name [' + key + ']');
            }
            break;
    }
};

/**
 * Performs a `$pushAll`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {Array} values to push
 * @return {Function} transaction (unless noop)
 */

const $pushAll = function $pushAll (obj, path, val) {
    if ('array' !== getType(val)) {
        throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
    }

    obj = mongoDot.parent(obj, path, true);
    const key = path.split('.').pop();

    switch (getType(obj)) {
        case 'object':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    return function (): any {
                        obj[key] = [...obj[key], ...val];
                        return val;
                    };
                } else {
                    throw new Error('Cannot apply $push/$pushAll modifier to non-array');
                }
            } else {
                return function (): any {
                    obj[key] = val;
                    return val;
                };
            }
            break;

        case 'array':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    return function (): any {
                        obj[key] = [...obj[key], ...val]
                        return val;
                    };
                } else {
                    throw new Error('Cannot apply $push/$pushAll modifier to non-array');
                }
            } else if (numeric(key)) {
                return function (): any {
                    obj[key] = val;
                    return val;
                };
            } else {
                throw new Error('can\'t append to array using string field name [' + key + ']');
            }
            break;
    }
};

/**
 * Performs a `$pull`.
 */

const $pull = function $pull (obj, path, val) {
    obj = mongoDot.parent(obj, path, true);
    const key = path.split('.').pop();
    const t = getType(obj);

    switch (t) {
        case 'object':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    const pulled = [];
                    // TODO: 通过filter先计算出内容
                    const splice = pull(obj[key], [val], pulled);
                    if (pulled.length) {
                        return function () {
                            splice();
                            return pulled;
                        };
                    }
                } else {
                    throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
                }
            }
            break;

        case 'array':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    const pulled = [];
                    const splice = pull(obj[key], [val], pulled);
                    if (pulled.length) {
                        return function () {
                            splice();
                            return pulled;
                        };
                    }
                } else {
                    throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
                }
            } else {
                debug('ignoring pull to non array');
            }
            break;

        default:
            if ('undefined' !== t) {
                throw new Error('LEFT_SUBFIELD only supports Object: hello not: ' + t);
            }
    }
};

/**
 * Performs a `$pullAll`.
 */

const $pullAll = function $pullAll (obj, path, val) {
    if ('array' !== getType(val)) {
        throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
    }

    obj = mongoDot.parent(obj, path, true);
    const key = path.split('.').pop();
    const t = getType(obj);

    switch (t) {
        case 'object':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    const pulled = [];
                    const splice = pull(obj[key], val, pulled);
                    if (pulled.length) {
                        return function (): Array<any> {
                            splice();
                            return pulled;
                        };
                    }
                } else {
                    throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
                }
            }
            break;

        case 'array':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    const pulled = [];
                    const splice = pull(obj[key], val, pulled);
                    if (pulled.length) {
                        return function () {
                            splice();
                            return pulled;
                        };
                    }
                } else {
                    throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
                }
            } else {
                debug('ignoring pull to non array');
            }
            break;

        default:
            if ('undefined' !== t) {
                throw new Error('LEFT_SUBFIELD only supports Object: hello not: ' + t);
            }
    }
};

/**
 * Performs a `$addToSet`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {Object} value to push
 * @param {Boolean} internal, true if recursing
 * @return {Function} transaction (unless noop)
 */

const $addToSet = function $addToSet (obj, path, val, recursing) {
    if (!recursing && 'array' === getType(val.$each)) {
        const fns = [];
        for (let i = 0, l = val.$each.length; i < l; i++) {
            const fn = $addToSet(obj, path, val.$each[i], true);
            if (fn) fns.push(fn);
        }
        if (fns.length) {
            return function () {
                const values = [];
                for (let i = 0; i < fns.length; i++) values.push(fns[i]());
                return values;
            };
        } else {
            return;
        }
    }

    obj = mongoDot.parent(obj, path, true);
    const key = path.split('.').pop();

    switch (getType(obj)) {
        case 'object':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    if (!has(obj[key], val)) {
                        return function () {
                            obj[key].push(val);
                            return val;
                        };
                    }
                } else {
                    throw new Error('Cannot apply $addToSet modifier to non-array');
                }
            } else {
                return function () {
                    obj[key] = [val];
                    return val;
                };
            }
            break;

        case 'array':
            if (obj.hasOwnProperty(key)) {
                if ('array' === getType(obj[key])) {
                    if (!has(obj[key], val)) {
                        return function () {
                            obj[key].push(val);
                            return val;
                        };
                    }
                } else {
                    throw new Error('Cannot apply $addToSet modifier to non-array');
                }
            } else if (numeric(key)) {
                return function () {
                    obj[key] = [val];
                    return val;
                };
            } else {
                throw new Error('can\'t append to array using string field name [' + key + ']');
            }
            break;
    }
};

export { $set, $unset, $rename, $inc, $pop, $push, $pushAll, $pull, $pullAll, $addToSet };

