import { createClient } from '@supabase/supabase-js';
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  console.log("loading env");
  require('dotenv').config();
  console.log(process.env.SUPABASE_KEY);
}

async function getSecretValue(secretName) {
  if (process.env.NODE_ENV !== 'development') {
    try {
      const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
      return data.SecretString ? JSON.parse(data.SecretString) : null;
    } catch (err) {
      console.error('Error fetching secret:', err);
      throw err;
    }
  } else {
    // Return local secret value from .env
    return process.env.SUPABASE_KEY;
  }
}

const supabaseKey = await getSecretValue('supabase_key');

console.log(`Supabase Key: ${supabaseKey}`);

// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  supabaseKey
);
// Handle GET requests
export async function GET(req) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

