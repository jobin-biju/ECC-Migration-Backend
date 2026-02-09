
require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    sapRfc: {
        ashost: process.env.SAP_ASHOST || '',
        sysnr: process.env.SAP_SYSNR || '00',
        client: process.env.SAP_CLIENT || '100',
        user: process.env.SAP_USER || '',
        passwd: process.env.SAP_PASSWD || '',
        lang: process.env.SAP_LANG || 'EN'
    },
    sapOdata: {
        baseUrl: process.env.SAP_SERVICE_URL || '',
        auth: {
            username: process.env.SAP_SERVICE_USER || '',
            password: process.env.SAP_SERVICE_PASSWD || ''
        },
        proxy: {
            host: process.env.PROXY_HOST || '',
            port: process.env.PROXY_PORT || '',
            auth: {
                username: process.env.PROXY_USER || '',
                password: process.env.PROXY_PASSWORD || ''
            }
        }
    }
};
