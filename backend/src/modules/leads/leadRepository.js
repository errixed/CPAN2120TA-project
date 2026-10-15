// Phase I storage. Replace these methods with database queries in Phase II.
const records = new Map();
const copy = value => structuredClone(value);

export default {
    create(record) {
        records.set(record._id, copy(record));
        return copy(record);
    },
    findAll() {
        return [...records.values()].map(copy);
    },
    findById(id) {
        return records.has(id) ? copy(records.get(id)) : null;
    },
    update(id, record) {
        if (!records.has(id)) return null;
        records.set(id, copy(record));
        return copy(record);
    }
};
