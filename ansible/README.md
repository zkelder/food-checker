# Food Checker Ansible

Ansible configures the EC2 backend host prerequisites. It does not create AWS
infrastructure, build images, push images, deploy mobile builds, or manage app
secrets.

## Install Ansible Locally

```bash
python -m pip install ansible
```

On systems without `python`, use `python3`.

## Inventory

Copy the example inventory and adjust it locally:

```bash
cd ansible
cp inventories/production.example.ini inventories/production.ini
```

Edit `inventories/production.ini` with the real EC2 public IP and local SSH key
path. Do not commit real local inventories. They are ignored by git.

## Connectivity Check

```bash
cd ansible
ansible backend -i inventories/production.ini -m ping
```

## Configure Backend Host

```bash
cd ansible
ansible-playbook -i inventories/production.ini playbooks/backend-host.yml
```

## Ownership Boundaries

- Terraform owns AWS infrastructure such as EC2, security groups, IAM, EIP, and
  ECR.
- GitHub Actions owns CI checks and backend image build/push to ECR.
- Ansible owns EC2 host prerequisites: baseline packages, Docker Engine,
  Docker Compose plugin, AWS CLI v2, and app directory checks.
- Deployment scripts own pulling/running the selected backend image for now.

The Caddy role is verification-only and disabled by default. Managing the
Caddyfile is future work unless the intended host config is added to this repo.
