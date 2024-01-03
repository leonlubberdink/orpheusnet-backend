const checkUrlService = async (oEmbedUrl, urlToCheck, platform) => {
  try {
    const scRes = await fetch(`${oEmbedUrl}?url=${urlToCheck}`);
    const data = await scRes.json();
    return data;
  } catch (err) {
    throw new Error(`This is not a valid ${platform} url`);
  }
};

module.exports = checkUrlService;
