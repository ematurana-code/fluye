// Configuración pública de la versión web.
// DRIVE_CLIENT_ID: el "ID de cliente" OAuth (tipo aplicación web) del proyecto de Google Cloud "Fluye" (fluye-513019,
// cuenta e.maturana0@gmail.com). No es un secreto: Google lo exige en el navegador y solo funciona desde los orígenes
// autorizados en ese proyecto (solo https://ematurana-code.github.io; para probar en local hay que agregar
// http://localhost:8095 en Google Auth Platform, Clientes, Fluye web, y quitarlo al terminar).
// Vacío = los botones de Google Drive no aparecen.
export const DRIVE_CLIENT_ID = '263504240633-9u52r1evrgvcgi83qimei0lc7dvosdc3.apps.googleusercontent.com';
// Selector de archivos de Google (Google Picker), para abrir cualquier .bpmn del Drive o compartido con la persona.
// DRIVE_API_KEY: clave del mismo proyecto, limitada a la API de Google Picker y a https://ematurana-code.github.io/*
// (tampoco es secreta). DRIVE_APP_ID: número del proyecto; con él, lo que se elige queda dentro del permiso drive.file.
// Clave vacía = "Abrir desde Google Drive" muestra solo la lista de lo que Fluye guardó.
export const DRIVE_API_KEY = '';
export const DRIVE_APP_ID = '263504240633';
