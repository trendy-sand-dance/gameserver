all: up

up: runprod
	docker-compose up

rundev: devbuild
	docker-compose up

runprod: prodbuild
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

devbuild:
	docker-compose build 

prodbuild:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

clean:
	@docker stop $$(docker ps -qa) || true
	@docker rm $$(docker ps -qa) || true
