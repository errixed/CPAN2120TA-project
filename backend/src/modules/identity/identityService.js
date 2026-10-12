import {
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual
} from "node:crypto";

import { promisify } from "node:util";
import { identityRepository as repository } from "./identityRepository.js";

const scrypt = promisify(scryptCallback);

export const ROLES = Object.freeze({
    ADMIN: "ADMIN",
    ADVISOR: "ADVISOR",
    MARKETING_SPECIALIST: "MARKETING_SPECIALIST"
});

export const ROLE_RULES = Object.freeze({
    ADMIN: [
        "MANAGE_USERS",
        "MANAGE_PERMISSIONS",
        "MANAGE_PLATFORM"
    ],
    ADVISOR: [
        "MANAGE_OWN_PROFILE",
        "MANAGE_OWN_LEADS",
        "MANAGE_OWN_CAMPAIGNS"
    ],
    MARKETING_SPECIALIST: [
        "MANAGE_ASSIGNED_CAMPAIGNS",
        "MANAGE_PERMITTED_DELIVERIES"
    ]
});

const CONSULTATION_TYPES = [
    "ONLINE",
    "IN_PERSON",
    "PHONE"
];

function httpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function publicUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}

function publicAdvisor(profile) {
    const user = repository.findUserById(profile.userId);

    return {
        ...profile,
        name: user?.name ?? null
    };
}

async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);

    return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
    const [salt, expectedHex] = storedHash.split(":");

    if (!salt || !expectedHex) return false;

    const expected = Buffer.from(expectedHex, "hex");
    if (expected.length !== 64) return false;

    const actual = await scrypt(password, salt, 64);

    return timingSafeEqual(actual, expected);
}

function validateProfile(profile) {
    if (profile === undefined) return {};

    if (!profile || typeof profile !== "object" ||
        Array.isArray(profile)) {
        throw httpError(400, "Profile must be an object.");
    }

    const result = {};

    if (profile.specialties !== undefined) {
        if (!Array.isArray(profile.specialties) ||
            !profile.specialties.every(item =>
                typeof item === "string" &&
                item.trim().length > 0
            )) {
            throw httpError(400, "Invalid specialties.");
        }

        result.specialties =
            profile.specialties.map(item => item.trim());
    }

    if (profile.consultationTypes !== undefined) {
        if (!Array.isArray(profile.consultationTypes) ||
            !profile.consultationTypes.every(type =>
                CONSULTATION_TYPES.includes(type)
            )) {
            throw httpError(400, "Invalid consultation types.");
        }

        result.consultationTypes =
            profile.consultationTypes;
    }

    if (profile.bio !== undefined) {
        if (typeof profile.bio !== "string" ||
            profile.bio.length > 1000) {
            throw httpError(400, "Invalid biography.");
        }

        result.bio = profile.bio.trim();
    }

    if (profile.isPublic !== undefined) {
        if (typeof profile.isPublic !== "boolean") {
            throw httpError(400, "isPublic must be a boolean.");
        }

        result.isPublic = profile.isPublic;
    }

    return result;
}

export const identityService = {
    async register(data = {}) {
        const { name, email, password, role, profile } = data;

        if (typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100) {
            throw httpError(400, "Invalid name.");
        }

        if (typeof email !== "string" ||
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw httpError(400, "Invalid email address.");
        }

        if (typeof password !== "string" ||
            password.length < 8) {
            throw httpError(
                400,
                "Password must contain at least 8 characters."
            );
        }

        if (![ROLES.ADVISOR, ROLES.MARKETING_SPECIALIST]
            .includes(role)) {
            throw httpError(400, "Invalid registration role.");
        }

        if (role !== ROLES.ADVISOR &&
            profile !== undefined) {
            throw httpError(
                400,
                "Only advisors can create advisor profiles."
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (repository.findUserByEmail(normalizedEmail)) {
            throw httpError(409, "Email already registered.");
        }

        const validatedProfile =
            role === ROLES.ADVISOR
                ? validateProfile(profile)
                : null;

        const passwordHash = await hashPassword(password);

        const user = repository.createUser({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role
        });

        let advisorProfile = null;

        if (role === ROLES.ADVISOR) {
            advisorProfile = repository.createAdvisorProfile({
                userId: user.id,
                specialties: [],
                consultationTypes: [],
                bio: "",
                isPublic: false,
                ...validatedProfile
            });
        }

        return {
            user: publicUser(user),
            advisorProfile
        };
    },

    async login(data = {}) {
        const { email, password } = data;

        if (typeof email !== "string" ||
            typeof password !== "string") {
            throw httpError(400, "Email and password are required.");
        }

        const user = repository.findUserByEmail(
            email.trim().toLowerCase()
        );

        if (!user) {
            throw httpError(401, "Invalid email or password.");
        }

        const valid = await verifyPassword(
            password,
            user.passwordHash
        );

        if (!valid || !user.isActive) {
            throw httpError(401, "Invalid email or password.");
        }

        return {
            user: publicUser(user),
            authentication: "PHASE_I_DEMO_NO_TOKEN"
        };
    },

    listAdvisors() {
        return repository.findAllPublicAdvisors()
            .map(publicAdvisor);
    },

    getAdvisor(id) {
        const profile = repository.findAdvisorById(id);

        if (!profile || !profile.isPublic) {
            throw httpError(404, "Advisor not found.");
        }

        return publicAdvisor(profile);
    }
};