const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * Helper function to create a SQL partial update statement based on a JavaScript object and a mapping object.
 *
 * @param {Object} dataToUpdate - JavaScript object containing the data to update.
 * @param {Object} jsToSql - Mapping object that maps the keys of `dataToUpdate` to the corresponding column names in SQL.
 * @returns {Object} - An object containing the set columns and the values to update in SQL syntax.
 * @throws {BadRequestError} - If `dataToUpdate` is empty.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
