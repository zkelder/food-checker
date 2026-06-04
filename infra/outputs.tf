output "backend_public_ip" {
  description = "Elastic public IP address of the backend EC2 instance."
  value       = aws_eip.backend.public_ip
}

output "backend_api_url" {
  description = "HTTP URL for the FastAPI backend."
  value       = "http://${aws_eip.backend.public_ip}:8000"
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
