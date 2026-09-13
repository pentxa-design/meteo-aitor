
export const get = async () => {
  const e = new Error('The requested blob does not exist');
  e.name = 'BlobNotFoundError';
  throw e;
};
