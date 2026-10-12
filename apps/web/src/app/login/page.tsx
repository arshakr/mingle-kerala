import Link from 'next/link';
export default function LoginPage() {
  return (
    <main className="login">
      <section className="card">
        <span className="brandmark">m✦</span>
        <p className="eyebrow">INVITATION-ONLY DEVELOPMENT</p>
        <h1>Welcome to Mingle Kerala</h1>
        <p>Google Sign-In and the separate Supabase development project are being configured. Registration is not active yet.</p>
        <p className="status" role="status">🔒 Google login is being configured</p>
        <p>Your Google name and email will not appear on your public anonymous profile. Adults 18+ only.</p>
        <Link href="/" className="return">← Back to the backwaters</Link>
      </section>
    </main>
  );
}
