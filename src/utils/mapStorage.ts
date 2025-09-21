// Simulating server-side file storage with localStorage
export const saveMap = async (mapId: string, data: any): Promise<void> => {
  try {
    localStorage.setItem(`map_${mapId}`, JSON.stringify(data));
    return Promise.resolve();
  } catch (error) {
    console.error('Error saving map:', error);
    return Promise.reject(error);
  }
};
export const loadMap = async (mapId: string): Promise<any> => {
  try {
    const data = localStorage.getItem(`map_${mapId}`);
    return Promise.resolve(data ? JSON.parse(data) : null);
  } catch (error) {
    console.error('Error loading map:', error);
    return Promise.reject(error);
  }
};