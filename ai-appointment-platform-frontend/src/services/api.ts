// src/services/api.ts
import type { Cita } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // --- AUTENTICACIÓN ---
  loginConGoogle: async (googleToken: string) => {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken })
    });
    if (!response.ok) throw new Error('Error al autenticar con Google');
    return await response.json();
  },

  register: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al registrarse');
    return data;
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Credenciales incorrectas');
    return data;
  },

  me: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return null;
      return await response.json(); // incluye { id, nombre, email, rol, negocio }
    } catch {
      return null;
    }
  },

  // Obtener citas (opcional filtro por fecha)
  obtenerCitas: async (fecha?: string): Promise<Cita[]> => {
    try {
      const url = fecha
        ? `${API_URL}/citas?fecha=${fecha}`
        : `${API_URL}/citas`;

      const response = await fetch(url, { headers: getHeaders() });
      if (!response.ok) {
        if (response.status === 401) throw new Error('No autorizado');
        throw new Error('Error al obtener citas');
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Obtener solo las que necesitan validación de pago
  obtenerPendientes: async (): Promise<Cita[]> => {
    try {
      const response = await fetch(`${API_URL}/citas/pendientes`, { headers: getHeaders() });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      return [];
    }
  },

  // Validar o Rechazar un pago
  validarPago: async (id: string, accion: 'APROBAR' | 'RECHAZAR'): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/citas/${id}/validar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ accion })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // Obtener horarios disponibles (público o privado si se requiere)
  obtenerHorariosDisponibles: async (fecha: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_URL}/citas/horarios-disponibles?fecha=${fecha}`, { headers: getHeaders() });
      if (!response.ok) throw new Error('Error al obtener horarios');
      const data = await response.json();
      return data.horarios || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Crear cita desde panel admin
  crearCitaAdmin: async (datos: {
    clienteNombre: string;
    clienteTelefono: string;
    fecha: string;
    horario: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/citas/admin`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error al crear la cita' };
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  // Obtener resumen del dashboard
  obtenerResumen: async () => {
    try {
      const response = await fetch(`${API_URL}/citas/resumen`, { headers: getHeaders() });
      if (!response.ok) {
        if (response.status === 401) throw new Error('No autorizado');
        throw new Error('Error al obtener resumen');
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  // Reprogramar cita
  reprogramarCita: async (id: string, fecha: string, horario: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/citas/${id}/reprogramar`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ fecha, horario })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error al reprogramar la cita' };
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  marcarNoAsistio: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/citas/${id}/no-asistio`, {
        method: 'PUT',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error al marcar como no asistió' };
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  marcarAsistio: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/citas/${id}/asistio`, {
        method: 'PUT',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error al marcar como asistió' };
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  // --- DESCRIPCIÓN ---
  actualizarDescripcion: async (id: string, descripcion: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/citas/${id}/descripcion`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ descripcion })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error al actualizar descripción' };
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  // --- CHAT ---
  obtenerConversaciones: async () => {
    try {
      const response = await fetch(`${API_URL}/chat/conversaciones`, { headers: getHeaders() });
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  },

  obtenerMensajes: async (jid: string) => {
    try {
      const response = await fetch(`${API_URL}/chat/mensajes/${encodeURIComponent(jid)}`, { headers: getHeaders() });
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  },

  enviarMensajeChat: async (jid: string, texto: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/chat/enviar/${encodeURIComponent(jid)}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ texto })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error al enviar mensaje' };
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  eliminarConversacion: async (jid: string): Promise<{ success: boolean }> => {
    try {
      const response = await fetch(`${API_URL}/chat/conversacion/${encodeURIComponent(jid)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return response.ok ? { success: true } : { success: false };
    } catch {
      return { success: false };
    }
  },

  // --- WHATSAPP (multi-tenant) ---
  statusWhatsapp: async () => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/status-whatsapp`, { headers: getHeaders() });
      if (!response.ok) return null;
      return await response.json();
    } catch { return null; }
  },

  iniciarBot: async () => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/start-whatsapp`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await response.json();
    } catch (e) { return { error: 'Error de conexión' }; }
  },

  logoutBot: async () => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await response.json();
    } catch (e) { return { error: 'Error de conexión' }; }
  },

  reiniciarBot: async () => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/restart-whatsapp`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await response.json();
    } catch (e) { return { error: 'Error de conexion' }; }
  },

  solicitarCodigoPairing: async (telefono: string) => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/pairing-code`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ telefono })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al solicitar el codigo');
      return data as { codigo: string };
    } catch (e: unknown) { throw e; }
  },

  // --- CONFIGURACION BOT ---
  getConfiguracion: async () => {
    const res = await fetch(`${API_URL}/configuracion`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error obteniendo configuracion');
    return res.json() as Promise<{
      id: number;
      trigger: string;
      mensajeBienvenida: string;
      mensajeConfirmacion: string;
      servicios: { nombre: string; precio: number }[];
      horarios: Record<string, string[]>;
      cobrarAdelanto: boolean;
      porcentajeAdelanto: number;
    }>;
  },

  updateConfiguracion: async (data: {
    trigger?: string;
    mensajeBienvenida?: string;
    mensajeConfirmacion?: string;
    servicios?: { nombre: string; precio: number }[];
    horarios?: Record<string, string[]>;
    cobrarAdelanto?: boolean;
    porcentajeAdelanto?: number;
  }) => {
    const res = await fetch(`${API_URL}/configuracion`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error guardando configuracion');
    }
    return res.json();
  },
};
