const apiClient = require('./axios');

// Function to make the initial request
exports.fetchAlbum = async (id) => {
  console.log(id);
  console.log(`${process.env.SPOTIFY_ALBUMS_API}/${id}`);
  try {
    const response = await apiClient.get(
      `${process.env.SPOTIFY_ALBUMS_API}/${id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching album:', error.data);
  }
};

exports.fetchSong = async (id) => {
  try {
    const response = await apiClient.get(
      `${process.env.SPOTIFY_TRACKS_API}/${id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching album:', error.data);
  }
};
