import debugPkg from 'debug';
import filter from './filter';
import * as mods from './mods';
import * as mongoDot from './mongo-core/mongo-dot';
const debug = debugPkg('declaration-update')

/**
 * Execute a query.
 *
 * Options:
 *  - `strict` only modify if query matches
 *
 * @param {Object} object to alter
 * @param {Object} query to filter modifications by
 * @param {Object} update object
 * @param {Object} options
 */

function query (obj: Record<string, any>, query: Record<string, any>, update?: Record<string, any>, opts?: Record<string, any>): Record<string, any> {
    obj = obj || {};
    opts = opts || {};
    query = query || {};
    update = update || {};
  
    // strict mode
    const strict = !!opts.strict;
  
    let match;
    const log = [];
  
    if (Object.keys(query).length !== 0) {
        match = filter(obj, query);
    }
  
    if (!strict || false !== match) {
        const keys = Object.keys(update);
        const transactions = [];
  
        for (let i = 0, l = keys.length; i < l; i++) {
            if (mods[keys[i]]) {
                debug('found modifier "%s"', keys[i]);
                for (const key in update[keys[i]]) {
                    const pos = key.indexOf('.$.');
  
                    if (pos !== -1) {
                        const prefix = key.substr(0, pos);
                        const suffix = key.substr(pos + 3);
  
                        if (match[prefix]) {
                            debug('executing "%s" %s on first match within "%s"', key, keys[i], prefix);
                            const fn = mods[keys[i]](match[prefix][0], suffix, update[keys[i]][key]);
                            if (fn) {
                                // produce a key name replacing $ with the actual index
                                // TODO: this is unnecessarily expensive
                                const index = mongoDot.get(obj, prefix).indexOf(match[prefix][0]);
                                fn.key = prefix + '.' + index + '.' + suffix;
                                fn.op = keys[i];
                                transactions.push(fn);
                            }
                        } else {
                            debug('ignoring "%s" %s - no matches within "%s"', key, keys[i], prefix);
                        }
                    } else {
                        const fn = mods[keys[i]](obj, key, update[keys[i]][key]);
                        if (fn) {
                            fn.key = key;
                            fn.op = keys[i];
                            transactions.push(fn);
                        }
                    }
                }
            } else {
                debug('skipping unknown modifier "%s"', keys[i]);
            }
        }
  
        if (transactions.length) {
        // if we got here error free we process all transactions
            for (let i = 0; i < transactions.length; i++) {
                const fn = transactions[i];
                const val = fn();
                log.push({ op: fn.op, key: fn.key, value: val });
            }
        }
    } else {
        debug('no matches for query %j', query);
    }
  
    return log;
}
export default query  