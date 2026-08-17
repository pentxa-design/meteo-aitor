#!/usr/bin/env python3
"""Build the bundled NOAA PSL 1991-2020 daily T850 climatology.

Input dataset:
  NCEP/NCAR Reanalysis 1 daily pressure-level long-term mean 1991-2020
  https://downloads.psl.noaa.gov/Datasets/ncep.reanalysis.derived/pressure/
  air.day.ltm.1991-2020.nc

The output is deterministic gzip containing 365 x 73 x 144 uint16 values in
little-endian order. Values are Kelvin multiplied by 100; zero is reserved for
missing data. h5py and numpy are build-time dependencies only.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
from pathlib import Path
import sys

import h5py
import numpy as np


EXPECTED_DAYS = 365
EXPECTED_LATITUDES = 73
EXPECTED_LONGITUDES = 144


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build(source: Path, output: Path) -> None:
    with h5py.File(source, "r") as dataset:
        levels = np.asarray(dataset["level"][:], dtype=np.float64)
        level_matches = np.flatnonzero(np.isclose(levels, 850.0))
        if len(level_matches) != 1:
            raise RuntimeError("El archivo NOAA no contiene un nivel 850 hPa único.")
        level_index = int(level_matches[0])

        latitudes = np.asarray(dataset["lat"][:], dtype=np.float64)
        longitudes = np.asarray(dataset["lon"][:], dtype=np.float64)
        if (
            latitudes.shape != (EXPECTED_LATITUDES,)
            or longitudes.shape != (EXPECTED_LONGITUDES,)
            or not np.allclose(latitudes, np.linspace(90, -90, EXPECTED_LATITUDES))
            or not np.allclose(longitudes, np.arange(EXPECTED_LONGITUDES) * 2.5)
        ):
            raise RuntimeError("La rejilla NOAA no coincide con 73 latitudes y 144 longitudes a 2,5°.")

        temperature = np.asarray(dataset["air"][:, level_index, :, :], dtype=np.float64)
        expected_shape = (EXPECTED_DAYS, EXPECTED_LATITUDES, EXPECTED_LONGITUDES)
        if temperature.shape != expected_shape:
            raise RuntimeError(f"Forma T850 inesperada: {temperature.shape}; se esperaba {expected_shape}.")

        valid = np.isfinite(temperature) & (temperature >= 150.0) & (temperature <= 350.0)
        encoded = np.zeros(expected_shape, dtype="<u2")
        encoded[valid] = np.rint(temperature[valid] * 100).astype("<u2")

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    with temporary.open("wb") as raw_handle:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw_handle, compresslevel=9, mtime=0) as gz_handle:
            gz_handle.write(encoded.tobytes(order="C"))
    temporary.replace(output)
    print(f"source_sha256={sha256(source)}")
    print(f"output_sha256={sha256(output)}")
    print(f"valid_values={int(valid.sum())}")
    print(f"missing_values={int(valid.size - valid.sum())}")
    print(f"kelvin_range={float(temperature[valid].min()):.5f}..{float(temperature[valid].max()):.5f}")
    print(f"output_bytes={output.stat().st_size}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        build(args.source, args.output)
    except Exception as error:  # noqa: BLE001 - CLI reports the exact build failure.
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
