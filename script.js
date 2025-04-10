// --- Verificación de Autenticación (AÑADIR ESTO AL INICIO DE script.js) ---
// Comprueba si el usuario pasó por la página de login en esta sesión
if (sessionStorage.getItem('isAuthenticated') !== 'true') {
    console.log("Usuario no autenticado. Redirigiendo al login...");
    // Si no está autenticado, lo mandamos de vuelta al login
    window.location.href = 'login.html';

    // Detenemos la ejecución del resto del script para que no inicialice el chat
    throw new Error("Redirección necesaria: Usuario no autenticado.");
}

// --- Si llegamos aquí, el usuario está "autenticado" (pasó el login) ---
console.log("Usuario autenticado en esta sesión.");

// -----------------------------------------------------------------------
// A PARTIR DE AQUÍ VA TODO TU CÓDIGO EXISTENTE DE script.js:
// import { initializeApp } from "...";
// import { getDatabase, ... } from "...";
// const firebaseConfig = { ... };
// const app = initializeApp(firebaseConfig);
// etc...
// -----------------------------------------------------------------------

// --- 1. Importar funciones de Firebase v9 ---
// Necesitamos initializeApp para conectar, y las funciones de Database
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    serverTimestamp // Para la hora del servidor
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
// Nota: Usamos URLs directas para evitar necesitar un "bundler" como Webpack/Parcel

// --- 2. Configuración de Firebase ---
// Usa la configuración que obtuviste de tu consola Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAYE55NhGtPuiTuG6MWC_XtgJSlpO_ka0E", // Tu API Key
  authDomain: "chatweb-ca771.firebaseapp.com",
  // databaseURL: "https://chatweb-ca771-default-rtdb.firebaseio.com", // DESCOMENTA si es necesario (a veces v9 lo necesita)
  projectId: "chatweb-ca771",
  storageBucket: "chatweb-ca771.firebasestorage.app", // Corregido: suele terminar en .appspot.com
  messagingSenderId: "214110084201",
  appId: "1:214110084201:web:b3b3053f091b6296b456f8",
  measurementId: "G-C20P7Z1FZ5" // Opcional para Analytics
};

// --- 3. Inicializar Firebase ---
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Obtener referencia a la base de datos

// --- 4. Variables Globales y Referencias al DOM ---
const chatbox = document.getElementById('chatbox');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const usernameDisplay = document.getElementById('usernameDisplay');

let currentUsername = "Anónimo"; // Nombre de usuario por defecto

// --- 5. Obtener nombre de usuario (Método Simple) ---
function getUsername() {
    // Intenta obtener el nombre guardado en el navegador
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        currentUsername = savedUsername;
    } else {
        // Si no hay nombre guardado, preguntarlo
        const name = prompt("Por favor, ingresa tu nombre o apodo para el chat:", "Usuario");
        if (name && name.trim() !== "") {
            currentUsername = name.trim();
            // Guardar en localStorage para futuras visitas
            localStorage.setItem('chatUsername', currentUsername);
        } else {
             currentUsername = "Anónimo_" + Math.random().toString(36).substring(2, 7); // Un anónimo aleatorio si cancela
             localStorage.setItem('chatUsername', currentUsername); // Guardar también el anónimo aleatorio
        }
    }
    // Mostrar el nombre en la UI
    usernameDisplay.textContent = currentUsername;
}

// Llamar a la función para obtener el nombre al cargar la página
getUsername();

// --- 6. Referencia a la colección de mensajes en la BD ---
const messagesRef = ref(database, 'messages'); // 'messages' es el nodo/camino

// --- 7. Función para enviar mensajes ---
function sendMessage() {
    const messageText = messageInput.value.trim();

    if (messageText !== "" && currentUsername) {
        const message = {
            username: currentUsername, // Añadimos el nombre de usuario
            text: messageText,
            timestamp: serverTimestamp() // Usamos la hora del servidor Firebase
        };

        // Guardar el mensaje en Firebase usando push (genera ID único)
        push(messagesRef, message)
            .then(() => {
                messageInput.value = ""; // Limpiar el input
                console.log("Mensaje enviado por:", currentUsername);
            })
            .catch((error) => {
                console.error("Error al enviar mensaje:", error);
                alert("Hubo un error al enviar tu mensaje."); // Informar al usuario
            });
    } else if (messageText === "") {
        console.log("No se puede enviar mensaje vacío.");
    } else {
        alert("Necesitas un nombre de usuario para enviar mensajes. Refresca la página.");
    }
}

