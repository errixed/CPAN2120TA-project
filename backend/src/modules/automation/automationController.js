import * as automationService from "./automationService.js";

// Controllers read the request and shape the response.
// Errors are passed to the shared errorHandler middleware.

export const createAutomation = async (req, res, next) => {
    try {
        const rule = await automationService.createRule(req.body);
        return res.status(201).json({ success: true, data: rule });
    } catch (error) {
        return next(error);
    }
};

export const listAutomations = async (req, res, next) => {
    try {
        const rules = await automationService.listRules(req.query);
        return res.status(200).json({
            success: true,
            count: rules.length,
            data: rules
        });
    } catch (error) {
        return next(error);
    }
};

export const simulateEvent = async (req, res, next) => {
    try {
        const result = await automationService.simulateEvent(req.body);
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        return next(error);
    }
};

export const listEvents = async (req, res, next) => {
    try {
        const events = await automationService.listEvents(req.query);
        return res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        return next(error);
    }
};

export const getAnalyticsSummary = async (req, res, next) => {
    try {
        const summary = await automationService.getAnalyticsSummary();
        return res.status(200).json({ success: true, data: summary });
    } catch (error) {
        return next(error);
    }
};
