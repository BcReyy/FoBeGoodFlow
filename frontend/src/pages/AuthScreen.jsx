import React, { useState } from 'react';
import Field from '../components/Field.jsx';

export default function AuthScreen({ page, setPage, onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = page === 'signup';
  const isForgot = page === 'forgot';

  function changePage(next) {
    setMessage('');
    setPassword('');
    setConfirm('');
    setPage(next);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (isForgot) {
      setMessage('Password reset is not implemented. Please contact the administrator for account assistance.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMessage('Enter a valid email address.');
      return;
    }
    if (!password) {
      setMessage('Enter your password.');
      return;
    }

    if (isSignup) {
      if (!fullName.trim() || !confirm) {
        setMessage('Complete all registration fields.');
        return;
      }
      if (password.length < 8) {
        setMessage('Use a password with at least 8 characters.');
        return;
      }
      if (password !== confirm) {
        setMessage('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await onRegister(fullName.trim(), email.trim(), password);
        setPassword('');
        setConfirm('');
        setFullName('');
        setPage('login');
        setMessage('Customer account created. Log in using your new credentials.');
      } else {
        await onLogin(email.trim(), password);
        setPassword('');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-brand">
        <div className="auth-logo">FoBeGoodFlow</div>
        <p>Orders and stock for the<br />coffee shop, in one<br />place.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-content">
          <h1>{isForgot ? 'Reset password' : isSignup ? 'Create an account' : 'Log in'}</h1>
          <p className="auth-subtitle">
            {isForgot
              ? 'Password reset is not yet available.'
              : isSignup
                ? 'Customer registration is connected to the local backend.'
                : 'Log in with your FoBeGoodFlow account.'}
          </p>
          <form onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <Field label="Full name" id="signup-name">
                <input id="signup-name" autoComplete="name" value={fullName}
                  onChange={(event) => setFullName(event.target.value)} required disabled={submitting} />
              </Field>
            )}
            <Field label="Email" id="auth-email">
              <input id="auth-email" type="email" autoComplete="email" value={email}
                onChange={(event) => setEmail(event.target.value)} required disabled={submitting} />
            </Field>
            {!isForgot && (
              <Field label="Password" id="auth-password">
                <div className="input-wrap">
                  <input id="auth-password" type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    value={password} onChange={(event) => setPassword(event.target.value)}
                    required disabled={submitting} />
                  <button className="password-toggle" type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>
            )}
            {isSignup && (
              <Field label="Confirm password" id="confirm-password">
                <input id="confirm-password" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required disabled={submitting} />
              </Field>
            )}
            {!isSignup && !isForgot && (
              <button type="button" className="underlined auth-minor"
                onClick={() => changePage('forgot')} disabled={submitting}>
                Forgot password?
              </button>
            )}
            {message && <div className="inline-alert" role="status">{message}</div>}
            <button type="submit" className="primary-button auth-submit" disabled={submitting}>
              {submitting ? 'Please wait...' : isForgot ? 'Reset unavailable' : isSignup ? 'Sign up' : 'Log in'}
            </button>
          </form>
          <div className="auth-switch">
            {isForgot ? (
              <>Remember your password? <button type="button" onClick={() => changePage('login')}>Log in</button></>
            ) : isSignup ? (
              <>Already have an account? <button type="button" onClick={() => changePage('login')}>Log in</button></>
            ) : (
              <>New customer? <button type="button" onClick={() => changePage('signup')}>Create an account</button></>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
