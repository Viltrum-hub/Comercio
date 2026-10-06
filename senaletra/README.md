# SeñaLetra

Prototipo educativo de reconocimiento de letras mediante cámara.

Ejecutar INICIAR_WINDOWS.bat con Python 3 o servir esta carpeta con XAMPP. Entrada: index.html.

## Pendiente
Añadir las carpetas originales vendor/ y assets/, no incluidas en los archivos recibidos. Sin ellas no funcionan el detector ni las imágenes de la guía. app.js espera vendor/vision_bundle.mjs, vendor/wasm/ y vendor/hand_landmarker.task. La guía necesita assets/A.png hasta assets/Z.png y assets/abecedario.png.

Reglas iniciales para A, B, I, L, V, W, Y. Otras letras estáticas requieren calibración. J y Z no están implementadas. Lengua de señas de referencia pendiente de validar.

Consultar LEEME.html y TERCEROS.txt.
