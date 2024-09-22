

import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });
axios.defaults.httpsAgent = agent;

export async function renderPdf(formData: any) {
  const endpoint = 'https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/namespaces/fn-cffa2d1a-50d3-459a-aadf-c409263325f1/actions/factura/render-pdf?blocking=true&result=true';

  try {
    const response = await axios.post(endpoint, {
      data: formData.data,
      company_info: formData.company_info,
      s3_bucket: 'factura-hn',
      template_url: 'https://factura-hn.nyc3.digitaloceanspaces.com/templates/default_template2.html',
      s3_access_key: process.env.NEXT_PUBLIC_S3_ACCESS_KEY,
      s3_secret_key: process.env.NEXT_PUBLIC_S3_SECRET_KEY,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.NEXT_PUBLIC_API_AUTHORIZATION}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = JSON.parse(response.data.body);

    if (!result.generated_invoices || result.generated_invoices.length === 0) {
      throw new Error('No invoices were generated');
    }

    const s3Url = result.generated_invoices[0].s3_url;
    const key = result.generated_invoices[0].s3_key;

    return {
      s3_url: s3Url,
      s3_key: key
    };
  } catch (error) {
    console.error('Error in renderPdf:', error);
    throw error;
  }
}

export async function getSignedPdfUrl(s3Data: { s3_url: string, s3_key: string }) {
  const endpoint = 'https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/namespaces/fn-cffa2d1a-50d3-459a-aadf-c409263325f1/actions/factura/signed-url?blocking=true&result=true';

  try {
    const response = await axios.post(endpoint, s3Data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.NEXT_PUBLIC_API_AUTHORIZATION}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.data.body; // This should be the presigned URL
  } catch (error) {
    console.error('Error in getSignedPdfUrl:', error);
    throw error;
  }
}
