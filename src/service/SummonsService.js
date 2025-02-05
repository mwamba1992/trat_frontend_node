// SummonsService.js

import api from '@/service/Api';

export const SummonsService = {
    getSummons() {
        return api
            .get('/summons')
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error fetching Summons:', error);
                throw error;
            });
    },
    createSummons(data) {
        return api
            .post('/summons', data)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error fetching Summons:', error);
                throw error;
            });
    },
    updateSummons(data) {
        return api.put(`/summons/${data.id}`, data);
    },
    deleteSummons(id) {
        return api.delete(`/summons/${id}`);
    },
    concludeSummon (id, data){
        return api.put(`/summons/${id}/conclude`, data);
    },
    filterSummons(data) {
        return api.post('/summons/filter', data);
    }
};
