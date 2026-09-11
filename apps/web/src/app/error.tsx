'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="section"><div className="notice" role="alert"><h1>Chưa thể tải trang</h1><p>Vui lòng thử lại sau ít phút.</p><button className="button" onClick={reset}>Thử lại</button></div></section>; }
