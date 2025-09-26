import got from 'got';
import { LIBRARY_API_KEY, LIBRARY_ID } from '../constants/common.js';

const bunnyClient = got.extend({
  prefixUrl: 'https://video.bunnycdn.com/library/' + LIBRARY_ID,
  headers: {
    AccessKey: LIBRARY_API_KEY
  },
  responseType: 'json'
});

export { bunnyClient };