// --- 8. Función para mostrar un mensaje en el chatbox ---
function displayMessage(messageData, messageId) { // Pasamos el ID por si lo necesitas
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    // messageElement.dataset.id = messageId; // Guarda el ID en el elemento (opcional)

    // Comprobar si el mensaje es del usuario actual
    if (messageData.username === currentUsername) {
        messageElement.classList.add('sent'); // Añade clase para estilo diferente
    }

    // Crear elemento para el nombre de usuario
    const usernameElement = document.createElement('div');
    usernameElement.classList.add('username');
    usernameElement.textContent = messageData.username || 'Usuario Desconocido'; // Nombre o texto por defecto
    messageElement.appendChild(usernameElement);

    // Crear elemento para el texto del mensaje
    const textElement = document.createElement('p');
    textElement.textContent = messageData.text;
    messageElement.appendChild(textElement);

    // Crear elemento para la hora
    const timestampElement = document.createElement('div');
    timestampElement.classList.add('timestamp');
    if (messageData.timestamp) {
        // Formatear la hora HH:MM
        const date = new Date(messageData.timestamp);
         const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); // Formato 24h más corto
        // const timeString = date.toLocaleString(); // Formato más completo
        timestampElement.textContent = timeString;
    }
    messageElement.appendChild(timestampElement);


    chatbox.appendChild(messageElement);

    // Auto-scroll hacia abajo SOLO si estamos cerca del fondo
    // Esto evita que el scroll salte si estás leyendo mensajes antiguos
    const scrollThreshold = 100; // Píxeles desde el fondo
    const isNearBottom = chatbox.scrollHeight - chatbox.scrollTop - chatbox.clientHeight < scrollThreshold;
    if (isNearBottom) {
      scrollToBottom();
    }
}

// Función para hacer scroll al fondo suavemente (opcional)
function scrollToBottom() {
   // chatbox.scrollTop = chatbox.scrollHeight; // Directo (sin animación)
   chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: 'smooth' }); // Con animación
}


// --- 9. Escuchar nuevos mensajes con onChildAdded ---
// Se ejecuta por cada mensaje existente y por cada nuevo mensaje que se añade
onChildAdded(messagesRef, (snapshot) => {
    const message = snapshot.val(); // Obtener los datos del mensaje
    const messageId = snapshot.key; // Obtener el ID único del mensaje
    if (message && message.text) { // Verifica que el mensaje tenga al menos texto
       displayMessage(message, messageId);
    } else {
        console.warn("Mensaje recibido con formato inesperado:", messageId, message);
    }
});

// --- 10. Event Listeners para enviar ---
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', function (e) {
    // Enviar con Enter, pero no con Shift + Enter (para permitir saltos de línea si fuera un textarea)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Evita el comportamiento por defecto (salto de línea)
        sendMessage();
    }
});


// --- Inicializar Scroll al cargar (por si hay mensajes previos) ---
// Espera un poco a que los mensajes iniciales se carguen antes de hacer scroll
setTimeout(scrollToBottom, 1000); // Ajusta el tiempo si es necesario

console.log("Chat v9 inicializado. Esperando mensajes...");


// --- ¡Recordatorio de Seguridad! ---
// Estás usando reglas de seguridad en "modo de prueba".
// Antes de compartir tu chat, ve a Firebase -> Realtime Database -> Reglas
// y configúralas para mayor seguridad (por ejemplo, requerir autenticación).
// Reglas básicas (solo permitir usuarios autenticados escribir):
/*
{
  "rules": {
    "messages": {
      ".read": "auth != null", // Cualquiera autenticado puede leer
      ".write": "auth != null", // Cualquiera autenticado puede escribir
      "$messageId": {
        // Validar que el mensaje tenga username, text y timestamp
        ".validate": "newData.hasChildren(['username', 'text', 'timestamp'])",
        "username": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length < 50" },
        "text": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length < 500" },
        "timestamp": { ".validate": "newData.val() <= now" } // Asegura que el timestamp no sea futuro
      }
    }
    // Podrías añadir reglas más específicas
  }
}
*/