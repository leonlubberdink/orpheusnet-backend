const checkUrlService = async (oEmbedUrl, urlToCheck, platform) => {
  try {
    const scRes = await fetch(`${oEmbedUrl}${urlToCheck}`);
    const data = await scRes.json();
    return data;
  } catch (err) {
    throw new Error(
      `This is not a valid ${platform} url. Please note that protocol must be included (https://), and check if url is correct.`
    );
  }
};

module.exports = checkUrlService;
