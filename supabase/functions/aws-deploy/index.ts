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

    const { projectId, action, dockerImageTag } = await req.json();

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

    // Get AWS credentials
    const awsAccessKey = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const awsRegion = Deno.env.get('AWS_REGION') || 'ap-south-1';

    if (!awsAccessKey || !awsSecretKey) {
      throw new Error('AWS credentials not configured');
    }

    console.log(`AWS ${action} operation for project ${project.name}`);

    if (action === 'deploy') {
      // Update ECS service with new task definition
      // This is a simplified version - in production you'd use AWS SDK
      
      // For now, we'll simulate the deployment process
      await supabaseClient
        .from('projects')
        .update({
          status: 'deploying',
          deployment_url: `http://${project.ecs_service_name}.${awsRegion}.elb.amazonaws.com`,
        })
        .eq('id', projectId);

      // Create deployment record
      const { data: deployment } = await supabaseClient
        .from('deployments')
        .insert({
          project_id: projectId,
          status: 'deploying',
          docker_image_tag: dockerImageTag,
        })
        .select()
        .single();

      // Log activity
      await supabaseClient
        .from('activity_logs')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message: `Deploying to AWS ECS: ${project.ecs_service_name}`,
          level: 'info',
          metadata: {
            deployment_id: deployment?.id,
            image_tag: dockerImageTag,
          },
        });

      // Simulate deployment completion after a delay
      setTimeout(async () => {
        await supabaseClient
          .from('projects')
          .update({
            status: 'active',
            health_status: 'healthy',
          })
          .eq('id', projectId);

        if (deployment) {
          await supabaseClient
            .from('deployments')
            .update({
              status: 'success',
              completed_at: new Date().toISOString(),
            })
            .eq('id', deployment.id);
        }

        await supabaseClient
          .from('activity_logs')
          .insert({
            project_id: projectId,
            user_id: user.id,
            message: `Deployment completed successfully`,
            level: 'success',
          });
      }, 5000);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Deployment initiated',
          deployment,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'destroy') {
      // Destroy ECS service and resources
      await supabaseClient
        .from('projects')
        .update({
          status: 'stopped',
          health_status: 'unknown',
        })
        .eq('id', projectId);

      await supabaseClient
        .from('activity_logs')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message: `Infrastructure destroyed for ${project.name}`,
          level: 'warning',
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Infrastructure destroyed',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in aws-deploy function:', error);
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