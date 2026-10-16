import test from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";

import * as repo from "../../src/modules/delivery/repositories/deliveryRepository.js";
import { processDelivery } from "../../src/modules/delivery/services/deliveryService.js";

const id = () => new Types.ObjectId().toString();

function makeJob(overrides = {}) {
    return {
        advisorId: id(),
        campaignId: id(),
        channel: "FACEBOOK",
        content: {
            subject: "",
            body: "Phase I mock marketing post"
        },
        ...overrides
    };
}

test("Delivery: creates a PENDING simulated job", async () => {
    const job = await repo.createDeliveryJob(makeJob());

    assert.match(job._id, /^[a-f0-9]{24}$/);
    assert.equal(job.deliveryStatus, "PENDING");
    assert.equal(job.simulated, true);
    assert.equal(job.attempts, 0);
});

test("Delivery: generates unique job IDs", async () => {
    const a = await repo.createDeliveryJob(makeJob());
    const b = await repo.createDeliveryJob(makeJob());

    assert.notEqual(a._id, b._id);
});

test("Delivery: rejects an identical pending job", async () => {
    const data = makeJob();

    await repo.createDeliveryJob(data);

    await assert.rejects(
        () => repo.createDeliveryJob(data),
        { statusCode: 409, code: "DUPLICATE_DELIVERY" }
    );
});

test("Delivery: prevents changes to protected fields", async () => {
    const job = await repo.createDeliveryJob(makeJob());

    const updated = await repo.updateDeliveryJob(job._id, {
        _id: id(),
        advisorId: id(),
        campaignId: id(),
        createdAt: new Date(0),
        deliveryStatus: "PROCESSING"
    });

    assert.equal(updated._id, job._id);
    assert.equal(String(updated.advisorId), String(job.advisorId));
    assert.equal(String(updated.campaignId), String(job.campaignId));
    assert.deepEqual(updated.createdAt, job.createdAt);
    assert.equal(updated.deliveryStatus, "PROCESSING");
});

test("Delivery: rejects an invalid status transition", async () => {
    const job = await repo.createDeliveryJob(makeJob());

    await assert.rejects(
        () => repo.updateDeliveryJob(job._id, {
            deliveryStatus: "SENT"
        }),
        { statusCode: 409, code: "INVALID_STATUS_TRANSITION" }
    );
});

test("Delivery: allows PENDING to PROCESSING to SENT", async () => {
    const job = await repo.createDeliveryJob(makeJob());

    const processing = await repo.updateDeliveryJob(job._id, {
        deliveryStatus: "PROCESSING"
    });

    assert.equal(processing.deliveryStatus, "PROCESSING");

    const sent = await repo.updateDeliveryJob(job._id, {
        deliveryStatus: "SENT"
    });

    assert.equal(sent.deliveryStatus, "SENT");
});

test("Delivery: only one claim succeeds", async () => {
    const job = await repo.createDeliveryJob(makeJob());

    const [first, second] = await Promise.all([
        repo.claimDeliveryJob(job._id),
        repo.claimDeliveryJob(job._id)
    ]);

    assert.equal([first, second].filter(Boolean).length, 1);
    assert.equal(first?.deliveryStatus, "PROCESSING");
});

test("Delivery: missing job cannot be processed", async () => {
    await assert.rejects(
        () => processDelivery(id()),
        { statusCode: 404, code: "DELIVERY_NOT_FOUND" }
    );
});

test("Delivery: filters jobs by campaign ID", async () => {
    const campaignId = id();

    const job = await repo.createDeliveryJob(
        makeJob({ campaignId })
    );

    const jobs = await repo.getDeliveryJobs({ campaignId });

    assert.ok(jobs.some(item => item._id === job._id));
    assert.ok(jobs.every(
        item => String(item.campaignId) === campaignId
    ));
});
