"use strict";

const request = require("supertest");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
    testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    test("works for admin", async function () {
        const response = await request(app)
            .post("/jobs")
            .send({
                title: "New Job",
                salary: 70000,
                equity: '0.02',
                companyHandle: "c1"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "New Job",
                salary: 70000,
                equity: '0.02',
                companyHandle: "c1"
            }
        });
    });
    test('unauth for users', async function () {
        const response = await request(app)
            .post("/jobs")
            .send({
                title: "New Job",
                salary: 70000,
                equity: '0.02',
                companyHandle: "c1"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(response.statusCode).toEqual(401);
    });

    test('bad request if missing fields', async function () {
        const response = await request(app)
            .post("/jobs")
            .send({
                salary: 70000,

            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(400);
    });

    test('bad request if invalid data', async function () {
        const response = await request(app)
            .post("/jobs")
            .send({
                equity: 'this is not a number'
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("works for anon", async function () {
        const response = await request(app).get(`/jobs`);
        expect(response.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "J1",
                    salary: 1,
                    equity: "0.1",
                    companyHandle: "c1",
                    companyName: "C1",
                },
                {
                    id: expect.any(Number),
                    title: "J2",
                    salary: 2,
                    equity: "0.2",
                    companyHandle: "c1",
                    companyName: "C1",
                },
                {
                    id: expect.any(Number),
                    title: "J3",
                    salary: 3,
                    equity: null,
                    companyHandle: "c1",
                    companyName: "C1",
                },
            ],
        },
        );
    });

    test('works: filtering', async function () {
        const response = await request(app).get(`/jobs?title=3`);
        expect(response.body).toEqual({
            jobs: [{
                id: expect.any(Number),
                title: "J3",
                salary: 3,
                equity: null,
                companyHandle: "c1",
                companyName: "C1",
            }]
        })
    });

    test('works: multiple filters', async function () {
        const response = await request(app)
            .get(`/jobs`)
            .query({ title: '2', minSalary: 2 });
        expect(response.body).toEqual({
            jobs: [{
                id: expect.any(Number),
                title: "J2",
                salary: 2,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1"
            }]
        })
    })


    test("bad request if invalid filter key", async function () {
        const response = await request(app).get("/jobs?genericFilter = blue")
        expect(response.statusCode).toEqual(400);
    });
});


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const response = await request(app).get(`/jobs/${testJobIds[0]}`);
        expect(response.body).toEqual({
            job: {
                id: testJobIds[0],
                title: "J1",
                salary: 1,
                equity: "0.1",
                company: {
                    handle: "c1",
                    name: "C1",
                    description: "Desc1",
                    numEmployees: 1,
                    logoUrl: "http://c1.img",
                },
            },
        });
    });

    test("not found for no such job", async function () {
        const response = await request(app).get(`/jobs/0`);
        expect(response.statusCode).toEqual(404);
    });
});


/************************************** PATCH /jobs/:id */


describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const response = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "New Job",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(response.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "New Job",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1"
            }
        });
    });

    test('unauth for users', async function () {
        const response = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "New Job",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(response.statusCode).toEqual(401);
    })

    test('not found', async function () {
        const response = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                handle: "new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(400);
    })

    test(" BadRequestError for invalid data", async function () {
        const response = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(400);
    });

});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: testJobIds[0] });
    });

    test('unauth for users', async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('unauth for anyone', async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`);
        expect(resp.statusCode).toEqual(401);
    })

    test('not found', async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});