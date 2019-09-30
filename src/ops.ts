
/**
 * Module dependencies.
 */
import mongoEql from './mongo-core/mongo-eql';
import getType from './utils/get-type';

/**
 * $ne: not equal.
 */

export const $ne = (matcher, val) => {
    return !mongoEql(matcher, val);
};

/**
 * $gt: greater than.
 */

export const $gt = function $gt (matcher, val) {
    return getType(matcher) === 'number' && val > matcher;
};

/**
 * $gte: greater than equal.
 */

export const $gte = function $gte (matcher, val) {
    return getType(matcher) === 'number' && val >= matcher;
};

/**
 * $lt: less than.
 */

export const $lt = function $lt (matcher, val) {
    return getType(matcher) === 'number' && val < matcher;
};

/**
 * $lte: less than equal.
 */

export const $lte = function $lte (matcher, val) {
    return getType(matcher) === 'number' && val <= matcher;
};

/**
 * $regex: supply a regular expression as a string.
 */

export const $regex = function $regex (matcher, val) {
    // TODO: add $options support
    if ('regexp' !== getType('matcher')) matcher = new RegExp(matcher);
    return matcher.test(val);
};

/**
 * $exists: key exists.
 */

export const $exists = function $exists (matcher, val) {
    if (matcher) {
        return undefined !== val;
    } else {
        return undefined === val;
    }
};

/**
 * $in: value in array.
 */

export const $in = function $in (matcher, val) {
    if ('array' !== getType(matcher)) return false;
    for (let i = 0; i < matcher.length; i++) {
        if (mongoEql(matcher[i], val)) return true;
    }
    return false;
};

/**
 * $nin: value not in array.
 */

export const $nin = function $nin (matcher, val) {
    return !exports.$in(matcher, val);
};

/**
 * @size: array length
 */

export const $size = function (matcher, val) {
    return Array.isArray(val) && matcher === val.length;
};
