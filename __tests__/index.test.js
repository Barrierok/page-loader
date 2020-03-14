import nock from 'nock';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import loadPage from '../src';
import { createNameFromURL } from '../src/utils';
import { types } from '../dist/utils';

let tempDir;
let outputFilesDir;
let originalHtml;
const requestUrl = 'http://lunar-sea-surgel.sh';
const pathFixturesDir = path.join(__dirname, '__fixtures__');

let expectedCss;
let expectedHtml;
let expectedScript;
let expectedImage;

const mappingPath = {
  html: '/',
  css: '/styles/style.css',
  script: '/scripts/index.js',
  image: '/images/banner.png',
};

const readFile = (dir, pathToFile) => fs.readFile(path.join(dir, pathToFile), 'utf8');

nock.disableNetConnect();
beforeAll(async () => {
  originalHtml = await readFile(pathFixturesDir, 'index.html');

  expectedHtml = await readFile(pathFixturesDir, 'changedIndex.html');
  expectedCss = await readFile(pathFixturesDir, mappingPath.css);
  expectedScript = await readFile(pathFixturesDir, mappingPath.script);
  expectedImage = await readFile(pathFixturesDir, mappingPath.image);

  nock(requestUrl)
    .persist()
    .get(mappingPath.html)
    .reply(200, originalHtml)
    .get(mappingPath.css)
    .reply(200, expectedCss)
    .get(mappingPath.script)
    .reply(200, expectedScript)
    .get(mappingPath.image)
    .reply(200, expectedImage);
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  outputFilesDir = path.join(tempDir, createNameFromURL(requestUrl, types.sourceDir));
});

test('change link in html', async () => {
  await loadPage(requestUrl, tempDir);

  const changedHtml = await readFile(tempDir, createNameFromURL(requestUrl, types.htmlFile));
  expect(changedHtml).toEqual(expectedHtml);
});

test('download correct css file', async () => {
  await loadPage(requestUrl, tempDir);

  const css = await readFile(outputFilesDir, createNameFromURL(mappingPath.css));
  expect(css).toEqual(expectedCss);
});

test('download correct javascript file', async () => {
  await loadPage(requestUrl, tempDir);

  const script = await readFile(outputFilesDir, createNameFromURL(mappingPath.script));
  expect(script).toEqual(expectedScript);
});

test('download correct image file', async () => {
  await loadPage(requestUrl, tempDir);

  const image = await readFile(outputFilesDir, createNameFromURL(mappingPath.image));
  expect(image).toEqual(expectedImage);
});

afterEach(async () => {
  await fs.rmdir(tempDir, { recursive: true });
});
