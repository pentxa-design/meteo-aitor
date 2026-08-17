# Normal diaria T850 1991-2020

`t850-climatology-1991-2020.u16.gz` contiene la normal diaria de temperatura a
850 hPa de **NOAA PSL, NCEP/NCAR Reanalysis 1**, periodo climatológico
1991-2020. No es un mapa copiado de un tercero ni una aproximación visual.

- Fuente oficial: `air.day.ltm.1991-2020.nc`
- Descarga: https://downloads.psl.noaa.gov/Datasets/ncep.reanalysis.derived/pressure/air.day.ltm.1991-2020.nc
- OPeNDAP: https://psl.noaa.gov/thredds/dodsC/Datasets/ncep.reanalysis.derived/pressure/air.day.ltm.1991-2020.nc
- Variable: `air`, nivel 850 hPa, unidades Kelvin.
- Rejilla: 365 días, 73 latitudes (90 a -90), 144 longitudes (0 a 357,5), paso 2,5°.
- Codificación local: `uint16` little-endian, Kelvin × 100, gzip determinista.
- SHA-256 del NetCDF fuente: `0bcf0cb604c27fc4164e88afd79ccebdc99b1edc558b7c8229702ab6b75e8a3f`.
- SHA-256 del gzip empaquetado: `4e478e931c139ea7b88e391f832466a64f8ba755397045aff99551f96b343193`.
- Tamaño empaquetado: 5.852.827 bytes; 3.836.880 valores válidos y cero valores ausentes.

La aplicación interpola bilinealmente la normal al punto de pronóstico y
calcula `pronóstico ECMWF IFS T850 - normal NOAA`. El 29 de febrero usa la
media de las normales del 28 de febrero y del 1 de marzo. Después del 29 de
febrero en años bisiestos se ajusta el índice al calendario climatológico de
365 días.

El archivo se carga desde el despliegue y se conserva en memoria; mover el
mapa, usar el deslizador o hacer zoom no descarga la climatología de NOAA.

Regeneración (requiere `h5py` y `numpy` solo durante la compilación):

```sh
python3 scripts/build-t850-climatology.py \
  air.day.ltm.1991-2020.nc \
  data/t850-climatology-1991-2020.u16.gz
```
