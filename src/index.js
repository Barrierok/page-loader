import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';

import { createNameFromURL, types } from './utils';
import { changeLinkInHTML, getLinksFromHTML } from './htmlWorker';

export default (requestUrl, outputDir) => axios.get(requestUrl)
  .then(({ data: html }) => {
    const indexFileName = createNameFromURL(requestUrl, types.htmlFile);
    const sourceDirName = createNameFromURL(requestUrl, types.sourceDir);

    const newHtml = changeLinkInHTML(html, requestUrl);
    return fs.writeFile(path.join(outputDir, indexFileName), newHtml, 'utf-8')
      .then(() => fs.mkdir(`${outputDir}/${sourceDirName}`))
      .then(() => ({ html }));
  })
  .then(({ html }) => {
    const { origin } = new URL(requestUrl);
    const links = getLinksFromHTML(html, requestUrl);
    const sourceDirName = createNameFromURL(requestUrl, types.sourceDir);

    const promises = links.map((link) => {
      const sourceUrl = new URL(link, origin);

      return axios({
        method: 'get',
        url: sourceUrl.toString(),
        responseType: 'stream',
      }).then(({ data }) => {
        const sourceFileName = createNameFromURL(link);
        return data.pipe(createWriteStream(path.join(outputDir, sourceDirName, sourceFileName)));
      });
    });
    return Promise.all(promises);
  })
  .catch(console.log);
