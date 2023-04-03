"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for Jobs */

class Job {

    /** Create a job (from data), update db, return new job data.
       *
       * data should be { title, salary, equity, companyHandle }
       *
       * Returns { id, title, salary, equity, companyHandle }
       **/
    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
               VALUES ($1, $2, $3, $4)
               RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                data.title,
                data.salary,
                data.equity,
                data.companyHandle,
            ]);
        let job = result.rows[0];

        return job;
    }



    /** Find all jobs.
        *
        * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
        * 
        * Accepts optional filtering parameters:
        * - minSalary
        * - hasEquity (true returns only jobs with equity > 0, other values ignored)
        * - title (will find case-insensitive, partial matches)    
        */
    static async findAll(filters = {}) {
        // This variable stores the initial query string that retrieves job data.
        let query = `SELECT j.id, j.title, j.salary, j.equity, 
                    j.company_handle AS "companyHandle", c.name AS "companyName"
                    FROM jobs j LEFT JOIN companies AS c ON c.handle = j.company_handle`;

        const whereClauses = [];
        const qVal = [];

        const { minSalary, hasEquity, title } = filters;
        // This conditional statement adds a WHERE clause to the query if the 'title' filter is present in the filters object.
        if (title) {
            qVal.push(`%${title}%`);
            whereClauses.push(`title ILIKE $${qVal.length}`);
        }
        // This conditional statement adds a WHERE clause to the query if the 'minSalary' filter is present in the filters object.
        if (minSalary) {
            qVal.push(minSalary);
            whereClauses.push(`salary >= $${qVal.length}`);
        }
        // This conditional statement adds a WHERE clause to the query if the 'hasEquity' filter is present in the filters object
        if (hasEquity) {
            whereClauses.push(`equity > 0`);
        }
        // This conditional statement adds the WHERE clauses to the query if there are any.
        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(" AND ")}`;
        }
        // The query is ordered alphabetically by job title.
        query += " ORDER BY title";
        // The query is executed using the 'db' object, and the resulting rows are returned.
        const result = await db.query(query, qVal);
        return result.rows;
    }

    /** Given a job id, return data about job.
       *
       * Returns { id, title, salary, equity, companyHandle, company }
       *   where company is { handle, name, description, numEmployees, logoUrl }
       *
       * Throws NotFoundError if not found.
       **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs WHERE id = $1`, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(
            `SELECT handle, name, description, num_employees AS "numEmployees",
            logo_url AS "logoUrl" FROM companies
            WHERE handle = $1`, [job.companyHandle]);

        delete job.companyHandle;
        job.company = companiesRes.rows[0];

        return job;
    }


    /** Update job data with `data`.
       *
       * This is a "partial update" --- it's fine if data doesn't contain all the
       * fields; this only changes provided ones.
       *
       * Data can include: {title, equity, salary}
       *
       * Returns {id, title, equity, salary, companyHandle}
       *
       * Throws NotFoundError if not found.
       */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data, {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

    static async remove(id) {
        const result = await db.query(
            `DELETE FROM jobs WHERE id = $1
           RETURNING id`, [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;