import * as commentJSON from 'comment-json';
import { query } from '../index';

describe('Test Index',  () => {
    let testObj = null;
    let testStores = null;
    const base = 10;
    beforeEach(() => {
        testObj = {
            name: 'Tobi',
            age: 8,
            location: { country: 'Canada', zip: 123 },
            likes: [{ id: 1, name: 'Food' }, { id: 2, name: 'Stuff' }]
        }
        testStores = {
            _id: 1,
            fruits: [ "apples", "pears", "oranges", "grapes", "bananas" ],
            vegetables: [ "carrots", "celery", "squash", "carrots" ]
        }
    });

    describe('#query', () => {
        it('query for simple object', () => {
            const change = query(testObj, {}, { $set: { 'location.country': 'US' } });
            expect(testObj).toMatchObject({
                name: 'Tobi',
                age: 8,
                location: { country: 'US', zip: 123 },
                likes: [{ id: 1, name: 'Food' }, { id: 2, name: 'Stuff' }]
            })
        });
        it('modifier for pull', () => {
            const change = query(
                testStores,
                {}, 
                { $pull: { fruits: { $in: [ "apples", "oranges" ] }, vegetables: "carrots" } }
            );
            expect(testStores).toMatchObject({
                "_id" : 1,
                "fruits" : [ "pears", "grapes", "bananas" ],
                "vegetables" : [ "celery", "squash" ]
            })
        });
    });

    describe('#set', () => {
        it('set simple', () => {
            const change = query(testObj, {}, { $set: { 'address': 'BeiJing' } });
            expect(testObj).toMatchObject({
                name: 'Tobi',
                address: 'BeiJing',
                age: 8,
                location: { country: 'Canada', zip: 123 },
                likes: [{ id: 1, name: 'Food' }, { id: 2, name: 'Stuff' }]
            })
        });
        it('set null for new key', () => {
            const change = query(testObj, {}, { $set: { 'address': null } });
            expect(testObj).toMatchObject({
                name: 'Tobi',
                age: 8,
                location: { country: 'Canada', zip: 123 },
                likes: [{ id: 1, name: 'Food' }, { id: 2, name: 'Stuff' }]
            })
        });
        it('set null for exist key', () => {
            const change = query(testObj, {}, { $set: { 'name': null } });
            expect(testObj).toMatchObject({
                name: null,
                age: 8,
                location: { country: 'Canada', zip: 123 },
                likes: [{ id: 1, name: 'Food' }, { id: 2, name: 'Stuff' }]
            })
        });
    });

    describe('#comment-json', () => {
        it('comment-json object', () => {
            const jsonFile = `
                {
                    "name": "packageName",
                    "version": "1.1.0-alpha.4",
                    "description": "test description",
                    "main": "./dist/index.js",
                    "keywords": [
                        "make",
                        "build",
                        "test"
                    ]
                }
            `;
            const jsonContent = JSON.parse(jsonFile);
            const _change = query(
                jsonContent,
                {},
                {
                    $pullAll: {
                        keywords: ['make', 'build'],
                    },
                },
            );
            console.log(_change, JSON.stringify(jsonContent, undefined, 2));
        })
        it('comment-json object', () => {
            const jsonWithCommentsFile = `
                {
                    "name": "packageName",
                    "version": "1.1.0-alpha.4",
                    "description": "test description",
                    "main": "./dist/index.js",
                    // I'm a comment
                    "keywords": [
                        "make",
                        "build", // comment
                    ]
                }
            `;
            const jsonContent = commentJSON.parse(jsonWithCommentsFile);
            const _change = query(
                jsonContent,
                {},
                {
                    $pullAll: {
                        keywords: ['build', 'generate'],
                    },
                },
            );
            console.log(_change, commentJSON.stringify(jsonContent, undefined, 2));
        })
    })
});
