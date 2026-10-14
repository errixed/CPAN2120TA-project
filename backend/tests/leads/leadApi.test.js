import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../../src/app.js";
let server, base;
before(async () => {
    server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(() => new Promise(resolve => server.close(resolve)));
async function request(path, method = "GET", body) {
    const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json" }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
}
const sample = { advisorId: "507f1f77bcf86cd799439011", name: "Jane Example", email: " JANE@EXAMPLE.COM ", interest: "Retirement planning" };

test("create, normalize, read, filter and update leads through HTTP", async () => {
    const created = await request("/leads", "POST", { ...sample, marketingConsent: true });
    assert.equal(created.status, 201);
    const lead = created.body.data;
    assert.equal(lead.email, "jane@example.com");
    assert.equal(lead.status, "NEW");
    assert.ok(lead.consentRecordedAt);
    assert.equal(lead.unsubscribedAt, null);
    assert.equal((await request(`/leads/${lead._id}`)).body.data.name, sample.name);
    const listed = await request("/leads?status=NEW&marketingConsent=true&search=jane&interest=retirement&advisorId=" + sample.advisorId);
    assert.equal(listed.body.pagination.total, 1);
    assert.equal(listed.body.data[0]._id, lead._id);
    const updated = await request(`/leads/${lead._id}`, "PATCH", { status: "CONTACTED", marketingConsent: false });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.status, "CONTACTED");
    assert.ok(updated.body.data.unsubscribedAt);
    assert.equal(updated.body.data.createdAt, lead.createdAt);
    const restored = await request(`/leads/${lead._id}`, "PATCH", { marketingConsent: true });
    assert.equal(restored.body.data.unsubscribedAt, null);
    assert.equal((await request("/leads?status=CONVERTED")).body.pagination.total, 0);
});

test("default consent is false and records support pagination", async () => {
    const created = await request("/leads", "POST", { ...sample, email: "second@example.com" });
    assert.equal(created.body.data.marketingConsent, false);
    assert.equal(created.body.data.consentRecordedAt, null);
    const result = await request("/leads?limit=1&page=2");
    assert.equal(result.body.data.length, 1);
    assert.equal(result.body.pagination.total, 2);
});

test("reject invalid create fields rather than silently casting values", async () => {
    for (const input of [{}, { ...sample, email: "bad" }, { ...sample, marketingConsent: "false" }, { ...sample, marketingConsent: 1 }, { ...sample, advisorId: "bad" }, { ...sample, status: "INVALID" }, { ...sample, name: " " }, { ...sample, source: "INVALID" }, { ...sample, consentRecordedAt: "2026-01-01" }, { ...sample, phone: 123 }, []]) {
        const result = await request("/leads", "POST", input);
        assert.equal(result.status, 400, JSON.stringify(input));
        assert.equal(result.body.success, false);
    }
});

test("reject invalid filters and report missing records", async () => {
    for (const query of ["status=INVALID", "marketingConsent=yes", "page=0", "limit=101", "page=1.2", "source=INVALID", "advisorId=bad", "status=NEW&status=CONTACTED", "unknown=1"]) {
        assert.equal((await request(`/leads?${query}`)).status, 400, query);
    }
    assert.equal((await request("/leads/bad")).status, 400);
    assert.equal((await request("/leads/507f1f77bcf86cd799439099")).status, 404);
    assert.equal((await request("/leads/507f1f77bcf86cd799439099", "PATCH", { name: "Missing" })).status, 404);
});

test("invalid updates do not mutate stored records; health remains available", async () => {
    const created = await request("/leads", "POST", { ...sample, email: "third@example.com" });
    const path = `/leads/${created.body.data._id}`;
    for (const input of [{}, { status: "BAD" }, { marketingConsent: "true" }, { _id: "507f1f77bcf86cd799439099" }, { email: null }]) assert.equal((await request(path, "PATCH", input)).status, 400);
    assert.deepEqual((await request(path)).body.data, created.body.data);
    assert.equal((await request("/health")).status, 200);
});

 test("only active consent withdrawal records an unsubscribe timestamp", async () => {
    const created = await request("/leads", "POST", { ...sample, email: "never@example.com", marketingConsent: false });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.unsubscribedAt, null);
    const path = `/leads/${created.body.data._id}`;
    const never = await request(path, "PATCH", { marketingConsent: false });
    assert.equal(never.body.data.unsubscribedAt, null);
    await request(path, "PATCH", { marketingConsent: true });
    const withdrawn = await request(path, "PATCH", { marketingConsent: false });
    assert.ok(withdrawn.body.data.unsubscribedAt);
    const repeated = await request(path, "PATCH", { marketingConsent: false });
    assert.equal(repeated.body.data.unsubscribedAt, withdrawn.body.data.unsubscribedAt);
    const regranted = await request(path, "PATCH", { marketingConsent: true });
    assert.equal(regranted.body.data.unsubscribedAt, null);
});
