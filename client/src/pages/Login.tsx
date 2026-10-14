import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { LogIn, UserPlus, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [buildings, setBuildings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'signup' || searchParams.get('register') === 'true') {
      setIsRegistering(true);
    }
    const bId = searchParams.get('buildingId');
    if (bId) {
      setSelectedBuildingId(bId);
    }
  }, [searchParams]);

  useEffect(() => {
    // Load available buildings & rooms for contract signup
    authAPI.getSignupOptions()
      .then(res => setBuildings(res.data.buildings || []))
      .catch(err => console.error('Failed to load signup building options:', err));
  }, []);

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  const availableRooms = selectedBuilding?.rooms || [];

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setSelectedBuildingId('');
    setSelectedRoomId('');
    setMoveInDate('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (isRegistering) {
        if (!selectedRoomId) {
          setError('Please select the room unit stated on your rental contract.');
          setLoading(false);
          return;
        }

        const res = await authAPI.registerPublic({
          firstName,
          lastName,
          email,
          phone,
          roomId: selectedRoomId,
          moveInDate,
          password,
        });

        setSuccessMsg(
          res.data?.message ||
          'Registration submitted successfully! Your account is pending landlord approval. Once the landlord verifies your details against your submitted documents, your account will be activated.'
        );
        setIsRegistering(false);
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setSelectedBuildingId('');
        setSelectedRoomId('');
        setMoveInDate('');
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `${isRegistering ? 'Registration' : 'Login'} failed. Please check your credentials.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div style={{ width: '100%', maxWidth: isRegistering ? '480px' : '430px', marginBottom: '0.75rem' }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Homepage</span>
        </Link>
      </div>

      <div className="login-card slide-up" style={{ maxWidth: isRegistering ? '480px' : '430px' }}>
        <div className="logo-section">
          <div className="logo-icon">R</div>
          <h2>{isRegistering ? 'Sign Up' : 'Welcome to RentaHub'}</h2>
          <p className="subtitle">
            {isRegistering
              ? 'Submit your lease contract & personal information for landlord verification'
              : 'Sign in to your property management portal'}
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {successMsg && (
          <div 
            className="login-success" 
            style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '0.85rem 1rem', 
              fontSize: '0.84rem', 
              color: 'var(--success)', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              lineHeight: 1.45
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    id="register-firstname"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="e.g. Maria"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    id="register-lastname"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="e.g. Santos"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  id="register-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 0917-123-4567"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contracted Building *</label>
                  <select
                    id="register-building"
                    value={selectedBuildingId}
                    onChange={e => {
                      setSelectedBuildingId(e.target.value);
                      setSelectedRoomId('');
                    }}
                    required
                  >
                    <option value="">Select Building...</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Room / Unit *</label>
                  <select
                    id="register-room"
                    value={selectedRoomId}
                    onChange={e => setSelectedRoomId(e.target.value)}
                    disabled={!selectedBuildingId}
                    required
                  >
                    <option value="">{selectedBuildingId ? 'Select Room...' : 'Choose building first'}</option>
                    {availableRooms.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.room_number} (Flr {r.floor || '1'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Move-in / Contract Start Date</label>
                <input
                  id="register-movein"
                  type="date"
                  value={moveInDate}
                  onChange={e => setMoveInDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }} disabled={loading}>
            {isRegistering ? (
              <>
                <UserPlus size={18} /> {loading ? 'Submitting Registration...' : 'Submit Registration'}
              </>
            ) : (
              <>
                <LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isRegistering ? 'Already have an approved account?' : 'New tenant with a lease contract?'}{' '}
          <button 
            type="button" 
            onClick={toggleMode}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, padding: 0, fontSize: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {isRegistering ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
