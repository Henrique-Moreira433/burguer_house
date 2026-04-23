'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Utensils, ShoppingCart, Trash2, MapPin, 
  MessageSquare, Truck, ChevronLeft, ArrowRight, 
  LayoutGrid, X, CheckCircle2, Pizza 
} from 'lucide-react'
import ProductCard from '../components/ProductCard'

// Helper para imagens das categorias
const getCatImage = (nome) => {
  const n = nome.toLowerCase();
  if (n.includes('pedido')) return "https://images.unsplash.com/photo-1594179047519-f347310d3322?q=80&w=800&auto=format&fit=crop";
  if (n.includes('promo')) return "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop";
  if (n.includes('tradicional')) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop";
  if (n.includes('artesanal') && !n.includes('caixa')) return "https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?q=80&w=800&auto=format&fit=crop";
  if (n.includes('caixa')) return "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=800&auto=format&fit=crop";
  if (n.includes('batata')) return "https://images.unsplash.com/photo-1518013034841-59490346506f?q=80&w=800&auto=format&fit=crop";
  if (n.includes('porç')) return "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop";
  if (n.includes('bebi')) return "https://images.unsplash.com/photo-1527960471264-932f39eb5846?q=80&w=800&auto=format&fit=crop";
  return "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop";
};

const EXTRAS_OPCOES = [
  { id: 'bacon', nome: 'Bacon Extra', preco: 4.50 },
  { id: 'queijo', nome: 'Queijo Extra', preco: 3.50 },
  { id: 'ovo', nome: 'Ovo Extra', preco: 2.00 },
]

