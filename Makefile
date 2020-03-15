install:
	npm ci

build:
	rm -rf dist
	npm run build

test:
	DEBUG=page-loader npm test

test-coverage:
	npm test -- --coverage
	
lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
