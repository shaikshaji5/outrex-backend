terraform {
  cloud {
    organization = "outrex" 
    workspaces {
      name = "outrex-backend"
    }
  }
}

provider "aws" {
  region = "us-west-2" 
}
//wedfgdfdf
resource "aws_s3_bucket" "eb_app_versions" {
  bucket = "outrex-bknd-versions-bucket"
}

resource "aws_s3_object" "node_app_zip" {
  bucket = aws_s3_bucket.eb_app_versions.bucket
  key    = "node-app.zip"
  source = "node-app.zip"
}

resource "aws_elastic_beanstalk_application" "node_app" {
  name        = "my-node-app"
  description = "Node.js backend deployed using Terraform Cloud"
}

resource "aws_elastic_beanstalk_application_version" "node_version" {
  application = aws_elastic_beanstalk_application.node_app.name
  bucket      = aws_s3_bucket.eb_app_versions.bucket
  key         = aws_s3_object.node_app_zip.key
  name        = "v1-${timestamp()}" 

  depends_on = [aws_s3_object.node_app_zip] 
}


resource "aws_elastic_beanstalk_environment" "node_env" {
  name                = "my-node-env"
  application         = aws_elastic_beanstalk_application.node_app.name
  solution_stack_name = "64bit Amazon Linux 2023 v6.4.3 running Node.js 18"
  version_label       = aws_elastic_beanstalk_application_version.node_version.name

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "elasticbeanstalk-instance-profile"
  }

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




