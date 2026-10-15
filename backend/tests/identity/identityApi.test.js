import test from "node:test";
import assert from "node:assert/strict";
import app from "../../src/app.js";

const server = app.listen(0);

const PORT = server.address().port;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

test.after(() => {
    server.close();
});

async function request(method, endpoint, body) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json"
        },
        body: body === undefined
            ? undefined
            : JSON.stringify(body)
    });

    return {
        status: response.status,
        body: await response.json()
    };
}

const email = `advisor-${Date.now()}@example.com`;

let advisorId;

test("Health endpoint returns 200", async () => {
    const result = await request("GET", "/health");

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.status, "OK");
});

test("Register advisor successfully", async () => {
    const result = await request("POST", "/auth/register", {
        name: "John Smith",
        email,
        password: "password123",
        role: "ADVISOR",
        profile: {
            specialties: ["Retirement Planning"],
            consultationTypes: ["ONLINE"],
            bio: "Financial advisor",
            isPublic: true
        }
    });

    assert.equal(result.status, 201);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.user.role, "ADVISOR");

    advisorId = result.body.data.advisorProfile.id;

    assert.ok(advisorId);
    assert.match(advisorId, /^[a-f0-9]{24}$/i);

    assert.equal(
        result.body.data.user.passwordHash,
        undefined
    );
});

test("Reject duplicate email registration", async () => {
    const result = await request("POST", "/auth/register", {
        name: "Another User",
        email,
        password: "password123",
        role: "ADVISOR"
    });

    assert.equal(result.status, 409);
    assert.equal(result.body.success, false);
});

test("Reject invalid email", async () => {
    const result = await request("POST", "/auth/register", {
        name: "Invalid User",
        email: "invalid-email",
        password: "password123",
        role: "ADVISOR"
    });

    assert.equal(result.status, 400);
});

test("Login with correct credentials", async () => {
    const result = await request("POST", "/auth/login", {
        email,
        password: "password123"
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(
        result.body.data.authentication,
        "PHASE_I_DEMO_NO_TOKEN"
    );
});

test("Reject incorrect password", async () => {
    const result = await request("POST", "/auth/login", {
        email,
        password: "wrongpassword"
    });

    assert.equal(result.status, 401);
});

test("List public advisors", async () => {
    const result = await request("GET", "/advisors");

    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body.data));

    const advisor = result.body.data.find(
        item => item.id === advisorId
    );

    assert.ok(advisor);
    assert.equal(advisor.name, "John Smith");
});

test("Get advisor by ID", async () => {
    const result = await request(
        "GET",
        `/advisors/${advisorId}`
    );

    assert.equal(result.status, 200);
    assert.equal(result.body.data.id, advisorId);
    assert.equal(result.body.data.name, "John Smith");
});

test("Update advisor profile", async () => {
    const result = await request(
        "PATCH",
        `/advisors/${advisorId}`,
        {
            specialties: [
                "Investment Planning",
                "Retirement Planning"
            ],
            consultationTypes: ["ONLINE", "PHONE"],
            bio: "Updated financial advisor biography."
        }
    );

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);

    assert.deepEqual(
        result.body.data.specialties,
        ["Investment Planning", "Retirement Planning"]
    );

    assert.equal(
        result.body.data.bio,
        "Updated financial advisor biography."
    );
});

test("Retrieve updated advisor profile", async () => {
    const result = await request(
        "GET",
        `/advisors/${advisorId}`
    );

    assert.equal(result.status, 200);
    assert.equal(
        result.body.data.bio,
        "Updated financial advisor biography."
    );
});

test("Reject invalid consultation type", async () => {
    const result = await request(
        "PATCH",
        `/advisors/${advisorId}`,
        {
            consultationTypes: ["VIDEO_CALL"]
        }
    );

    assert.equal(result.status, 400);
});

test("Reject modification of advisor ID", async () => {
    const result = await request(
        "PATCH",
        `/advisors/${advisorId}`,
        {
            userId: "unauthorized-change"
        }
    );

    assert.equal(result.status, 400);
});

test("Reject empty update request", async () => {
    const result = await request(
        "PATCH",
        `/advisors/${advisorId}`,
        {}
    );

    assert.equal(result.status, 400);
});

test("Return 404 for nonexistent advisor", async () => {
    const result = await request(
        "GET",
        "/advisors/507f1f77bcf86cd799439011"
    );

    assert.equal(result.status, 404);
});