"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
    *
    * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
    * 
    * Accepts optional filtering parameters:
    * - name: filter by company name (case-insensitive)
    * - minEmployees: filter to companies that have at least that number of employees
    * - maxEmployees: filter to companies that have no more than that number of employees
    * 
    * If the minEmployees parameter is greater than the maxEmployees parameter, throw a BadRequestError.
    */

  static async findAll(filters = {}) {
    // This is the initial query to select the handle, name, description, num_employees, and logo_url columns
    // from the companies table.
    let query = `SELECT handle, 
                        name, 
                        description, 
                        num_employees AS "numEmployees", 
                        logo_url AS "logoUrl" 
                        FROM companies`;

    const whereClauses = [];
    const qVal = [];

    const { name, minEmployees, maxEmployees } = filters;
    // If the 'minEmployees' value is greater than the 'maxEmployees' value, a BadRequestError is thrown.
    if (minEmployees > maxEmployees) {
      throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
    }
    // If the 'name' value is provided, the query searches for companies whose names contain
    // the 'name' string. The '%' character is used as a wildcard in the query.
    if (name) {
      qVal.push(`%${name}%`);
      whereClauses.push(`name ILIKE $${qVal.length}`);
    }
    // If the 'minEmployees' value is provided, the query selects only companies with at least
    // the number of employees specified.
    if (minEmployees) {
      qVal.push(minEmployees);
      whereClauses.push(`num_employees >= $${qVal.length}`);
    }
    // If the 'maxEmployees' value is provided, the query selects only companies with at most
    // the number of employees specified.
    if (maxEmployees) {
      qVal.push(maxEmployees);
      whereClauses.push(`num_employees <= $${qVal.length}`);
    }
    // If any of the above filter criteria are used, the relevant 'whereClauses' and 'qVal'
    // entries are added to the query.
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }
    // The query is ordered alphabetically by company name.
    query += " ORDER BY name";
    // The query is executed using the 'db' object, and the resulting rows are returned.
    const result = await db.query(query, qVal);
    return result.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
