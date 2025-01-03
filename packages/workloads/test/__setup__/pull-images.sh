#!/bin/bash

echo "Pulling docker images"

docker pull postgres:16.5-alpine3.20
docker pull redis:7.4.1-alpine3.20
docker pull mysql:8.4.3
docker pull localstack/localstack:3.8.1
docker pull mongo:7.0.15
docker pull axllent/mailpit:v1.21.3
docker pull elasticsearch:7.17.25
docker pull nginx:latest
