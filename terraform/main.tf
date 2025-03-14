terraform {
  cloud {
    organization = "outrex"  # Replace with your Terraform Cloud organization name
    workspaces {
      name = "outrex-backend"
    }
  }
}

# 🛠️ 1️⃣ Create the ZIP file before deploying
resource "null_resource" "zip_code" {
  provisioner "local-exec" {
    command = <<EOT
      zip -r node-app.zip . -x "*.git*" "node_modules/*" "terraform/*" ".terraform/*" "*.tfstate" "*.tfvars"
    EOT
  }

  triggers = {
    always_run = timestamp()
  }
}

provider "aws" {
  region = "us-west-2"  # Change as needed
}

# 2️⃣ Create an S3 Bucket for storing app versions
resource "aws_s3_bucket" "eb_app_versions" {
  bucket = "outrex-bknd-versions-bucket"
}

# 3️⃣ Upload ZIP to S3 (depends on ZIP creation)
resource "aws_s3_object" "node_app_zip" {
  bucket = aws_s3_bucket.eb_app_versions.bucket
  key    = "node-app.zip"
  source = "node-app.zip"

  depends_on = [null_resource.zip_code]  # Ensure ZIP is created first
}

# 4️⃣ Create Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "node_app" {
  name        = "my-node-app"
  description = "Node.js backend deployed using Terraform Cloud"
}

# 5️⃣ Create a New Elastic Beanstalk Application Version
resource "aws_elastic_beanstalk_application_version" "node_version" {
  application = aws_elastic_beanstalk_application.node_app.name
  bucket      = aws_s3_bucket.eb_app_versions.bucket
  key         = aws_s3_object.node_app_zip.key
  name        = "v1-${timestamp()}"  # Unique version name

  depends_on = [aws_s3_object.node_app_zip]  # Ensure ZIP is uploaded first
}

# 6️⃣ Deploy New Version to Elastic Beanstalk
resource "aws_elastic_beanstalk_environment" "node_env" {
  name                = "my-node-env"
  application         = aws_elastic_beanstalk_application.node_app.name
  solution_stack_name = "64bit Amazon Linux 2 v3.5.2 running Node.js 18"
  version_label       = aws_elastic_beanstalk_application_version.node_version.name

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = "t3.micro"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "SingleInstance"
  }

  depends_on = [aws_elastic_beanstalk_application_version.node_version]  # Ensure correct version deployment
}
