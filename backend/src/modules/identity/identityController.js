import { identityService } from "./identityService.js";

export const identityController = {
    async register(req, res) {
        const result = await identityService.register(req.body);

        return res.status(201).json({
            success: true,
            data: result
        });
    },

    async login(req, res) {
        const result = await identityService.login(req.body);

        return res.status(200).json({
            success: true,
            data: result
        });
    },

    listAdvisors(req, res) {
        const advisors = identityService.listAdvisors();

        return res.status(200).json({
            success: true,
            count: advisors.length,
            data: advisors
        });
    },

    getAdvisor(req, res) {
        const advisor = identityService.getAdvisor(req.params.id);

        return res.status(200).json({
            success: true,
            data: advisor
        });
    },

    updateAdvisorProfile(req, res) {
    const advisor = identityService.updateAdvisorProfile(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        data: advisor
    });
}
};