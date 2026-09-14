import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('http://localhost:5210/api/auth/login', {
        username,
        password
      });

      const token = response.data.token;
      const fullName = response.data.fullName;
      const role = response.data.role; // استلام صلاحية المستخدم من الـ Backend

      // تخزين البيانات في LocalStorage (بما فيها الـ Role)
      localStorage.setItem('token', token);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('role', role || 'User'); // حفظ الصلاحية أو افتراضياً User

      // استدعاء دالة التحديث لتوجيه المستخدم للداشبورد
      onLoginSuccess(token, fullName);

    } catch (error) {
      setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <h2 style={styles.loginTitle}>بريد السودان</h2>
          <p style={styles.loginSubtitle}>نظام إدارة الأصول والأملاك</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>اسم المستخدم</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              style={styles.input}
              placeholder="أدخل اسم المستخدم"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>كلمة المرور</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}
      </div>
    </div>
  );
}

const styles = {
  loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9', direction: 'rtl' },
  loginCard: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '420px' },
  loginHeader: { textAlign: 'center', marginBottom: '25px' },
  loginTitle: { margin: '0 0 5px 0', fontSize: '28px', color: '#0f172a', fontWeight: 'bold' },
  loginSubtitle: { margin: '0', fontSize: '15px', color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' },
  label: { fontSize: '15px', fontWeight: '600', color: '#334155' },
  input: { padding: '12px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none' },
  submitBtn: { padding: '12px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '17px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
  errorText: { color: '#dc2626', fontSize: '14px', textAlign: 'center', marginTop: '15px' }
};