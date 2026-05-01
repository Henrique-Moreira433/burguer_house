'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Lock, User, Utensils, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()


  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function handleLogin(e) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

      if (error) {
        setErro("Credenciais inválidas ou e-mail não confirmado.")
        setCarregando(false)
      } else {
        
        router.push('/admin')
        router.refresh() 
      }
    } catch (err) {
      setErro("Erro na comunicação com o servidor.")
      setCarregando(false)
    }
  }


  return (
    <main className="min-h-screen bg-orange-600 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Branding Admin */}
        <div className="text-center mb-10">
          <div className="bg-orange-100 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-4 text-orange-600 shadow-inner">
            <Utensils size={40} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900">BURGUER HOUSE</h1>
          <div className="inline-block bg-zinc-100 px-4 py-1.5 rounded-full mt-3">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Painel de Controle</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Campo de E-mail */}
          <div className="relative">
            <User className="absolute left-4 top-4.5 text-zinc-400" size={20} />
            <input 
              type="email" 
              placeholder="E-mail Administrativo" 
              className="w-full bg-zinc-100 p-4.5 pl-12 rounded-2xl outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all text-zinc-800"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Campo de Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-4.5 text-zinc-400" size={20} />
            <input 
              type="password" 
              placeholder="Senha de Acesso" 
              className="w-full bg-zinc-100 p-4.5 pl-12 rounded-2xl outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all text-zinc-800"
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          
          {/* Mensagem de Erro Amigável */}
          {erro && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">{erro}</p>
            </div>
          )}

          {/* Botão de Entrar */}
          <button 
            disabled={carregando}
            className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all shadow-xl shadow-orange-900/20 active:scale-[0.98] disabled:opacity-50"
          >
            {carregando ? "Autenticando..." : "Acessar Sistema"}
          </button>
        </form>

        <p className="text-center mt-8 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
          Acesso Restrito a Colaboradores
        </p>
      </div>
    </main>
  )
}