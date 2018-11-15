#!/bin/sh

OPTIONS="--runtime nodejs8"
OPTIONS="${OPTIONS} --entry-point image_optimizer"
OPTIONS="${OPTIONS} --region ${REGION}"
OPTIONS="${OPTIONS} --project ${PROJECT_ID}"
OPTIONS="${OPTIONS} --set-env-vars BUCKET_NAME=${BUCKET_NAME}"
OPTIONS="${OPTIONS} --trigger-http"
OPTIONS="${OPTIONS} --memory 512MB"

gcloud beta functions deploy image_optimizer ${OPTIONS}
