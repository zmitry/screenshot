#!/bin/bash

PROJECT=es-scalability-test
NAME=frontend-screenshot
IMAGE=gcr.io/$PROJECT/$NAME

cd $(dirname $0)

gcloud builds submit --tag $IMAGE --project $PROJECT
gcloud run deploy $NAME --image $IMAGE --allow-unauthenticated --platform managed --quiet --region us-east1 --port 80 --labels component=analytics --project $PROJECT
