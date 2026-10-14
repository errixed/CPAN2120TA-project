import * as deliveryRepo from '../repositories/delivery.repository.js';

export const queueDelivery = async (deliveryData) => {
    // intake request data and forward it to create a new record. currently default to "PENDING" status.
    const job = await deliveryRepo.createDeliveryJob(deliveryData);

    // temporarily generate fake "success" ID string to pretend for a external platform connection.
    const mockProviderMessageId = `mock-${job.channel.toLowerCase()}-${Date.now()}`;

    // update the job to change its status yo "SENT" and add a fake Success ID, to fake a delivery cycle
    const updatedJob = await deliveryRepo.updateDeliveryJob(job._id, {
        deliveryStatus: 'SENT',
        sentAt: new Date(),
        providerMessageId: mockProviderMessageId
    });

    return updatedJob;
};

export const getDeliveryHistory = async (filters = {}) => {
    return await deliveryRepo.getDeliveryJobs(filters);
};