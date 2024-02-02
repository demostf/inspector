{ lib, buildNpmPackage, fetchFromGitHub }:

buildNpmPackage rec {
  pname = "json-schema-to-typescript";
  version = "13.1.2";

  src = fetchFromGitHub {
    owner = "bcherny";
    repo = "json-schema-to-typescript";
    rev = "6adcad98ac28334f1e8cd932e412c64dde4205f5";
    hash = "sha256-ad3syFl8NB31yl5JKN3tbGTT1zBCPIsX9CM5pLY/wb8=";
  };

  postPatch = ''
    cp ${./package-lock.json} package-lock.json
  '';

  npmDepsHash = "sha256-+8d/kcv2aFJis/J9sh5A74PgYYbnOHImanWMz0/XTZY=";

  npmBuildScript = "build:server";

  meta = with lib; {
    description = "Compile JSONSchema to TypeScript type declarations";
    homepage = "https://github.com/bcherny/json-schema-to-typescript";
    license = licenses.mit;
    maintainers = with maintainers; [ icewind1991 ];
  };
}