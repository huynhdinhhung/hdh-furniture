'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {shop,useResource,type User} from '@/lib/shop';
export default function AccountPage(){
 const router=useRouter();
 const {data:user,loading,error,reload}=useResource<User|null>('/auth/me');
 const [register,setRegister]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');
    const form=new FormData(event.currentTarget);
    
    try{
      await shop('/auth/'+(register?'register':'login'),'POST',{email:form.get('email'),password:form.get('password'),...(register?{fullName:form.get('fullName')}:{})});
      router.push('/gio-hang');
    }catch(e){
      setMessage((e as Error).message);
    }finally{
      setBusy(false);
    }
  }

  if(loading)return <section className="min-h-[70vh] flex items-center justify-center" role="status"><div className="animate-pulse flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-line border-t-wood rounded-full animate-spin"></div><p className="text-gray-500">Đang tải...</p></div></section>;
  if(forgotPassword)return <section className="section commerce-page"><h1>Khôi phục mật khẩu</h1><p>Khôi phục qua email chưa được cấu hình trong phiên bản thử nghiệm này.</p><button className="button" onClick={()=>setForgotPassword(false)}>Quay lại đăng nhập</button></section>;
  return (
    <section className="min-h-[75vh] flex items-center justify-center bg-paper/50 py-12 px-4">
      <div className="bg-white border border-line shadow-sm rounded-xl p-8 md:p-10 w-full max-w-[480px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif mb-2">{user ? 'Tài khoản của bạn' : forgotPassword ? 'Phục hồi mật khẩu' : register ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
          <p className="text-gray-500 text-sm">
            {user ? 'Quản lý thông tin và đơn hàng của bạn' : forgotPassword ? 'Nhập email của bạn để nhận liên kết khôi phục' : register ? 'Tạo tài khoản để theo dõi đơn hàng dễ dàng' : 'Đăng nhập để xem lịch sử mua hàng và giỏ hàng'}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg mb-6 text-sm" role="alert">{error}</div>}
        {message && <div className={message.includes('Tính năng') ? "bg-blue-50 text-blue-700 border border-blue-200 p-4 rounded-lg mb-6 text-sm" : "bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg mb-6 text-sm"} role="alert">{message}</div>}

        {user ? (
          <div className="space-y-6">
            <div className="bg-paper p-5 rounded-lg border border-line">
              <p className="font-medium text-lg mb-1">{user.fullName}</p>
              <p className="text-gray-600 mb-3">{user.email}</p>
              <span className="inline-block bg-wood/10 text-wood px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wider">
                {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <Link className="flex justify-center items-center py-3 bg-forest text-white rounded-lg hover:bg-forest/90 transition-colors" href="/don-hang">Đơn hàng của tôi</Link>
              {user.role === 'ADMIN' && <Link className="flex justify-center items-center py-3 bg-wood text-white rounded-lg hover:bg-wood/90 transition-colors" href="/admin">Trang quản trị</Link>}
              <button 
                className="py-3 text-gray-600 border border-line rounded-lg hover:bg-gray-50 transition-colors" 
                onClick={async()=>{
                  try{await shop('/auth/logout','POST');reload();router.push('/tai-khoan');}
                  catch(e){setMessage((e as Error).message);}
                }}>
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={submit}>
            {!forgotPassword && register && (
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Họ và tên
                <input className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-shadow" name="fullName" autoComplete="name" minLength={2} maxLength={120} required/>
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email
              <input className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-shadow" name="email" type="email" autoComplete="email" maxLength={254} required/>
            </label>
            
            {!forgotPassword && (
              <div className="flex flex-col gap-1.5 text-sm font-medium relative">
                <div className="flex justify-between">
                  <label htmlFor="password-field">Mật khẩu</label>
                  {!register && (
                    <button type="button" onClick={() => {setForgotPassword(true); setMessage('');}} className="text-wood hover:underline text-xs font-normal">Quên mật khẩu?</button>
                  )}
                </div>
                <div className="relative">
                  <input id="password-field" className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-shadow pr-12" name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 10 : 1} maxLength={128} required/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {!forgotPassword && register && <p className="text-xs text-gray-500">Mật khẩu ít nhất 10 ký tự. Giỏ hàng khách sẽ được gộp vào tài khoản; số lượng vượt tồn kho được điều chỉnh.</p>}
            
            <button className="mt-2 py-3.5 bg-forest text-white rounded-lg hover:bg-forest/90 transition-colors font-medium flex justify-center items-center gap-2 disabled:opacity-70" disabled={busy}>
              {busy ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : null}
              {busy ? 'Đang xử lý...' : forgotPassword ? 'Gửi liên kết' : register ? 'Đăng ký' : 'Đăng nhập'}
            </button>
            
            <div className="text-center mt-4 pt-4 border-t border-line flex flex-col gap-3">
              {forgotPassword ? (
                <button type="button" className="text-sm text-gray-600 hover:text-wood transition-colors" onClick={()=>{setForgotPassword(false);setMessage('');}}>
                  Quay lại đăng nhập
                </button>
              ) : (
                <button type="button" className="text-sm text-gray-600 hover:text-wood transition-colors" onClick={()=>{setRegister(v=>!v);setMessage('');}}>
                  {register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
