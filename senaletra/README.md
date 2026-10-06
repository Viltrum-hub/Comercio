# SeñaLetra · LESSA Lab

Laboratorio educativo para reconocer posiciones de una mano y movimientos mediante ejemplos personales. Interfaz responsive, cámara local y referencias educativas de LESSA.

## Alcance real

MediaPipe localiza las manos. El clasificador usa reglas iniciales experimentales para A, B, I, L, V, W, Y, comparación de ejemplos estáticos y alineación temporal DTW de secuencias. No se ha entrenado ni validado un modelo general de LESSA con videos de múltiples personas. Las reglas iniciales no están verificadas contra el alfabeto salvadoreño. No se admiten aún señas de dos manos, expresión facial ni traducción de conversaciones.

## Aprendizaje personal

1. Activar cámara con permiso y una sola mano completa.
2. Consultar una referencia real desde Aprender.
3. Abrir Mi calibración, seleccionar letra o escribir una etiqueta.
4. Posición: cuenta atrás y 2,5 segundos de captura. Repetir al menos 3 veces en distintas condiciones.
5. Movimiento: cuenta atrás, realizar la seña completa y pulsar Terminar. Repetir lento, normal y rápido. El clasificador necesita al menos 2 ejemplos por etiqueta; se recomiendan 3 o más.
6. Pulsar Reconocer movimiento, realizar la seña y terminar. El resultado se conserva para confirmarlo; Continuar detección reanuda las letras.
7. Exportar/importar ejemplos para compartir calibraciones o combinar participantes. Verificar etiquetas y referencias antes de importarlas.

Los movimientos se remuestrean a 24 fotogramas de características y se comparan por DTW. Esto compensa duración y variación temporal, pero no garantiza generalización a cualquier persona. No se presentan distancias como porcentajes de precisión.

## Ejecución

Servir esta carpeta mediante localhost o HTTPS. Para probar localmente: `python -m http.server 8000 --directory senaletra` y abrir http://localhost:8000. Los datos se guardan en localStorage de cada navegador y origen. No se guardan fotos ni videos; solo coordenadas.

La publicación incluye vendor/ con MediaPipe y modelo oficial local. Si la copia de GitHub no incluye vendor/, app.js utiliza las mismas versiones desde jsDelivr y Google; necesita conexión para cargarlas. El video sigue procesándose localmente.

## Referencias

- https://sites.google.com/clases.edu.sv/lessa/recursos-m%C3%B3dulo-2
- https://sites.google.com/clases.edu.sv/lessa/m%C3%B3dulo-2
- https://editorial.ues.edu.sv/dees-lessa/

La guía del abecedario usa recortes de la lámina educativa LESSA Módulo 2 y mantiene la lámina completa con sus créditos para impresión. Los demás recursos se enlazan. Estas imágenes no son un corpus de entrenamiento.

## Verificación

`node tests/recognition.test.mjs`: normalización de tamaño, posición y espejo, rechazo de calibraciones ambiguas, remuestreo de secuencias de distinta duración y validación de importaciones. `node --check dist/app.js`: sintaxis. La precisión lingüística y el reconocimiento con cámara real requieren evaluación en el dispositivo del usuario. No se ha hecho una prueba de cámara real en esta ejecución.
