import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";

import { identityService } from "../../src/modules/identity/identityService.js";
import {
    createRule,
    listRules,
    simulateEvent,
    listEvents,
    getAnalyticsSummary
} from "../../src/modules/automation/automationService.js";

const id = () => new Types.ObjectId().toString();

async function makeUser() {
    const result = await identityService.register({
        name: "Automation Test User",
        email: `automation-${randomUUID()}@example.com`,
        password: "TestPassword123!",
        role: "MARKETING_SPECIALIST"
    });

    return result.user;
}

test("Automation: creates a rule for an existing user", async () => {
    const user = await makeUser();

    const rule = await createRule({
        ownerId: user.id,
        name: "Welcome new test leads",
        trigger: "LEAD_CREATED",
        action: "SEND_EMAIL",
        enabled: true
    });

    assert.match(String(rule._id), /^[a-f0-9]{24}$/);
    assert.equal(rule.ownerId, user.id);
    assert.equal(rule.trigger, "LEAD_CREATED");
    assert.equal(rule.enabled, true);
});

test("Automation: rejects nonexistent owner", async () => {
    await assert.rejects(
        () => createRule({
            ownerId: id(),
            name: "Invalid owner test",
            trigger: "LEAD_CREATED",
            action: "SEND_EMAIL"
        }),
        { statusCode: 400 }
    );
});

test("Automation: rejects unsupported trigger", async () => {
    const user = await makeUser();

    await assert.rejects(
        () => createRule({
            ownerId: user.id,
            name: "Invalid trigger test",
            trigger: "SOMETHING_UNKNOWN",
            action: "SEND_EMAIL"
        }),
        { statusCode: 400 }
    );
});

test("Automation: rejects invalid delay", async () => {
    const user = await makeUser();

    await assert.rejects(
        () => createRule({
            ownerId: user.id,
            name: "Invalid delay test",
            trigger: "LEAD_CREATED",
            action: "SCHEDULE_FOLLOW_UP",
            delayMinutes: -5
        }),
        { statusCode: 400 }
    );
});

test("Automation: lists rules filtered by owner", async () => {
    const user = await makeUser();

    const created = await createRule({
        ownerId: user.id,
        name: "Filter test rule",
        trigger: "LEAD_CREATED",
        action: "CREATE_NOTIFICATION"
    });

    const rules = await listRules({ ownerId: user.id });

    assert.ok(rules.some(
        rule => String(rule._id) === String(created._id)
    ));

    assert.ok(rules.every(rule => rule.ownerId === user.id));
});

test("Automation: simulates an event", async () => {
    const user = await makeUser();

    const result = await simulateEvent({
        eventId: `test-${randomUUID()}`,
        eventType: "LEAD_CREATED",
        entityType: "LEAD",
        entityId: id(),
        ownerId: user.id
    });

    assert.equal(result.event.eventType, "LEAD_CREATED");
    assert.ok(Array.isArray(result.simulatedActions));
});

test("Automation: rejects duplicate event IDs", async () => {
    const user = await makeUser();

    const payload = {
        eventId: `unique-${randomUUID()}`,
        eventType: "LEAD_CREATED",
        entityType: "LEAD",
        entityId: id(),
        ownerId: user.id
    };

    await simulateEvent(payload);

    await assert.rejects(
        () => simulateEvent(payload),
        { statusCode: 409 }
    );
});

test("Automation: analytics summary reports rules and events", async () => {
    const summary = await getAnalyticsSummary();

    assert.ok(summary.rules);
    assert.ok(summary.events);
    assert.equal(typeof summary.rules.total, "number");
    assert.equal(typeof summary.events.total, "number");
});

test("Automation: event history returns recorded events", async () => {
    const user = await makeUser();

    const eventId = `history-${randomUUID()}`;

    await simulateEvent({
        eventId,
        eventType: "LEAD_CREATED",
        entityType: "LEAD",
        entityId: id(),
        ownerId: user.id
    });

    const events = await listEvents({ ownerId: user.id });

    assert.ok(events.some(event => event.eventId === eventId));
});