export default function Home() {
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [carrinho, setCarrinho] = useState([])
  const [endereco, setEndereco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [taxaEntrega] = useState(5.00)
  const [catAtiva, setCatAtiva] = useState(null)
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false)
  const [loading, setLoading] = useState(true)

  // Estados Customização
  const [produtoEmCustomizacao, setProdutoEmCustomizacao] = useState(null)
  const [pontoCarne, setPontoCarne] = useState('Ao Ponto')
  const [extrasSelecionados, setExtrasSelecionados] = useState([])

useEffect(() => {
  // 1. Carregar dados iniciais (como já fazíamos)
  const fetchInicial = async () => {
    const { data: catData } = await supabase.from('categorias').select('*').order('ordem', { ascending: true })
    const { data: prodData } = await supabase.from('produtos').select('*').eq('disponivel', true)
    if (catData) setCategorias(catData)
    if (prodData) setProdutos(prodData)
    setLoading(false)
  }
  fetchInicial()

  // 2. CONFIGURAR O REALTIME (A Mágica)
  const canal = supabase
    .channel('mudancas-no-cardapio') // Nome qualquer para o canal
    .on(
      'postgres_changes', 
      { event: '*', schema: 'public', table: 'produtos' }, 
      (payload) => {
        // Quando algo mudar, buscamos os produtos de novo para garantir sincronia
        // Ou podemos atualizar o estado localmente para ser ainda mais rápido
        const buscarProdutosAtualizados = async () => {
          const { data } = await supabase.from('produtos').select('*').eq('disponivel', true)
          if (data) setProdutos(data)
        }
        buscarProdutosAtualizados()
      }
    )
    .subscribe()

  // Limpeza ao fechar a página
  return () => {
    supabase.removeChannel(canal)
  }
}, [])
  useEffect(() => {
    localStorage.setItem('burguer_house_cart', JSON.stringify(carrinho))
    localStorage.setItem('burguer_house_address', endereco)
  }, [carrinho, endereco])

  const handleAddClick = (produto) => {
    if (produto.categoria_id === 8) { // Bebidas direto
      adicionarAoCarrinhoFinal(produto, null, [])
      return
    }
    setProdutoEmCustomizacao(produto)
  }

  const adicionarAoCarrinhoFinal = (produto, ponto, extras) => {
    const precoExtras = extras.reduce((acc, ex) => acc + ex.preco, 0)
    const novoItem = {
      ...produto,
      cartId: Math.random().toString(36).substr(2, 9),
      ponto,
      extras,
      precoTotal: produto.preco + precoExtras,
      quantidade: 1
    }
    setCarrinho([...carrinho, novoItem])
    setProdutoEmCustomizacao(null)
    setExtrasSelecionados([])
    setPontoCarne('Ao Ponto')
  }

  const removerDoCarrinho = (cartId) => {
    setCarrinho(carrinho.filter(item => item.cartId !== cartId))
  }

  const finalizarPedido = () => {
    if (!endereco.trim()) return alert('Informe o endereço!')
    let mensagem = `*🍔 NOVO PEDIDO - BURGUER HOUSE*%0A%0A*📍 ENTREGA:* ${endereco}%0A`;
    if(observacao) mensagem += `*📝 OBS:* ${observacao}%0A%0A`;
    mensagem += `*--- ITENS ---*%0A`;
    carrinho.forEach(item => {
      mensagem += `*${item.quantidade}x ${item.nome}*%0A`;
      if(item.ponto) mensagem += `  • Ponto: ${item.ponto}%0A`;
      if(item.extras?.length > 0) mensagem += `  • Extras: ${item.extras.map(e => e.nome).join(', ')}%0A`;
      mensagem += `  Subtotal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoTotal)}%0A%0A`;
    });
    mensagem += `*--- FINANCEIRO ---*%0A`;
    mensagem += `Produtos: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos)}%0A`;
    mensagem += `Entrega: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxaEntrega)}%0A`;
    mensagem += `*TOTAL: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos + taxaEntrega)}*`;
    window.open(`https://wa.me/5521999999999?text=${mensagem}`, '_blank');
  }

  const valorProdutos = carrinho.reduce((acc, item) => acc + (item.precoTotal * item.quantidade), 0)
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0)
  const produtosFiltrados = produtos.filter(p => p.categoria_id === catAtiva)
  const nomeCategoriaAtiva = categorias.find(c => c.id === catAtiva)?.nome

  return (
    <main className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Header Fixo Premium */}
      <header className="bg-white p-6 shadow-sm sticky top-0 z-50 border-b border-zinc-100">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {(catAtiva || mostrarCarrinho) && (
              <button onClick={() => { setCatAtiva(null); setMostrarCarrinho(false); }} className="bg-zinc-100 text-zinc-600 p-2.5 rounded-xl hover:bg-zinc-200 transition-all">
                <LayoutGrid size={24} />
              </button>
            )}
            <h1 className="text-3xl font-black text-orange-600 italic tracking-tighter">BURGUER HOUSE</h1>
          </div>
          <button onClick={() => setMostrarCarrinho(true)} className="relative bg-orange-600 p-3 rounded-2xl text-white shadow-lg active:scale-90 transition-transform">
            <ShoppingCart size={24} />
            {totalItens > 0 && <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-orange-950 text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">{totalItens}</span>}
          </button>
        </div>
      </header>

      <section className="p-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-24 text-orange-600 font-bold animate-pulse uppercase tracking-widest">Sincronizando Cardápio...</div>
        ) : mostrarCarrinho ? (
          /* --- TELA DEDICADA DO CARRINHO --- */
          <div className="mt-6 animate-in slide-in-from-bottom-10 duration-500 max-w-3xl mx-auto pb-40">
            <h2 className="text-3xl font-black text-zinc-900 italic mb-8 uppercase tracking-tighter">Meu Pedido</h2>
            {totalItens === 0 ? (
              <div className="text-center py-20 text-zinc-400 italic">O seu carrinho está vazio.</div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">Itens no Carrinho</h3>
                  <div className="space-y-6">
                    {carrinho.map(item => (
                      <div key={item.cartId} className="flex justify-between items-start pb-6 border-b border-zinc-50 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-zinc-800 text-lg">{item.nome}</p>
                          {item.ponto && <p className="text-[10px] text-orange-600 font-black uppercase mt-1">Ponto: {item.ponto}</p>}
                          {item.extras?.map(e => (
                            <p key={e.id} className="text-xs text-zinc-400 italic">+ {e.nome} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.preco)})</p>
                          ))}
                          <p className="font-black text-zinc-900 mt-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoTotal)}</p>
                        </div>
                        <button onClick={() => removerDoCarrinho(item.cartId)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Dados de Entrega</h3>
                  <div className="relative"><MapPin size={18} className="absolute left-4 top-4 text-orange-600"/><input type="text" placeholder="Endereço Completo..." value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full bg-zinc-50 rounded-2xl p-4 pl-12 text-sm outline-none border border-zinc-100 focus:border-orange-500 transition-all"/></div>
                  <div className="relative"><MessageSquare size={18} className="absolute left-4 top-4 text-orange-600"/><input type="text" placeholder="Alguma observação?..." value={observacao} onChange={(e) => setObservacao(e.target.value)} className="w-full bg-zinc-50 rounded-2xl p-4 pl-12 text-sm outline-none border border-zinc-100 focus:border-orange-500 transition-all"/></div>
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100">
                  <div className="flex justify-between text-zinc-500 mb-2"><span>Subtotal</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos)}</span></div>
                  <div className="flex justify-between text-zinc-500 mb-4 pb-4 border-b border-zinc-50"><span>Taxa de Entrega</span><span className="text-green-600 font-bold">+ R$ 5,00</span></div>
                  <div className="flex justify-between items-end">
                    <span className="font-black text-xl italic uppercase tracking-tighter">Total Geral</span>
                    <span className="text-4xl font-black text-orange-600 tracking-tighter">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos + taxaEntrega)}</span>
                  </div>
                  <button onClick={finalizarPedido} className="w-full mt-8 bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition-all">Finalizar no WhatsApp</button>
                </div>
              </div>
            )}
          </div>
        ) : !catAtiva ? (
          /* --- HOME: GRADE DE CATEGORIAS --- */
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <h2 className="text-zinc-900 text-2xl font-black italic mb-8">O que você quer comer hoje?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorias.map((cat) => (
                <button key={cat.id} onClick={() => setCatAtiva(cat.id)} className="group relative h-64 w-full rounded-[32px] overflow-hidden shadow-lg border-4 border-white hover:border-orange-200 transition-all active:scale-95 duration-300">
                  <img src={getCatImage(cat.nome)} alt={cat.nome} className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 text-left"><span className="text-2xl font-black text-white italic tracking-tighter leading-tight">{cat.nome}</span></div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* --- INTERNA: SIDEBAR + PRODUTOS --- */
          <div className="flex flex-col md:flex-row gap-8 mt-6">
            <aside className="hidden md:block w-72 flex-shrink-0 sticky top-32 h-fit">
              <div className="bg-white rounded-[32px] p-4 shadow-sm border border-zinc-100">
                <nav className="flex flex-col gap-2">
                  {categorias.map((cat) => (
                    <button key={cat.id} onClick={() => setCatAtiva(cat.id)} className={`flex items-center gap-3 p-3.5 rounded-2xl font-bold transition-all text-sm ${catAtiva === cat.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-transparent text-zinc-600 hover:bg-zinc-50'}`}>{cat.nome}</button>
                  ))}
                  <button onClick={() => setCatAtiva(null)} className="flex items-center gap-3 p-3.5 rounded-2xl font-bold text-zinc-400 text-sm hover:bg-zinc-50 mt-2 border-t pt-4 border-zinc-50"><LayoutGrid size={16} /> Ver todas</button>
                </nav>
              </div>
            </aside>
            <div className="flex-1 animate-in fade-in slide-in-from-right-6 duration-300">
                <h2 className="text-2xl font-black text-zinc-900 italic tracking-tight mb-8 bg-white p-5 rounded-[24px] border border-zinc-100 shadow-sm flex justify-between items-center">
                  {nomeCategoriaAtiva}
                  <span className="text-zinc-300 text-xs font-bold uppercase">{produtosFiltrados.length} Itens</span>
                </h2>
                <div className="grid gap-5">
                    {produtosFiltrados.map((prod) => (
                        <ProductCard key={prod.id} produto={prod} noCarrinho={carrinho.filter(i => i.id === prod.id).length > 0 ? {quantidade: carrinho.filter(i => i.id === prod.id).length} : null} onAdd={handleAddClick} />
                    ))}
                </div>
            </div>
          </div>
        )}
      </section>

      {/* --- WIDGET INFERIOR (RESUMO RÁPIDO COM TAXA) --- */}
      {!mostrarCarrinho && totalItens > 0 && !produtoEmCustomizacao && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-zinc-900/95 backdrop-blur-md text-white p-5 rounded-[32px] shadow-2xl z-40 border border-white/10 animate-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-0.5"><Truck size={12} className="text-orange-500" /><span className="text-[9px] uppercase font-black text-zinc-400 tracking-widest">Total com Entrega</span></div>
              <span className="text-2xl font-black italic tracking-tighter text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos + taxaEntrega)}</span>
            </div>
            <button onClick={() => setMostrarCarrinho(true)} className="bg-orange-600 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-orange-700 active:scale-95 transition-all shadow-lg">Ver Carrinho <ArrowRight size={16} strokeWidth={3} /></button>
          </div>
        </div>
      )}

      {/* --- MODAL DE CUSTOMIZAÇÃO --- */}
      {produtoEmCustomizacao && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-start mb-8">
              <div><h2 className="text-2xl font-black italic uppercase tracking-tighter">{produtoEmCustomizacao.nome}</h2><p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">Como você prefere?</p></div>
              <button onClick={() => setProdutoEmCustomizacao(null)} className="bg-zinc-100 p-2.5 rounded-full text-zinc-400"><X size={20}/></button>
            </div>
            <div className="space-y-8 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
              <div><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-4">Ponto da Carne</h3>
                <div className="grid grid-cols-3 gap-2">{['Mal Passado', 'Ao Ponto', 'Bem Passado'].map(p => (
                    <button key={p} onClick={() => setPontoCarne(p)} className={`py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${pontoCarne === p ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-zinc-100 text-zinc-400'}`}>{p}</button>
                ))}</div>
              </div>
              <div><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-4">Adicionais (Opcional)</h3>
                <div className="space-y-3">{EXTRAS_OPCOES.map(ex => {
                    const sel = extrasSelecionados.find(e => e.id === ex.id);
                    return (
                      <button key={ex.id} onClick={() => sel ? setExtrasSelecionados(extrasSelecionados.filter(e => e.id !== ex.id)) : setExtrasSelecionados([...extrasSelecionados, ex])} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${sel ? 'border-orange-600 bg-orange-50' : 'border-zinc-100'}`}>
                        <span className={`font-bold text-sm ${sel ? 'text-orange-600' : 'text-zinc-700'}`}>{ex.nome}</span>
                        <span className="font-black text-[10px] text-zinc-400">+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ex.preco)}</span>
                      </button>
                    )
                })}</div>
              </div>
            </div>
            <button onClick={() => adicionarAoCarrinhoFinal(produtoEmCustomizacao, pontoCarne, extrasSelecionados)} className="w-full mt-10 bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-green-100 active:scale-95 transition-all">Adicionar ao Pedido</button>
          </div>
        </div>
      )}
    </main>
  )
}