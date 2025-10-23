import axios from 'axios';

// Configura la URL base según tu entorno
// IMPORTANTE: Para dispositivos móviles físicos, usa tu IP local
const API_URL = 'https://ventaveloz-backend.onrender.com/api';

// CONFIGURACIONES ALTERNATIVAS:
// Para Android Emulator, usa: http://10.0.2.2:4000/api
// Para iOS Simulator, usa: http://localhost:4000/api
// Para dispositivo físico, usa: http://192.168.1.74:4000/api (tu IP local)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
