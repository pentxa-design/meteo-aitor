
export const get = async () => {
  const e = new Error('The requested blob does not exist');
  e.name = 'BlobNotFoundError';
  throw e;
};
export const put = async () => ({ url: 'no-se-usa-en-esta-prueba' });
export const del = async () => {};
