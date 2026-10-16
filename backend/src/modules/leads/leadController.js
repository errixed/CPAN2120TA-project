import * as service from "./leadService.js";

export function create(req, res) {
    return res.status(201).json({ success: true, data: service.createLead(req.body) });
}
export function list(req, res) {
    return res.json({ success: true, ...service.listLeads(req.query) });
}
export function get(req, res) {
    return res.json({ success: true, data: service.getLead(req.params.id) });
}
export function update(req, res) {
    return res.json({ success: true, data: service.updateLead(req.params.id, req.body) });
}
