import { randomUUID } from "node:crypto";

const users = [];
const advisorProfiles = [];

export const identityRepository = {
    createUser(data) {
        const user = {
            id: randomUUID(),
            ...data,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        users.push(user);
        return user;
    },

    findUserByEmail(email) {
        return users.find(
            user => user.email === email
        ) ?? null;
    },

    findUserById(id) {
        return users.find(
            user => user.id === id
        ) ?? null;
    },

    createAdvisorProfile(data) {
        const profile = {
            id: randomUUID(),
            ...data,
            createdAt: new Date().toISOString()
        };

        advisorProfiles.push(profile);
        return profile;
    },

    findAllPublicAdvisors() {
        return advisorProfiles.filter(
            profile => profile.isPublic === true
        );
    },

    findAdvisorById(id) {
        return advisorProfiles.find(
            profile => profile.id === id
        ) ?? null;
    },

    updateAdvisorProfile(id, changes) {
        const profile = this.findAdvisorById(id);

        if (!profile) return null;

        Object.assign(profile, changes, {
            updatedAt: new Date().toISOString()
        });

        return profile;
    }
};