const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

describe('sqlForPartialUpdate', () => {
    test('works with valid input', () => {
        const dataToUpdate = { firstName: 'John', lastName: 'Doe', age: 30 };
        const jsToSql = { firstName: 'first_name', lastName: 'last_name' };
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2, "age"=$3',
            values: ['John', 'Doe', 30],
        });
    });

    test('throws error with empty data', () => {
        expect(() => {
            sqlForPartialUpdate({}, {});
        }).toThrow(BadRequestError);
    });

    test('handles jsToSql with undefined values', () => {
        const dataToUpdate = { firstName: 'John', lastName: 'Doe', age: 30 };
        const jsToSql = { firstName: 'first_name', lastName: undefined };
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toEqual({
            setCols: '"first_name"=$1, "lastName"=$2, "age"=$3',
            values: ['John', 'Doe', 30],
        });
    });
});