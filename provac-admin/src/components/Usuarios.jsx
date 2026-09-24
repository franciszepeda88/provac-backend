import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './Usuarios.css';

const ROL_LABELS = {
  admin: 'Administrador',
  technician: 'Técnico'
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState('technician');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetGuardando, setResetGuardando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      const lista = Array.isArray(data.usuarios) ? data.usuarios : [];
      // Las solicitudes de restablecimiento pendientes van primero, para que no pasen desapercibidas
      lista.sort((a, b) => (b.reset_solicitado_en ? 1 : 0) - (a.reset_solicitado_en ? 1 : 0));
      setUsuarios(lista);
    } catch (err) {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    setMensaje('');
    if (!nuevoNombre || !nuevoEmail || !nuevoPassword) {
      setMensaje('⚠️ Completa nombre, correo y contraseña');
      return;
    }
    if (nuevoPassword.length < 6) {
      setMensaje('⚠️ La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nuevoNombre,
          email: nuevoEmail,
          password: nuevoPassword,
          rol: nuevoRol
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setMensaje('❌ ' + (result.error || 'No se pudo crear el usuario'));
        setGuardando(false);
        return;
      }
      setMensaje('✅ Usuario creado correctamente');
      setNuevoNombre('');
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoRol('technician');
      setMostrarForm(false);
      cargarUsuarios();
    } catch (err) {
      setMensaje('❌ Error de conexión: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const restablecerPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setResetGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/usuarios/${resetUserId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: resetPassword })
      });
      if (!response.ok) throw new Error('No se pudo restablecer la contraseña');
      alert('✅ Contraseña actualizada. Comunícasela al usuario.');
      setResetUserId(null);
      setResetPassword('');
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setResetGuardando(false);
    }
  };

  return (
    <div className="usr-container">
      <div className="usr-header">
        <h2>Usuarios</h2>
        <button className="usr-btn-nuevo" onClick={() => setMostrarForm(v => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {mostrarForm && (
        <form className="usr-form" onSubmit={crearUsuario}>
          {mensaje && <div className="usr-mensaje">{mensaje}</div>}
          <div className="usr-form-row">
            <div className="usr-field">
              <label>Nombre completo</label>
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre del técnico o admin" />
            </div>
            <div className="usr-field">
              <label>Correo electrónico</label>
              <input type="email" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} placeholder="correo@empresa.com" />
            </div>
          </div>
          <div className="usr-form-row">
            <div className="usr-field">
              <label>Contraseña</label>
              <input type="password" value={nuevoPassword} onChange={e => setNuevoPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="usr-field">
              <label>Rol</label>
              <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}>
                <option value="technician">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <button type="submit" className="usr-btn-guardar" disabled={guardando}>
            {guardando ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      )}

      {loading && <p className="usr-hint">Cargando usuarios...</p>}
      {error && <div className="usr-alert-error">{error}</div>}

      {!loading && !error && (
        <div className="usr-tabla-wrap">
          <table className="usr-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Alta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    {u.nombre}
                    {u.reset_solicitado_en && (
                      <div className="usr-pendiente-badge" title={new Date(u.reset_solicitado_en).toLocaleString('es-HN')}>
                        ⏳ Solicitó restablecer contraseña
                      </div>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`usr-rol-badge ${u.rol === 'admin' ? 'usr-rol-admin' : 'usr-rol-tech'}`}>
                      {ROL_LABELS[u.rol] || u.rol}
                    </span>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('es-HN') : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className={u.reset_solicitado_en ? 'usr-btn-reset usr-btn-reset-urgente' : 'usr-btn-reset'}
                      onClick={() => { setResetUserId(u.id); setResetPassword(''); }}
                    >
                      Restablecer contraseña
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan={5} className="usr-hint">No hay usuarios registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {resetUserId && (
        <div className="usr-modal-overlay" onClick={() => setResetUserId(null)}>
          <div className="usr-modal" onClick={e => e.stopPropagation()}>
            <h3>Restablecer contraseña</h3>
            <p className="usr-hint">Define una contraseña nueva y compártela con el usuario por el medio que prefieras.</p>
            <form onSubmit={restablecerPassword}>
              <div className="usr-field">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  autoFocus
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="usr-modal-actions">
                <button type="button" className="usr-btn-cancelar" onClick={() => setResetUserId(null)}>Cancelar</button>
                <button type="submit" className="usr-btn-guardar" disabled={resetGuardando}>
                  {resetGuardando ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
