terraform {
  cloud {
    organization = "outrex" # Replace with your Terraform Cloud organization name
    workspaces {
      name = "outrex-backend"
    }
  }
}
resource "null_resource" "zip_code" {
  provisioner "local-exec" {
    command = <<EOT
      git archive --format=zip HEAD -o my-node-app.zip
    EOT
  }

  triggers = {
    always_run = timestamp()
  }
}



provider "aws" {
  region = "us-west-2" # Change as needed
}

# 1️⃣ Create an S3 Bucket for app versions
resource "aws_s3_bucket" "eb_app_versions" {
  bucket = "outrex-bknd-versions-bucket" 
}

# 2️⃣ Create an Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "node_app" {
  name        = "my-node-app"
  description = "Node.js backend deployed using Terraform Cloud"
}

# 3️⃣ Create an Elastic Beanstalk Environment
resource "aws_elastic_beanstalk_environment" "node_env" {
  name                = "my-node-env"
  application         = aws_elastic_beanstalk_application.node_app.name
  solution_stack_name = "64bit Amazon Linux 2 v3.5.2 running Node.js 18"

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
}

# 4️⃣ Upload Node.js App Zip to S3
resource "aws_s3_object" "node_app_zip" {
  bucket = aws_s3_bucket.eb_app_versions.bucket
  key    = "my-node-app.zip"
  source = "my-node-app.zip"  # Ensure this ZIP file is present in your repo
}

# 5️⃣ Create a New EB Application Version
resource "aws_elastic_beanstalk_application_version" "node_version" {
  application = aws_elastic_beanstalk_application.node_app.name
  bucket      = aws_s3_bucket.eb_app_versions.bucket
  key         = aws_s3_object.node_app_zip.key
  name        = "v1"
}

# 6️⃣ Deploy New Version to Elastic Beanstalk
resource "aws_elastic_beanstalk_environment" "update_env" {
  name                = "my-node-env"
  application         = aws_elastic_beanstalk_application.node_app.name
  solution_stack_name = "64bit Amazon Linux 2 v3.5.2 running Node.js 18"
  version_label       = aws_elastic_beanstalk_application_version.node_version.name
}
