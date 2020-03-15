import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import debug from 'debug';
import Listr from 'listr';
import 'axios-debug-log';

import { getNameFromURL, types } from './utils';
import { changeLinkInHTML, getLinksFromHTML } from './htmlWorker';

const log = debug('page-loader');

const loadReresource = (link, resourceDir, sourceUrl) => axios({
  method: 'get',
  url: sourceUrl.toString(),
  responseType: 'stream',
}).then(({ data, status }) => {
  if (status !== 200) {
    throw new Error(`Reresource ${link} was not loaded because response status: ${status}`);
  }
  const resourceFileName = getNameFromURL(link);
  data.pipe(createWriteStream(path.join(resourceDir, resourceFileName)));

  return log(`Reresource ${resourceFileName} has been loaded and written to the folder ${resourceDir}`);
});

const loadReresources = (html, requestUrl, resourceDir) => {
  const { origin } = new URL(requestUrl);

  const links = getLinksFromHTML(html, requestUrl);
  log(`Links from HTML document: ${links}`);

  const promises = links.map((link) => {
    const sourceUrl = new URL(link, origin);
    return { title: `${sourceUrl}`, task: () => loadReresource(link, resourceDir, sourceUrl) };
  });

  return Promise.all(promises).then((data) => {
    const tasks = new Listr(data, { concurrent: true, exitOnError: false });
    tasks.run();
  });
};

export default (requestUrl, outputDir) => axios.get(requestUrl)
  .then(({ data: html }) => {
    const resourceDirName = getNameFromURL(requestUrl, types.resourceDir);
    const resourceDir = path.join(outputDir, resourceDirName);

    return fs.mkdir(resourceDir)
      .then(() => {
        log(`Folder ${resourceDirName} was created in ${outputDir}`);
        return loadReresources(html, requestUrl, resourceDir);
      })
      .then(() => {
        const indexFileName = getNameFromURL(requestUrl, types.htmlFile);

        const changedHtml = changeLinkInHTML(html, requestUrl);

        return fs.writeFile(path.join(outputDir, indexFileName), changedHtml, 'utf-8')
          .then(() => {
            log(`File ${indexFileName} was created in folder ${outputDir}`);
            return indexFileName;
          });
      });
  })
  .catch((err) => {
    log(err.message);
    throw err;
  });
