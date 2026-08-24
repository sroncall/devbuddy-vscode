# DevBuddy

Extension para VS Code que facilita:

- Crear un archivo YAML en `.helm` con nombre basado en la rama Git actual.
- Crear comandos personalizados desde la paleta de comandos.
- Ejecutar comandos personalizados definidos en Settings.
- Ver una lista de comandos personalizados configurados.

## Comandos disponibles

- `DevBuddy: Abrir panel visual`
- `DevBuddy: Crear YAML en .helm desde rama actual`
- `DevBuddy: Crear comando personalizado`
- `DevBuddy: Ejecutar comando personalizado`
- `DevBuddy: Ver lista de comandos personalizados`

## Panel visual

Desde `DevBuddy: Abrir panel visual` puedes:

- Crear nuevos comandos personalizados.
- Ejecutar comandos con un click.
- Refrescar y visualizar comandos en formato de tarjetas.

Tambien tienes un icono de DevBuddy en la barra lateral (Activity Bar) con el mismo panel integrado.

## Configuracion

En Settings agrega o ajusta `myCommandExtension.customCommands`:

```json
[
  {
    "name": "Generar Helm",
    "command": "npm run helm:generate"
  },
  {
    "name": "Listar rama actual",
    "command": "git branch --show-current"
  }
]
```

## Desarrollo

```bash
npm install
npm run compile
npm run package:vsix
```

Luego presiona `F5` para abrir una ventana Extension Development Host.

## Empaquetar VSIX

Para generar el archivo `.vsix` ejecuta:

```bash
npm run package:vsix
```

Eso genera el paquete instalable de la extension en la raiz del proyecto.

## Release automatizado

Este repositorio publica releases en GitHub Actions usando tags `v*`.

Scripts recomendados:

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

Cada script hace lo siguiente:

- Incrementa version en `package.json`.
- Crea commit de release.
- Crea tag `vX.Y.Z`.
- Hace push de `main` y del tag.

El workflow publica dos assets en cada release:

- `<name>-<version>.vsix` (versionado)
- `devbuddy-vscode-latest.vsix` (estable para descarga de ultima version)

Tambien se puede ejecutar manualmente desde Actions (`workflow_dispatch`) indicando el `tag`.
