terraform {
  cloud {
    organization = "outrex"  # Replace with your Terraform Cloud organization name
    workspaces {
      name = "outrex-backend"
    }
  }
}

provider "aws" {
  region = "us-west-2"  # Change as needed
}

# 1️⃣ S3 Bucket for storing app versions
resource "aws_s3_bucket" "eb_app_versions" {
  bucket = "outrex-bknd-versions-bucket"
}

# 2️⃣ Upload the pre-zipped file to S3
resource "aws_s3_object" "node_app_zip" {
  bucket = aws_s3_bucket.eb_app_versions.bucket
  key    = "node-app.zip"
  source = "node-app.zip"
}

# 3️⃣ Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "node_app" {
  name        = "my-node-app"
  description = "Node.js backend deployed using Terraform Cloud"
}

# 4️⃣ Create a New Elastic Beanstalk Application Version
resource "aws_elastic_beanstalk_application_version" "node_version" {
  application = aws_elastic_beanstalk_application.node_app.name
  bucket      = aws_s3_bucket.eb_app_versions.bucket
  key         = aws_s3_object.node_app_zip.key
  name        = "v1-${timestamp()}"  # Creates unique version names

  depends_on = [aws_s3_object.node_app_zip] 
}

# 5️⃣ Deploy the Latest Version to Elastic Beanstalk
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
