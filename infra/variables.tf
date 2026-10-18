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
  description = "Legacy unused input retained temporarily for existing local tfvars compatibility. FastAPI is no longer exposed directly on TCP 8000."
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

variable "cloudflare_ipv4_cidrs" {
  description = "Cloudflare edge IPv4 ranges allowed to reach the origin on 80/443 (https://www.cloudflare.com/ips-v4, retrieved 2026-10-17)."
  type        = list(string)
  default = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22",
  ]
}
