import nock from 'nock';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import loadPage from '../src';

nock.disableNetConnect();

let tempDir = '';
const requestUrl = 'http://lunar-sea.surge.sh';

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('html file stored', async () => {
  const expectedHtml = await fs.readFile(path.join(__dirname, '__fixtures__', 'landing', 'index.html'), 'utf-8');
  nock(requestUrl)
    .get('/')
    .reply(200, expectedHtml);

  await loadPage(requestUrl, tempDir);
  const html = await fs.readFile(path.join(tempDir, 'lunar-sea-surge-sh.html'), 'utf-8');
  expect(html).toEqual(expectedHtml);
});

afterEach(async () => {
  await fs.rmdir(tempDir, { recursive: true });
});
