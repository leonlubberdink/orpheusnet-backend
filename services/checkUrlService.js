const { fetchAlbum, fetchSong } = require('./spotifyServices');

function extractAlbumOrTrackId(type, url) {
  const startIndex = url.indexOf(`${type}/`) + `${type}/`.length;
  const endIndex = url.indexOf('&utm');
  return url.substring(startIndex, endIndex);
}

const checkUrlService = async (oEmbedUrl, urlToCheck, platform) => {
  let res;
  let type = '';

  try {
    if (platform.toLowerCase() === 'soundcloud') {
      res = await fetch(`${oEmbedUrl}${urlToCheck}`);

      const data = await res.json();
      return data;
    }

    if (platform.toLowerCase() === 'spotify') {
      res = await fetch(`${oEmbedUrl}${urlToCheck}`);

      const data = await res.json();

      if (
        !data.iframe_url.includes('/embed/track/') &&
        !data.iframe_url.includes('/embed/album/')
      ) {
        throw new Error(
          "Only sharing of Spotify songs and albums/ep's is allowed."
        );
      }

      if (data.iframe_url.includes('/embed/track/')) type = 'track';
      if (data.iframe_url.includes('/embed/album/')) type = 'album';

      const id = extractAlbumOrTrackId(type, data.iframe_url);

      const shareData =
        type === 'album' ? await fetchAlbum(id) : await fetchSong(id);

      return {
        author_name: shareData.artists[0].name,
        title: shareData.name,
        url: urlToCheck,
      };
    }
  } catch (err) {
    throw new Error(
      `This is not a valid ${platform} url. Please note that protocol must be included (https://), and check if url is correct.`
    );
  }
};

module.exports = checkUrlService;
