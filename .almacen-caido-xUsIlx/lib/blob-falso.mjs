
const suspendido = () => {
  const e = new Error('Vercel Blob: This store has been suspended.');
  e.name = 'BlobServiceNotAvailable';
  throw e;
};
export const get = suspendido;
export const put = suspendido;
export const del = suspendido;
export const list = suspendido;
export const head = suspendido;
