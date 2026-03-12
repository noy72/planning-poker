PROJECT_ID ?= $(shell gcloud config get-value project)
REGION     ?= asia-northeast1
REPOSITORY  = planning-poker
SERVICE     = planning-poker
IMAGE       = $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(REPOSITORY)/$(SERVICE)

.PHONY: build push deploy

build:
	docker build --platform linux/amd64 -t $(IMAGE) .

push: build
	docker push $(IMAGE)

deploy: push
	gcloud beta --project=${PROJECT_ID} run deploy $(SERVICE) \
		--image=$(IMAGE) \
		--region=$(REGION) \
		--service-account=$(SERVICE)-run@$(PROJECT_ID).iam.gserviceaccount.com \
		--no-allow-unauthenticated \
		--iap \
		--set-env-vars=GOOGLE_CLOUD_PROJECT=$(PROJECT_ID) \
		--cpu=1 \
		--memory=512Mi \
		--min-instances=0 \
		--max-instances=1
