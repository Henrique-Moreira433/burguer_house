'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, Package, DollarSign, Power, Save, ChevronLeft, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
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
          <div className="text-[10px] font-bold bg-orange-600 px-3 py-1 rounded-full uppercase">
            Admin Logado
          </div>
        </div>
      </header>

      <section className="p-6 max-w-6xl mx-auto">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Tabela de Gestão */}
        <div className="bg-white rounded-[32px] shadow-sm border border-zinc-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400">Produto</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400">Preço (R$)</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((prod) => (
                <tr key={prod.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="p-6">
                    <p className="font-bold text-zinc-800">{prod.nome}</p>
                    <p className="text-[10px] text-zinc-400 uppercase">{prod.categorias?.nome}</p>
                  </td>
                  <td className="p-6">
                    <input 
                      type="text" 
                      defaultValue={prod.preco.toFixed(2)} 
                      onBlur={(e) => atualizarPreco(prod.id, e.target.value)}
                      className="w-24 bg-zinc-100 p-2 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => alternarDisponibilidade(prod.id, prod.disponivel)}
                      disabled={salvando === prod.id}
                      className={`p-3 rounded-2xl transition-all ${
                        prod.disponivel 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-red-100 text-red-500 hover:bg-red-200'
                      }`}
                    >
                      {salvando === prod.id ? <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"/> : <Power size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}