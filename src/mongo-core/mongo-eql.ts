import getType from '../utils/get-type';

// Applies the MongoDB equality semantics for a comparison between two datastructures.
function mongoEql (matcher, val):boolean {
    switch (getType(matcher)) {
        case 'null':
        case 'undefined':
            // we treat null as undefined
            return null === val;

        case 'regexp':
            return matcher.test(val);

        case 'array':
            if ('array' === getType(val) && matcher.length === val.length) {
                for (let i = 0; i < matcher.length; i++) {
                    if (!mongoEql(val[i], matcher[i])) return false;
                }
                return true;
            } else {
                return false;
            }
            break;

        case 'object':
            // object can match keys in any order
            const keys = {};

            // we match all values of `matcher` in `val`
            for (const i in matcher) {
                if (matcher.hasOwnProperty(i)) {
                    if (!val.hasOwnProperty(i) || !mongoEql(matcher[i], val[i])) {
                        return false;
                    }
                }
                keys[i] = true;
            }

            // we make sure `val` doesn't have extra keys
            for (const i in val) {
                if (val.hasOwnProperty(i) && !keys.hasOwnProperty(i)) {
                    return false;
                }
            }

            return true;

        default:
            return matcher === val;
    }
}

export default mongoEql