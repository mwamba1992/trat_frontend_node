// services/SetupService.js
import api from '@/service/Api';

const API_BASE = '/common-setup';

export const SetupService = {
    async getSetups(type) {
        return api.get(`${API_BASE}/type/${type}`).then((res) => res.data);
    },
    postSetupData(type, data) {
        return api.post(`${API_BASE}/${type}`, data).then((res) => res.data);
    },
    editSetupData(type, data) {
        return api.patch(`${API_BASE}/${type}/${data.id}`, data).then((res) => res.data);
    },
    deleteSetup(type, id) {
        return api.delete(`${API_BASE}/${type}/${id}`).then((res) => res.data);
    },
};
