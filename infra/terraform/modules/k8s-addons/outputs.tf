# Kubernetes Add-ons Outputs

output "argocd_namespace" {
  description = "ArgoCD namespace"
  value       = kubernetes_namespace.argocd.metadata[0].name
}

# output "monitoring_namespace" {
#   description = "Monitoring namespace"
#   value       = kubernetes_namespace.monitoring.metadata[0].name
# }

output "alb_controller_role_arn" {
  description = "IAM role ARN for AWS Load Balancer Controller"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}

output "cluster_autoscaler_role_arn" {
  description = "IAM role ARN for Cluster Autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "argocd_server_url" {
  description = "ArgoCD server URL - use port-forward"
  value       = "kubectl port-forward svc/argocd-server -n argocd 8080:80"
}

# output "grafana_url" {
#   description = "Grafana URL (use kubectl to get LoadBalancer DNS)"
#   value       = "Run: kubectl get svc prometheus-grafana -n monitoring"
# }
# 
# output "prometheus_url" {
#   description = "Prometheus URL (use kubectl to get LoadBalancer DNS)"
#   value       = "Run: kubectl get svc prometheus-kube-prometheus-prometheus -n monitoring"
# }
