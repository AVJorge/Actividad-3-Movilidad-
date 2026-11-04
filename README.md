# Calcula, compara y decide · Módulo 13

Material interactivo de apoyo para las **Actividades integradoras 3 y 4 del Módulo 13** de Prepa en Línea-SEP. Explica los procedimientos con datos de ejemplo, sin dar los resultados de las actividades. Un selector en la parte superior cambia entre las dos actividades; cada una también tiene su propio enlace (`#ai3` y `#ai4`).

## Actividad integradora 3 · A la universidad

| Sección | Qué hace el estudiante |
|---|---|
| 1. Analogía | Avanza mes por mes en una tienda y compara el inventario real con el inflado. |
| 2. El modelo | Revisa la fórmula P(n+1) = P(n) − r·P(n) + C y el significado de cada término. |
| 3. Simulador | Calcula año por año con datos de una universidad de ejemplo y grafica. Los controles no admiten los datos de Tijuana. |
| 4. Hoja de cálculo | Consulta la estructura de la tabla y la explicación de cada fórmula. |
| 5. Ruta por pregunta | Sigue los pasos para cada pregunta, sin valores. |
| 6. ¿Lo entendí? | Responde tres preguntas de opción múltiple con retroalimentación. |
| 7. Antes de entregar | Marca la lista de revisión. |

## Actividad integradora 4 · La mejor opción

| Sección | Qué hace el estudiante |
|---|---|
| 1. Presupuesto | Revisa un presupuesto con saldo negativo, ajusta gastos variables hasta obtener excedente o captura sus propios datos. |
| 2. Excedente | Reparte el excedente en ahorro, crédito e inversión (40/30/30, 34/33/33, 50/25/25 o personalizado). La parte de crédito es la capacidad de pago. |
| 3. Interés | Compara interés simple y compuesto con un ejemplo paso a paso. |
| 4. Comparador | Compara tres tiendas de ejemplo, la compra combinada y el pago de contado, y verifica si la mensualidad cabe en su capacidad de pago. |
| 5. Hoja de cálculo | Consulta las fórmulas para llenar la tabla, con `MIN`, `INDICE` y `COINCIDIR`. |
| 6. Ruta por pregunta | Sigue los pasos para la tabla, las dos preguntas y la estrategia. |
| 7. ¿Lo entendí? | Responde tres preguntas con retroalimentación. |
| 8. Antes de entregar | Marca la lista de revisión. |

## Estructura

```
index.html          Página principal
assets/styles.css   Estilos
assets/app.js       Lógica interactiva (sin dependencias)
.nojekyll           Evita que GitHub Pages procese los archivos con Jekyll
tests/test_page.py  Prueba automatizada (opcional)
```

No requiere instalación ni servidor. Solo carga las fuentes de Google Fonts; si no hay conexión, usa las fuentes del sistema.

## Publicar en GitHub Pages

1. Crea un repositorio público en GitHub (por ejemplo, `proyeccion-poblacion`).
2. Sube **todo el contenido** de esta carpeta a la raíz del repositorio, incluido el archivo `.nojekyll`. Si usas la opción “Add file → Upload files”, arrastra la carpeta completa para conservar `assets/`.
3. Ve a **Settings → Pages**.
4. En **Build and deployment**, elige **Source: Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
5. Espera uno o dos minutos. La dirección será:
   `https://TU-USUARIO.github.io/proyeccion-poblacion/`

Para probarla en tu equipo, abre `index.html` con doble clic.

## Ajustar datos del ejemplo

Los rangos de los controles están en `index.html` (atributos `min`, `max`, `step` y `value` de cada `input type="range"`). Si los cambias, verifica que no incluyan los datos de la actividad: 29 000 estudiantes, 4 %, 2 000, 5 % y $17 500.

En la actividad 4, el presupuesto de ejemplo y las tiendas X, Y y Z están en `assets/app.js` (constantes `INCOME`, `EXPENSES` y `STORES`). Las tasas del comparador van de 1 % a 5 % (constante `RATES`) para que no se puedan capturar las tasas de la actividad (6 %, 8 % y 9 %).

## Prueba automatizada (opcional)

Requiere Python y Playwright:

```
pip install playwright
python -m playwright install chromium
python tests/test_page.py "$(pwd)"
```

Revisa, en tamaño de escritorio y de celular, los cálculos de la tienda y del simulador, las cuatro gráficas, los casos de población decreciente y constante, el bloqueo de los datos de Tijuana, las fórmulas, el cuestionario, la lista de revisión, el presupuesto, el reparto del excedente, el interés simple y compuesto, el comparador, la navegación entre actividades y que no haya desbordamiento horizontal.

## Autor

Jorge Luis Hernández Ulloa · Asesor virtual, Prepa en Línea-SEP.
