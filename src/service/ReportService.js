import api from '@/service/Api';

const REPORTS_URL = '/reports';

export const ReportService = {
    /**
     * Generate a report and return blob + filename
     * @param {string} endpoint - Report endpoint path
     * @param {Object} filters - Report filter parameters
     * @returns {Promise<{blob: Blob, filename: string, format: string}>}
     */
    async generateReport(endpoint, filters) {
        const response = await api.post(`${REPORTS_URL}/${endpoint}`, filters, {
            responseType: 'blob',
            timeout: 60000
        });

        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition?.match(/filename="?(.+?)"?$/)?.[1] || `report.${filters.format === 'EXCEL' ? 'xlsx' : 'pdf'}`;
        const blob = new Blob([response.data], {
            type: filters.format === 'EXCEL' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
        });

        return { blob, filename, format: filters.format };
    },

    /**
     * Trigger browser download for a blob
     */
    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
