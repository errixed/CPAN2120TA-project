import AppError from "../../utils/AppError.js";

function advisorIdFromRequest(req, { allowBody = false } = {}) {
    const advisorId = req.user?.advisorId ??
        req.advisorId ??
        req.query.advisorId ??
        (allowBody ? req.body?.advisorId : undefined);

    if (!advisorId) {
        throw new AppError("advisorId is required.", 400, "ADVISOR_ID_REQUIRED");
    }

    return advisorId;
}

function sendData(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}

export function createCampaignController(service) {
    return {
        createCampaign: async (req, res) => sendData(
            res,
            await service.createCampaign({
                ...req.body,
                advisorId: advisorIdFromRequest(req, { allowBody: true })
            }),
            201
        ),

        listCampaigns: async (req, res) => sendData(
            res,
            await service.listCampaigns({
                advisorId: advisorIdFromRequest(req),
                status: req.query.status
            })
        ),

        getCampaign: async (req, res) => sendData(
            res,
            await service.getCampaign({
                advisorId: advisorIdFromRequest(req),
                campaignId: req.params.campaignId
            })
        ),

        updateCampaign: async (req, res) => sendData(
            res,
            await service.updateCampaign({
                advisorId: advisorIdFromRequest(req),
                campaignId: req.params.campaignId,
                payload: req.body
            })
        ),

        getAudience: async (req, res) => sendData(
            res,
            await service.getAudience({
                advisorId: advisorIdFromRequest(req),
                campaignId: req.params.campaignId
            })
        ),

        createTemplate: async (req, res) => sendData(
            res,
            await service.createTemplate({
                ...req.body,
                advisorId: advisorIdFromRequest(req, { allowBody: true })
            }),
            201
        ),

        listTemplates: async (req, res) => sendData(
            res,
            await service.listTemplates({
                advisorId: advisorIdFromRequest(req),
                channel: req.query.channel
            })
        ),

        getTemplate: async (req, res) => sendData(
            res,
            await service.getTemplate({
                advisorId: advisorIdFromRequest(req),
                templateId: req.params.templateId
            })
        )
    };
}

export default createCampaignController;