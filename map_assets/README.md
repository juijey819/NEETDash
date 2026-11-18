# Versioned province geometry

Source: https://github.com/mashadinoor/Indonesia-Geojson-2026 (downloaded 2026-11-17). The upstream repository attributes geometry to BIG and licenses it under MIT; see GEOMETRY_LICENSE.

38-province file: collected from all 38 Provinsi/*.json files, keyed by KODE_PROV. Invalid input geometries were repaired with Shapely make_valid.

34-province file: true geometry unions using Shapely union_all. Codes 91, 93, 94, 95 dissolve into PAPUA_HIST; codes 92 and 96 dissolve into historical Papua Barat, key 92. This corrects the starter brief's dissolve list. Papua Barat Daya was split from Papua Barat (UU 29/2022), not from Papua.

Validation: 38/34 unique features, valid nonempty geometries, all 178 supplied province-year rows join without loss. GeoJSON files and Inter font are bundled locally; no runtime remote request.

Official boundary relationship: https://peraturan.bpk.go.id/Details/232726/uu-no-29-tahun-2022
