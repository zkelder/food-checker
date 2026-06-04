variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for tags and resource names."
  type        = string
  default     = "food-checker"
}

variable "instance_type" {
  description = "EC2 instance type for the backend server."
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key_path" {
  description = "Path to the local SSH public key used for EC2 access."
  type        = string
  default     = "~/.ssh/food-checker-aws.pub"
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into the instance. Use your public IP with /32."
  type        = string
}

variable "allowed_api_cidr" {
  description = "CIDR allowed to access the API port."
  type        = string
  default     = "0.0.0.0/0"
}

variable "availability_zone" {
  description = "Availability zone for the backend EC2 instance."
  type        = string
  default     = "us-east-1a"
}

variable "github_org" {
  description = "GitHub organization or username that owns the repository."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name allowed to assume the OIDC role."
  type        = string
}
