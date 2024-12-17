import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secret_name = "SUPABASE_KEY";

const client = new SecretsManagerClient({
  region: "us-east-1",
});

let response;

try {
  response = await client.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
      VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
    })
  );
} catch (error) {
  // For a list of exceptions thrown, see
  // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
  throw error;
}

const supabaseKey = response.SecretString || JSON.parse(process.env.secrets)("supabase_key");

// Initialize Supabase client
const supabase = createClient(
  "https://lzxiyzhookfqphsmrwup.supabase.co",
  supabaseKey
);

// Handle POST requests
export async function POST(req) {
  try {
    const { id, completed, timestamp } = await req.json();

    if (
      typeof id !== 'number' || 
      typeof completed !== 'boolean' || 
      typeof timestamp !== 'string'
    ) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input: id must be a number, completed must be a boolean, and timestamp must be a string.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateFields = { completed };
    if (completed) {
      updateFields.last_completed = timestamp; // Add the timestamp only when completed is true
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateFields)
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Task updated successfully', data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

