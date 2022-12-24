provider "aws" {
  region = local.region
  shared_credentials_files = [ var.provider_cred_path ]
  profile = var.profile
}

locals {
  name            = "eks-innfi"
  cluster_version = "1.23"
  region          = "ap-northeast-2"

  tags = {
    ClusterTag = "eks-innfi"
  }
}

# resource "aws_kms_key" "eks" {
#   description             = "EKS Secret Encryption Key"
#   deletion_window_in_days = 7
#   enable_key_rotation     = true

#   tags = local.tags
# }

# module "vpc" {
#   source = "terraform-aws-modules/vpc/aws"
#   version = "~> 3.0"

#   name = local.name
#   cidr = var.vpc_cidr

#   azs             = ["${local.region}a", "${local.region}b"]
#   private_subnets = var.private_subnets
#   public_subnets  = var.public_subnets

#   enable_nat_gateway   = true
#   single_nat_gateway   = true
#   enable_dns_hostnames = true

#   enable_flow_log                      = true
#   create_flow_log_cloudwatch_iam_role  = true
#   create_flow_log_cloudwatch_log_group = true

#   public_subnet_tags = {
#     "kubernetes.io/cluster/${local.name}" = "shared"
#     "kubernetes.io/role/elb"              = 1
#   }

#   private_subnet_tags = {
#     "kubernetes.io/cluster/${local.name}" = "shared"
#     "kubernetes.io/role/internal-elb"     = 1
#   }

#   tags = local.tags
# }

module "eks" {
  source = "terraform-aws-modules/eks/aws"

  cluster_name                    = local.name
  cluster_version                 = local.cluster_version
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true

  cluster_addons = {
    coredns = {
      resolve_conflicts = "OVERWRITE"
    }
    kube-proxy = {}
    vpc-cni = {
      resolve_conflicts = "OVERWRITE"
    }
  }

  cluster_encryption_config = [{
    provider_key_arn = aws_kms_key.eks.arn
    resources        = ["secrets"]
  }]

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    basic = {
      name = "basic_node_group"
      min_size = 1
      desired_size = 2
      max_size= 3
      capacity_type = "SPOT"

      instance_types = ["t3.medium"]
      labels = {
        ClusterTag = local.tags.ClusterTag
      }
    }
  }

  cluster_identity_providers = {
    sts = {
      client_id = "sts.amazonaws.com"
    }
  }

  tags = local.tags
}

module "alb_controller_role" {
  source = "terraform-aws-modules/iam/aws/modules/iam-assumable-role-with-oidc"

  create_role = true

  role_name        = "loadbalancer-controller-role"
  role_path        = "/"
  role_description = ""

  provider_url = replace(module.eks.cluster_oidc_issuer_url, "https://", "")
  oidc_fully_qualified_subjects = [
    "system:serviceaccount:kube-system:balancer"
  ]
  oidc_fully_qualified_audiences = [
    "sts.amazonaws.com"
  ]
}

module "ecr_trady" {
  source = "./modules/ecr_trady"
}
