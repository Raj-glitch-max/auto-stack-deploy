import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { projectId, repoBranch = 'main' } = await req.json();

    // Fetch project details
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Get Jenkins credentials from secrets
    const jenkinsUrl = Deno.env.get('JENKINS_URL');
    const jenkinsUser = Deno.env.get('JENKINS_USER');
    const jenkinsToken = Deno.env.get('JENKINS_API_TOKEN');

    if (!jenkinsUrl || !jenkinsUser || !jenkinsToken) {
      throw new Error('Jenkins credentials not configured');
    }

    // Create deployment record
    const { data: deployment, error: deploymentError } = await supabaseClient
      .from('deployments')
      .insert({
        project_id: projectId,
        status: 'pending',
        commit_sha: null,
        commit_message: 'Manual trigger',
      })
      .select()
      .single();

    if (deploymentError) {
      throw new Error('Failed to create deployment record');
    }

    // Trigger Jenkins job
    const jobName = project.jenkins_job_name || 'autostack-deploy';
    const jenkinsApiUrl = `${jenkinsUrl}/job/${jobName}/buildWithParameters`;
    
    const jenkinsAuth = btoa(`${jenkinsUser}:${jenkinsToken}`);
    
    const buildParams = new URLSearchParams({
      PROJECT_ID: projectId,
      REPO_URL: project.repo_url || '',
      BRANCH: repoBranch,
      ECR_REPOSITORY: project.ecr_repository || '',
      ECS_CLUSTER: project.ecs_cluster_name || '',
      ECS_SERVICE: project.ecs_service_name || '',
      DEPLOYMENT_ID: deployment.id,
    });

    console.log(`Triggering Jenkins job: ${jenkinsApiUrl}`);

    const response = await fetch(`${jenkinsApiUrl}?${buildParams.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${jenkinsAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jenkins API error:', errorText);
      
      // Update deployment with error
      await supabaseClient
        .from('deployments')
        .update({
          status: 'failed',
          error_message: `Jenkins trigger failed: ${response.status} ${response.statusText}`,
        })
        .eq('id', deployment.id);

      throw new Error(`Jenkins trigger failed: ${response.status} ${response.statusText}`);
    }

    // Get queue item location from response headers
    const queueLocation = response.headers.get('Location');
    console.log('Jenkins queue location:', queueLocation);

    // Update deployment status
    await supabaseClient
      .from('deployments')
      .update({
        status: 'building',
        jenkins_build_url: queueLocation || jenkinsApiUrl,
      })
      .eq('id', deployment.id);

    // Update project status
    await supabaseClient
      .from('projects')
      .update({
        status: 'deploying',
      })
      .eq('id', projectId);

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        project_id: projectId,
        user_id: user.id,
        message: `Jenkins build triggered for ${project.name}`,
        level: 'info',
        metadata: {
          deployment_id: deployment.id,
          jenkins_url: queueLocation || jenkinsApiUrl,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        deployment,
        jenkins_queue_url: queueLocation,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in trigger-jenkins function:', error);
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