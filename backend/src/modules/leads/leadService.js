import Lead from "./models/Lead.js";
import repository from "./leadRepository.js";
import { identityRepository } from "../identity/identityRepository.js";

const fields = ["advisorId", "name", "email", "phone", "interest", "status", "marketingConsent", "source", "notes"];
const statuses = Lead.schema.path("status").enumValues;
const sources = Lead.schema.path("source").enumValues;

function fail(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
}

function requireUniqueEmail(advisorId, email, excludeId = null) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedAdvisorId = String(advisorId).toLowerCase();

    const duplicate = repository.findAll().some(lead =>
        String(lead.advisorId).toLowerCase() === normalizedAdvisorId &&
        lead.email.trim().toLowerCase() === normalizedEmail &&
        String(lead._id) !== String(excludeId)
    );

    if (duplicate) {
        fail("A lead with this email already exists for this advisor.", 409);
    }
}

function validateInput(input, partial = false) {
    if (!input || typeof input !== "object" || Array.isArray(input)) fail("Body must be a JSON object.");
    const keys = Object.keys(input);
    if (partial && !keys.length) fail("Provide at least one field to update.");
    for (const key of keys) {
        if (!fields.includes(key)) fail(`Unsupported field: ${key}.`);
        if (key === "marketingConsent") {
            if (typeof input[key] !== "boolean") fail("marketingConsent must be a JSON boolean.");
        } else if (typeof input[key] !== "string") {
            fail(`${key} must be a string.`);
        }
    }
    if (input.advisorId !== undefined && !/^[a-f0-9]{24}$/i.test(input.advisorId)) fail("advisorId must be a 24-character ObjectId.");
    if (input.status !== undefined && !statuses.includes(input.status)) fail(`status must be one of: ${statuses.join(", ")}.`);
}

function validateDocument(document) {
    const error = document.validateSync();
    if (error) fail(Object.values(error.errors).map(item => item.message).join(" "));
    return JSON.parse(JSON.stringify(document.toObject()));
}

function find(id) {
    if (!/^[a-f0-9]{24}$/i.test(id)) fail("Lead id must be a 24-character ObjectId.");
    const lead = repository.findById(id.toLowerCase());
    if (!lead) fail("Lead not found.", 404);
    return lead;
}

function requireExistingAdvisor(advisorId) {
    if (!advisorId) {
        fail("advisorId is required.");
    }

    if (!/^[a-f0-9]{24}$/i.test(advisorId)) {
        fail("advisorId must be a 24-character ObjectId.");
    }

    const advisor = identityRepository.findAdvisorById(
        advisorId.toLowerCase()
    );

    if (!advisor) {
        fail("Advisor not found.", 404);
    }

    return advisor;
}

function recordConsent(document, input, now, previouslyConsented = false) {
    if (input.marketingConsent === true) {
        if (!previouslyConsented) {
            document.consentRecordedAt = now;
        }

        document.unsubscribedAt = null;
    } else if (input.marketingConsent === false && previouslyConsented) {
        document.unsubscribedAt = now;
    }
}

export function createLead(input) {
    validateInput(input);
    requireExistingAdvisor(input.advisorId);
    const now = new Date();
    const document = new Lead({ ...input, createdAt: now, updatedAt: now });
    recordConsent(document, input, now);
    const validated = validateDocument(document);
    requireUniqueEmail(validated.advisorId, validated.email);
    return repository.create(validated);
}

export function getLead(id) { return find(id); }

export function updateLead(id, input) {
    const existing = find(id);
    validateInput(input, true);
    if (
        input.advisorId !== undefined &&
        input.advisorId.toLowerCase() !== existing.advisorId.toLowerCase()
    ) {
        fail("A lead cannot be reassigned to another advisor.");
    }
    const now = new Date();
    const document = new Lead({ ...existing, ...input, updatedAt: now });
    recordConsent(document, input, now, existing.marketingConsent);

    const validated = validateDocument(document);

    requireUniqueEmail(
        validated.advisorId,
        validated.email,
        existing._id
    );

    return repository.update(existing._id, validated);
}

export function listLeads(query) {
    const allowed = ["advisorId", "status", "marketingConsent", "source", "interest", "search", "page", "limit"];
    for (const [key, value] of Object.entries(query)) {
        if (!allowed.includes(key)) fail(`Unsupported filter: ${key}.`);
        if (typeof value !== "string") fail(`${key} must be a single string value.`);
    }
    if (query.status && !statuses.includes(query.status)) fail("Invalid status filter.");
    if (query.source && !sources.includes(query.source)) fail("Invalid source filter.");
    if (query.advisorId && !/^[a-f0-9]{24}$/i.test(query.advisorId)) fail("Invalid advisorId filter.");
    if (query.marketingConsent !== undefined && !["true", "false"].includes(query.marketingConsent)) fail("marketingConsent filter must be true or false.");
    const integer = (key, fallback, max) => {
        if (query[key] === undefined) return fallback;
        if (!/^[1-9]\d*$/.test(query[key])) fail(`${key} must be a positive integer.`);
        const value = Number(query[key]);
        if (!Number.isSafeInteger(value) || value > max) fail(`${key} exceeds the allowed maximum ${max}.`);
        return value;
    };
    const page = integer("page", 1, 1000000);
    const limit = integer("limit", 20, 100);
    let leads = repository.findAll();
    if (query.advisorId) leads = leads.filter(x => x.advisorId === query.advisorId.toLowerCase());
    if (query.status) leads = leads.filter(x => x.status === query.status);
    if (query.source) leads = leads.filter(x => x.source === query.source);
    if (query.marketingConsent !== undefined) leads = leads.filter(x => x.marketingConsent === (query.marketingConsent === "true"));
    if (query.interest) {
        const interest = query.interest.toLowerCase();

        leads = leads.filter(lead =>
            typeof lead.interest === "string" &&
            lead.interest.toLowerCase().includes(interest)
        );
    }
    if (query.search) leads = leads.filter(x => `${x.name} ${x.email}`.toLowerCase().includes(query.search.toLowerCase()));
    return { data: leads.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: leads.length, totalPages: Math.ceil(leads.length / limit) } };
}
