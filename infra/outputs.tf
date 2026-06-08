output "backend_public_ip" {
  description = "Elastic public IP address of the backend EC2 instance."
  value       = aws_eip.backend.public_ip
}

output "backend_api_url" {
  description = "Public HTTPS URL for the Food Checker API through Caddy."
  value       = "https://api.foodchecker.zkelder.dev"
}

output "backend_instance_id" {
  description = "EC2 instance ID for the backend host."
  value       = aws_instance.backend.id
}

output "backend_ssm_target" {
  description = "SSM target selector for no-SSH backend deploy commands."
  value       = "instanceids=${aws_instance.backend.id}"
}

output "ssh_command" {
  description = "SSH command for connecting to the backend instance."
  value       = "ssh -i ~/.ssh/food-checker-aws ubuntu@${aws_eip.backend.public_ip}"
}

output "github_actions_oidc_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC proof checks."
  value       = aws_iam_role.github_actions_oidc.arn
}

output "github_actions_oidc_provider_arn" {
  description = "IAM OIDC provider ARN for GitHub Actions."
  value       = aws_iam_openid_connect_provider.github_actions.arn
}

output "ecr_repository_url" {
  description = "ECR repository URL for the backend API image."
  value       = aws_ecr_repository.backend_api.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name for the backend API image."
  value       = aws_ecr_repository.backend_api.name
}
