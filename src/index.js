import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import 'axios-debug-log';
import debug from 'debug';

import { getNameFromURL, types } from './utils';
import { changeLinkInHTML, getLinksFromHTML } from './htmlWorker';

const log = debug('page-loader');

export default (requestUrl, outputDir) => axios.get(requestUrl)
  .then(({ data: html }) => {
    const indexFileName = getNameFromURL(requestUrl, types.htmlFile);
    const sourceDirName = getNameFromURL(requestUrl, types.sourceDir);

    const newHtml = changeLinkInHTML(html, requestUrl);
    return fs.writeFile(path.join(outputDir, indexFileName), newHtml, 'utf-8')
      .then(() => {
        log(`${indexFileName} file was created in ${outputDir}`);
        return fs.mkdir(path.join(outputDir, sourceDirName));
      })
      .then(() => {
        log(`${sourceDirName} dir was created in ${outputDir}`);
        return { html };
      });
  })
  .then(({ html }) => {
    const { origin } = new URL(requestUrl);
    const sourceDirName = getNameFromURL(requestUrl, types.sourceDir);
    const links = getLinksFromHTML(html, requestUrl);
    log(`Links from HTML document: ${links}`);

    const promises = links.map((link) => {
      const sourceUrl = new URL(link, origin);

      return axios({
        method: 'get',
        url: sourceUrl.toString(),
        responseType: 'stream',
      }).then(({ data }) => {
        const sourceFileName = getNameFromURL(link);
        data.pipe(createWriteStream(path.join(outputDir, sourceDirName, sourceFileName)));
        return log(
          `${sourceFileName} was download and written in dir ${path.join(outputDir, sourceDirName)}`,
        );
      });
    });
    return Promise.all(promises);
  })
  .catch(console.error);
