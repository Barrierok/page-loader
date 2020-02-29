import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

export default (requestUrl, outputDir) => axios.get(requestUrl)
  .then(({ config: { url }, data }) => {
    const newUrl = new URL(url);
    const fileName = `${`${newUrl.host}${newUrl.pathname === '/' ? '' : newUrl.pathname}`
      .split('')
      .map((c) => (c.match(/[A-z0-9]/) ? c : '-'))
      .join('')}.html`;

    fs.writeFile(path.join(outputDir, fileName), data, 'utf8');
  })
  .catch(console.log);
