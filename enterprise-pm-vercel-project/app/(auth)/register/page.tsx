import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <section className="w-full max-w-md rounded-lg border border-line bg-slate-900 p-6 shadow-glow">
        <p className="text-sm font-semibold uppercase text-sky-300">Enterprise PM</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">New registrations start as Members.</p>
        <RegisterForm />
      </section>
    </main>
  );
}
