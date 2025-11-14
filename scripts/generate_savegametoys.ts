import { writeFileSync, readFileSync } from "fs";

const savegame = `# SAVEGAME TOYS

Este archivo describe el estado ACTUAL del proyecto LosToys.
Se actualiza automáticamente con el comando ./savegametoys.

## 1. Arquitectura General
(INSERTAR AQUÍ la versión actual del savegametoys.md existente)

`;

writeFileSync("savegametoys.md", savegame);
