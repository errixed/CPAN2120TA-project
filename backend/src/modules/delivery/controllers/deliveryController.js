import * as deliveryService from '../services/deliveryService.js';

export const queueDelivery = async (req, res, next) => {
    try {
        // pull required data from POST request body and pass it onto the service layer, responding with a 201 HTTP status code.
        const job = await deliveryService.queueDelivery(req.body);
        res.status(201).json({
            success: true,
            data: job
        });
    } catch (error) {
        next(error);
    }
};

export const getDeliveryHistory = async (req, res, next) => {
    try {
        // check the URL of GET request for any search filter, pass any to the service layer along with a response with a 200 HTTP status code as well as a list of jobs.
        const filters = req.query;
        const jobs = await deliveryService.getDeliveryHistory(filters);
        res.status(200).json({
            success: true,
            data: jobs
        });
    } catch (error) {
        next(error)
    }
};

export const processDelivery = async (req, res, next) => {
    try {
        const job = await deliveryService.processDelivery(req.params.id);

        res.status(200).json({
            success: true,
            data: job
        });
    } catch (error) {
        next(error);
    }
};