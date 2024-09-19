'use server'
import axios from 'axios';
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import https from 'https';

const agent = new https.Agent({  
  rejectUnauthorized: false
});

axios.defaults.httpsAgent = agent;

const getS3 = () => new S3Client({
  region: "us-east-1",  // Change this to match your DigitalOcean Spaces region
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true  // This is important for DigitalOcean Spaces compatibility
});

export async function generateAndGetSignedPdfUrl(formData: any) {
  console.log('s3 access key', process.env.S3_ACCESS_KEY);
  console.log('s3 secret key', process.env.S3_SECRET_KEY);
  console.log('api authorization', process.env.API_AUTHORIZATION);
  const endpoint = 'https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/namespaces/fn-2164fb70-5030-4209-be12-ab2611474d36/actions/factura/render-pdf?blocking=true&result=true';

  try {
    const response = await axios.post(endpoint, {
      data: formData.data,
      company_info: formData.company_info,
      s3_bucket: 'factura-hn',
      template_url: 'https://factura-hn.nyc3.digitaloceanspaces.com/templates/default_template2.html',
      s3_access_key: process.env.S3_ACCESS_KEY,
      s3_secret_key: process.env.S3_SECRET_KEY,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.API_AUTHORIZATION}`,
      },
    });

    console.log("response", response.data);

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = JSON.parse(response.data.body);
    console.log('result', result);

    if (!result.generated_invoices || result.generated_invoices.length === 0) {
      throw new Error('No invoices were generated');
    }

    const s3Url = result.generated_invoices[0].s3_url;
    const url = new URL(s3Url);
    const bucket = url.hostname.split('.')[0];
    const key = result.generated_invoices[0].s3_key

    console.log('bucket', bucket);
    console.log('key', key);
    console.log('url', s3Url);

    // Create S3 client
    const params = {
      Bucket: bucket,
      Key: key
    };

    const command = new GetObjectCommand(params);
    const presignedUrl = await getSignedUrl(getS3(), command, { expiresIn: 3600 * 24 });
    console.log('presignedUrl', presignedUrl);
    return presignedUrl;
  } catch (error) {
    console.error('Error in generateAndGetSignedPdfUrl:', error);
    throw error;
  }
}
 