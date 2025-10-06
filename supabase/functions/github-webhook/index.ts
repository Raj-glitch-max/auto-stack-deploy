import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
};

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBytes));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const expectedSignature = `sha256=${hashHex}`;
  
  return signature === expectedSignature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const githubSignature = req.headers.get('x-hub-signature-256');
    const githubEvent = req.headers.get('x-github-event');
    
    const payload = await req.text();
    const webhookSecret = Deno.env.get('GITHUB_WEBHOOK_SECRET');

    // Verify webhook signature
    if (webhookSecret && githubSignature) {
      const isValid = await verifySignature(payload, githubSignature, webhookSecret);
      if (!isValid) {
        console.error('Invalid GitHub webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const data = JSON.parse(payload);

    console.log(`GitHub webhook event: ${githubEvent}`);

    if (githubEvent === 'push') {
      const repoUrl = data.repository.clone_url;
      const branch = data.ref.replace('refs/heads/', '');
      const commitSha = data.after;
      const commitMessage = data.head_commit?.message || 'No commit message';

      console.log(`Push event: ${repoUrl} (${branch}) - ${commitSha}`);

      // Find project by repo URL
      const { data: projects } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('repo_url', repoUrl)
        .eq('repo_branch', branch);

      if (!projects || projects.length === 0) {
        console.log('No matching project found for this repository');
        return new Response(
          JSON.stringify({ message: 'No matching project found' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Trigger deployment for each matching project
      for (const project of projects) {
        // Create deployment record
        const { data: deployment } = await supabaseClient
          .from('deployments')
          .insert({
            project_id: project.id,
            status: 'pending',
            commit_sha: commitSha,
            commit_message: commitMessage,
          })
          .select()
          .single();

        // Log activity
        await supabaseClient
          .from('activity_logs')
          .insert({
            project_id: project.id,
            user_id: project.user_id,
            message: `GitHub push detected: ${commitMessage.substring(0, 100)}`,
            level: 'info',
            metadata: {
              commit_sha: commitSha,
              branch,
              deployment_id: deployment?.id,
            },
          });

        console.log(`Created deployment ${deployment?.id} for project ${project.id}`);

        // Trigger Jenkins build via internal call
        const jenkinsUrl = Deno.env.get('JENKINS_URL');
        const jenkinsUser = Deno.env.get('JENKINS_USER');
        const jenkinsToken = Deno.env.get('JENKINS_API_TOKEN');

        if (jenkinsUrl && jenkinsUser && jenkinsToken && project.jenkins_job_name) {
          const jobName = project.jenkins_job_name;
          const jenkinsApiUrl = `${jenkinsUrl}/job/${jobName}/buildWithParameters`;
          const jenkinsAuth = btoa(`${jenkinsUser}:${jenkinsToken}`);

          const buildParams = new URLSearchParams({
            PROJECT_ID: project.id,
            REPO_URL: repoUrl,
            BRANCH: branch,
            COMMIT_SHA: commitSha,
            DEPLOYMENT_ID: deployment?.id || '',
          });

          try {
            const response = await fetch(`${jenkinsApiUrl}?${buildParams.toString()}`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${jenkinsAuth}`,
              },
            });

            if (response.ok) {
              await supabaseClient
                .from('deployments')
                .update({ status: 'building' })
                .eq('id', deployment?.id);

              console.log(`Triggered Jenkins build for project ${project.id}`);
            }
          } catch (error) {
            console.error('Failed to trigger Jenkins:', error);
          }
        }
      }

      return new Response(
        JSON.stringify({ message: 'Webhook processed', projects: projects.length }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Event received but not processed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in github-webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});