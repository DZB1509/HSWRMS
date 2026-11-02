import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { billingApi } from '../../features/m5-billing/api/billingApi';

/**
 * Landing page for VNPay's vnp_ReturnUrl. Sends the signed query string to the backend for
 * HMAC-SHA512 verification (idempotent settlement), then closes the popup; the S42 page that opened it
 * is already polling and navigates to the result screen by itself.
 */
export const VnpayReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    billingApi
      .verifyVnpayReturn(window.location.search)
      .then((r) => {
        if (!active) return;
        setState(r.success ? 'success' : 'failed');
        setMessage(r.message);
        if (window.opener) setTimeout(() => window.close(), 2500);
      })
      .catch((e: any) => {
        if (!active) return;
        setState('failed');
        setMessage(e?.message || 'Không thể xác thực kết quả thanh toán.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      {state === 'loading' && <Loader2 size={40} className="hsw-spin" />}
      {state === 'success' && <CheckCircle2 size={48} color="#16a34a" />}
      {state === 'failed' && <XCircle size={48} color="#dc2626" />}
      <h2 style={{ margin: '12px 0 6px' }}>
        {state === 'loading' ? 'Đang xác thực giao dịch VNPay...' : state === 'success' ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}
      </h2>
      <p style={{ color: '#64748b', fontSize: 14 }}>{message}</p>
      {state !== 'loading' && (
        <button type="button" className="hsw-btn hsw-btn-secondary" onClick={() => (window.opener ? window.close() : navigate(-1))}>
          {window.opener ? 'Đóng cửa sổ' : 'Quay lại'}
        </button>
      )}
    </div>
  );
};

export default VnpayReturnPage;

