const cheerio = require('cheerio');

const getSoundCloudEmbedData = async (scUrl) => {
  const scRes = await fetch(`${process.env.SOUNDCLOUD_OEMBED_URL}${scUrl}`);
  const data = await scRes.json();

  // Load the HTML content into cheerio
  const $ = cheerio.load(data.html);

  // Find the iframe element and get the src attribute
  const iframeElement = $('iframe');
  const srcAttributeValue = iframeElement.attr('src');

  return srcAttributeValue;
};

module.exports = getSoundCloudEmbedData;
