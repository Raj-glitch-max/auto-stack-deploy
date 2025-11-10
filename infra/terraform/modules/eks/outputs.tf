output "cluster_name" {
  value = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  value = aws_eks_cluster.main.version
}

output "cluster_security_group_id" {
  value = aws_security_group.cluster.id
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.cluster.arn
}

output "oidc_provider_url" {
  value = replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")
}

output "node_group_role_arn" {
  value = aws_iam_role.node_group.arn
}

output "configure_kubectl" {
  value = "aws eks update-kubeconfig --region ${data.aws_region.current.name} --name ${aws_eks_cluster.main.name}"
}

data "aws_region" "current" {}
