'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { LayoutDashboard, Package, DollarSign, Power, Save, ChevronLeft, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
  router.refresh() 
}
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [salvando, setSalvando] = useState(null)
  const router = useRouter()

 useEffect(() => {
  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login') // Se não estiver logado, vai para o login
    } else {
      fetchProdutos()
    }
  }
  checkUser()
}, [])

  async function fetchProdutos() {
    const { data } = await supabase
      .from('produtos')
      .select('*, categorias(nome)')
      .order('nome', { ascending: true })
    if (data) setProdutos(data)
    setLoading(false)
  }

  // Função para atualizar o status (Disponível ou Não)
  async function alternarDisponibilidade(id, statusAtual) {
    setSalvando(id)
    const { error } = await supabase
      .from('produtos')
      .update({ disponivel: !statusAtual })
      .eq('id', id)
    
    if (!error) await fetchProdutos()
    setSalvando(null)
  }

  // Função para atualizar preço
  async function atualizarPreco(id, novoPreco) {
    setSalvando(id)
    const valor = parseFloat(novoPreco.replace(',', '.'))
    const { error } = await supabase
      .from('produtos')
      .update({ preco: valor })
      .eq('id', id)
    
    if (!error) await fetchProdutos()
    setSalvando(null)
  }

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Header Admin */}
      
      <header className="bg-zinc-900 p-6 text-white sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <a href="/" className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all">
              <ChevronLeft size={20} />
            </a>
            <h1 className="text-xl font-black italic flex items-center gap-2">
              <LayoutDashboard className="text-orange-500" /> PAINEL GESTÃO
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-[10px] font-bold bg-orange-600 px-3 py-1 rounded-full uppercase">
              Admin Logado
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-red-500/20"
            >
              <Power size={16} />
              SAIR
            </button>
          </div>
        </div>
      </header>

      <section className="p-6 max-w-6xl mx-auto">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-zinc-100">
            <Package className="text-orange-500 mb-2" />
            <p className="text-zinc-400 text-xs font-bold uppercase">Total de Itens</p>
            <p className="text-3xl font-black">{produtos.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-zinc-100">
            <Power className="text-green-500 mb-2" />
            <p className="text-zinc-400 text-xs font-bold uppercase">Itens Ativos</p>
            <p className="text-3xl font-black text-green-600">{produtos.filter(p => p.disponivel).length}</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-zinc-100">
            <Search className="text-blue-500 mb-2" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="w-full mt-2 bg-zinc-100 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {/* Container Principal */}
        <div className="bg-white rounded-[32px] shadow-sm border border-zinc-100 overflow-hidden">
          {/* Cabeçalho visível apenas em Desktop */}
          <div className="hidden md:grid grid-cols-4 bg-zinc-50 border-b border-zinc-100 p-6">
            <div className="text-[10px] font-black uppercase text-zinc-400 col-span-2">Produto</div>
            <div className="text-[10px] font-black uppercase text-zinc-400">Preço (R$)</div>
            <div className="text-[10px] font-black uppercase text-zinc-400 text-center">Status</div>
          </div>

          <div className="divide-y divide-zinc-50">
            {produtosFiltrados.map((prod) => (
              <div key={prod.id} className="p-5 md:p-6 flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-0 items-start md:items-center hover:bg-zinc-50 transition-colors">
                
                {/* Lado Esquerdo: Info do Produto */}
                <div className="col-span-2 w-full">
                  <p className="font-bold text-zinc-800 text-base md:text-sm leading-tight">{prod.nome}</p>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mt-1">
                    {prod.categorias?.nome}
                  </p>
                </div>

                {/* Lado Direito: Controles (Preço e Botão) */}
                <div className="flex items-center justify-between w-full md:contents">
                  {/* Preço */}
                  <div className="flex flex-col md:block">
                    <span className="md:hidden text-[9px] font-black text-zinc-300 uppercase mb-1">Preço</span>
                    <input 
                      type="text" 
                      defaultValue={prod.preco.toFixed(2)} 
                      onBlur={(e) => atualizarPreco(prod.id, e.target.value)}
                      className="w-20 md:w-24 bg-zinc-100 p-2 rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-green-500 text-center"
                    />
                  </div>

                  {/* Botão de Status */}
                  <div className="flex flex-col items-end md:items-center">
                    <span className="md:hidden text-[9px] font-black text-zinc-300 uppercase mb-1">Status</span>
                    <button 
                      onClick={() => alternarDisponibilidade(prod.id, prod.disponivel)}
                      disabled={salvando === prod.id}
                      className={`p-3 md:p-3.5 rounded-2xl transition-all ${
                        prod.disponivel 
                        ? 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white' 
                        : 'bg-red-100 text-red-500 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      {salvando === prod.id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"/>
                      ) : (
                        <Power size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>      </section>
    </main>
  )
}