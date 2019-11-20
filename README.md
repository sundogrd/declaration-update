# Declaration Update

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]
[![Minified size][min-size-image]][bundlephobia-url]
[![Gzip size][gzip-size-image]][bundlephobia-url]

update object using mongodb way, also support `comment-json` object

👷 Still Working.

Setup via NPM
```sh
npm install declaration-update --save
```

This is a declaration for update a object in Javascript.

```javascript
// import update from 'react-addons-update';
import { query } from 'declaration-update';

let testStores = {
    _id: 1,
    fruits: [ "apples", "pears", "oranges", "grapes", "bananas" ],
    vegetables: [ "carrots", "celery", "squash", "carrots" ]
}
const change = query(
    testStores,
    {},
    { $pull: { fruits: { $in: [ "apples", "oranges" ] }, vegetables: "carrots" } }
);
console.log(testStores, change)
/*
testStores: {
    "_id" : 1,
    "fruits" : [ "pears", "grapes", "bananas" ],
    "vegetables" : [ "celery", "squash" ]
}
change: [{op: "$pull", key: "vegetables", value: ["carrots", "carrots"]}]
*/
```


[npm-image]: https://img.shields.io/npm/v/declaration-update.svg?style=flat-square
[npm-url]: https://npmjs.org/package/declaration-update
[downloads-image]: http://img.shields.io/npm/dm/declaration-update.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/declaration-update
[min-size-image]: https://badgen.net/bundlephobia/min/declaration-update?label=minified
[gzip-size-image]: https://badgen.net/bundlephobia/minzip/declaration-update?label=gzip
[bundlephobia-url]: https://bundlephobia.com/result?p=declaration-update