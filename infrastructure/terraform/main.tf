terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.3.0"
}

provider "aws" {
  region = var.region
}

// Create a VPC for RDS (simple example, not production hardened)
resource "aws_vpc" "this" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "workme-vpc" }
}

resource "aws_subnet" "a" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.region}a"
}

resource "aws_subnet" "b" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.region}b"
}

resource "aws_db_subnet_group" "this" {
  name       = "workme-db-subnet-group"
  subnet_ids = [aws_subnet.a.id, aws_subnet.b.id]
}

resource "aws_security_group" "rds_sg" {
  name        = "workme-rds-sg"
  description = "Allow Postgres access from within VPC"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # CHANGE: restrict this for production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "workme-postgres-db"
  engine     = "postgres"
  engine_version = "15.5"
  instance_class = "db.t4g.micro"
  allocated_storage = 20
  name     = var.db_name
  username = var.db_username
  password = var.db_password
  skip_final_snapshot = true
  publicly_accessible = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name = aws_db_subnet_group.this.name
  tags = { Name = "workme-postgres" }
}
