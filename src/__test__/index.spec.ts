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
});
