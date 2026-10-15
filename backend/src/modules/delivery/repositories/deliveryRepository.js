// temporary bucket to hold onto data while still in phase 1.
let mockDeliveryJobs = [];

export const createDeliveryJob = async (jobData) => {
    const newJob = {
        // unique id generator using milliseconds as a temporary solution.
        _id: Date.now().toString(), 
        ...jobData,
        deliveryStatus: jobData.deliveryStatus || 'PENDING',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    mockDeliveryJobs.push(newJob);
    return newJob;
};

export const getDeliveryJobs = async (filters = {}) => {
    let results = mockDeliveryJobs;
    
    // allow GET to search for specific jobs, ensuring correct processing of queries when testing Postman independently
    if (filters.campaignId) {
        results = results.filter(job => String(job.campaignId) === String(filters.campaignId));
    }
    if (filters.deliveryStatus) {
        results = results.filter(job => job.deliveryStatus === filters.deliveryStatus);
    }
    
    return results;
};

export const updateDeliveryJob = async (id, updateData) => {
    const jobIndex = mockDeliveryJobs.findIndex(job => String(job._id) === String(id));
    if (jobIndex === -1) return null;

    mockDeliveryJobs[jobIndex] = {
        ...mockDeliveryJobs[jobIndex],
        ...updateData,
        updatedAt: new Date()
    };
    
    return mockDeliveryJobs[jobIndex];
};