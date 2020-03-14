import cheerio from 'cheerio';
import path from 'path';

import { tags, createNameFromURL, types } from './utils';

export const changeLinkInHTML = (html, url) => {
  const $ = cheerio.load(html);
  const sourceDir = createNameFromURL(url, types.sourceDir);

  const { origin } = new URL(url);
  Object.entries(tags).forEach(([key, attribute]) => {
    $(key).each((i, el) => {
      const link = $(el).attr(attribute);
      if (!link) return;

      const { host } = new URL(link, origin);
      if (!origin.includes(host)) return;

      $(el).attr(attribute, path.join(sourceDir, createNameFromURL(link)));
    });
  });
  return $.html();
};

export const getLinksFromHTML = (html, url) => {
  const $ = cheerio.load(html);
  const { origin } = new URL(url);
  const links = [];

  Object.entries(tags).forEach(([key, attribute]) => {
    $(key).each((i, el) => {
      const link = $(el).attr(attribute);
      if (!link) return;

      const preparedUrl = new URL(link, origin);
      if (!origin.includes(preparedUrl.host)) return;

      links.push(link);
    });
  });
  return links;
};
