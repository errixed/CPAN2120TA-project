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

export const CONSULTATION_TYPES = Object.freeze([
    "ONLINE",
    "IN_PERSON",
    "PHONE"
]);