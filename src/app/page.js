'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  ShoppingCart, Trash2, MapPin, 
  MessageSquare, Truck, ArrowRight, 
  LayoutGrid, X, ChevronLeft, Camera
} from 'lucide-react'
import ProductCard from '../components/ProductCard'


const getCatImage = (nome) => {
  const n = nome.toLowerCase();
  if (n.includes('pedido')) return "https://images.unsplash.com/photo-1594179047519-f347310d3322?q=80&w=800&auto=format&fit=crop";
  if (n.includes('promo')) return "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop";
  if (n.includes('tradicional')) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop";
  if (n.includes('artesanal') && !n.includes('caixa')) return "https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?q=80&w=800&auto=format&fit=crop";
  if (n.includes('caixa')) return "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=800&auto=format&fit=crop";
  if (n.includes('completas')) return "https://images.unsplash.com/photo-1518013034841-59490346506f?q=80&w=800&auto=format&fit=crop";
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

  const [produtoEmCustomizacao, setProdutoEmCustomizacao] = useState(null)
  const [pontoCarne, setPontoCarne] = useState('Ao Ponto')
  const [extrasSelecionados, setExtrasSelecionados] = useState([])

  // Lógica de Realtime e LocalStorage (Mantida)
  useEffect(() => {
    const fetchInicial = async () => {
      const { data: catData } = await supabase.from('categorias').select('*').order('ordem', { ascending: true })
      const { data: prodData } = await supabase.from('produtos').select('*').eq('disponivel', true)
      if (catData) setCategorias(catData)
      if (prodData) setProdutos(prodData)
      setLoading(false)
    }
    fetchInicial()

    const canal = supabase
      .channel('mudancas-no-cardapio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => {
        const buscarProdutos = async () => {
          const { data } = await supabase.from('produtos').select('*').eq('disponivel', true)
          if (data) setProdutos(data)
        }
        buscarProdutos()
      })
      .subscribe()

    const cartSalvo = localStorage.getItem('burguer_house_cart')
    const endSalvo = localStorage.getItem('burguer_house_address')
    if (cartSalvo) setCarrinho(JSON.parse(cartSalvo))
    if (endSalvo) setEndereco(endSalvo)

    return () => { supabase.removeChannel(canal) }
  }, [])

  useEffect(() => {
    localStorage.setItem('burguer_house_cart', JSON.stringify(carrinho))
    localStorage.setItem('burguer_house_address', endereco)
  }, [carrinho, endereco])

  // Handlers (Mantidos)
  const handleAddClick = (produto) => {
    if (produto.categoria_id === 8) {
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
      if(item.ponto) mensagem += `   • Ponto: ${item.ponto}%0A`;
      if(item.extras?.length > 0) mensagem += `   • Extras: ${item.extras.map(e => e.nome).join(', ')}%0A`;
      mensagem += `   Subtotal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoTotal)}%0A%0A`;
    });
    mensagem += `*TOTAL: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos + taxaEntrega)}*`;
    window.open(`https://wa.me/5521999999999?text=${mensagem}`, '_blank');
  }

  const valorProdutos = carrinho.reduce((acc, item) => acc + (item.precoTotal * item.quantidade), 0)
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0)
  const produtosFiltrados = produtos.filter(p => p.categoria_id === catAtiva)
  const nomeCategoriaAtiva = categorias.find(c => c.id === catAtiva)?.nome

  return (
    <main className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-32">
      {/* HEADER ADAPTÁVEL */}
      <header className="bg-white p-4 md:p-6 shadow-sm sticky top-0 z-50 border-b border-zinc-100">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            {(catAtiva || mostrarCarrinho) && (
              <button onClick={() => { setCatAtiva(null); setMostrarCarrinho(false); }} className="bg-zinc-100 text-zinc-600 p-2 rounded-xl flex-shrink-0">
                <ChevronLeft size={22} />
              </button>
            )}
            <h1 className="text-xl md:text-3xl font-black text-orange-600 italic tracking-tighter truncate">BURGUER HOUSE</h1>
          </div>
          <button onClick={() => setMostrarCarrinho(true)} className="relative bg-orange-600 p-2.5 md:p-3 rounded-2xl text-white flex-shrink-0">
            <ShoppingCart size={22} />
            {totalItens > 0 && <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-orange-950 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{totalItens}</span>}
          </button>
        </div>
      </header>

      <section className="p-3 md:p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-24 text-orange-600 font-bold animate-pulse">Sincronizando...</div>
        ) : mostrarCarrinho ? (
          /* --- CARRINHO ADAPTADO --- */
          <div className="mt-2 md:mt-6 animate-in slide-in-from-bottom-10 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black mb-6 italic">Meu Pedido</h2>
            <div className="space-y-4">
               {/* Itens do carrinho */}
               <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 shadow-sm border border-zinc-100">
                  {totalItens === 0 ? <p className="text-center text-zinc-400 py-10">Vazio...</p> : 
                    carrinho.map(item => (
                      <div key={item.cartId} className="flex justify-between items-center py-4 border-b border-zinc-50 last:border-0 last:pb-0">
                         <div className="pr-4">
                           <p className="font-bold text-sm">{item.nome}</p>
                           <p className="text-xs text-orange-600 font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoTotal)}</p>
                         </div>
                         <button onClick={() => removerDoCarrinho(item.cartId)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                    ))
                  }
               </div>

               <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 shadow-sm border border-zinc-100 space-y-3">
                  {/* Campo de Endereço */}
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-4 text-orange-600"/>
                    <input 
                      type="text" 
                      placeholder="Endereço de entrega..." 
                      value={endereco} 
                      onChange={(e) => setEndereco(e.target.value)} 
                      className="w-full bg-zinc-50 rounded-xl p-3.5 pl-11 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                  
                  {/* Novo Campo de Observação */}
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-4 top-4 text-zinc-400"/>
                    <textarea 
                      placeholder="Alguma observação? (Ex: Sem cebola, tirar picles...)" 
                      value={observacao} 
                      onChange={(e) => setObservacao(e.target.value)} 
                      className="w-full bg-zinc-50 rounded-xl p-3.5 pl-11 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 transition-all min-h-[80px] resize-none"
                    />
                  </div>
                </div>
               <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 shadow-sm border border-zinc-100">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <span>Itens do Pedido</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos)}</span>
                  </div>
                  
                  {/* Aparece apenas se houver extras no carrinho */}
                  {carrinho.some(item => item.extras?.length > 0) && (
                    <div className="flex justify-between text-[10px] text-zinc-400 italic">
                      <span>Total em Adicionais</span>
                      <span>+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        carrinho.reduce((acc, item) => acc + (item.extras.reduce((a, b) => a + b.preco, 0) * item.quantidade), 0)
                      )}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs font-bold text-green-600 uppercase tracking-widest border-b border-zinc-50 pb-2">
                    <span>Taxa de Entrega</span>
                    <span>+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxaEntrega)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <span className="font-black text-xl italic uppercase tracking-tighter text-zinc-900">Total Geral</span>
                  <span className="text-3xl font-black text-orange-600 tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos + taxaEntrega)}
                  </span>
                </div>
                
                <button onClick={finalizarPedido} className="w-full mt-6 bg-green-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all">
                  Finalizar Pedido
                </button>
              </div>
            </div>
          </div>
          
        ) : !catAtiva ? (
          /* --- HOME: CATEGORIAS EM GRID FLEXÍVEL --- */
          <div className="mt-2">
            <h2 className="text-zinc-900 text-xl font-black italic mb-6">O que vamos pedir hoje?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {categorias.map((cat) => (
                <button key={cat.id} onClick={() => setCatAtiva(cat.id)} className="group relative h-48 md:h-64 w-full rounded-[24px] md:rounded-[32px] overflow-hidden shadow-lg border-4 border-white transition-all">
                  <img src={getCatImage(cat.nome)} alt={cat.nome} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5 md:p-8"><span className="text-lg md:text-2xl font-black text-white italic">{cat.nome}</span></div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* --- INTERNA: MENU HORIZONTAL NO MOBILE --- */
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar vira carrossel horizontal no mobile */}
            <aside className="w-full md:w-72 flex-shrink-0 md:sticky md:top-32 h-fit overflow-x-auto no-scrollbar pb-2 md:pb-0">
              <div className="flex flex-row md:flex-col gap-2 min-w-max md:min-w-0 bg-white md:bg-white p-2 md:p-4 rounded-[20px] md:rounded-[32px] border border-zinc-100 shadow-sm">
                {categorias.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => setCatAtiva(cat.id)} 
                    className={`px-5 py-2.5 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                      catAtiva === cat.id ? 'bg-orange-600 text-white shadow-md' : 'bg-zinc-50 md:bg-transparent text-zinc-500'
                    }`}
                  >
                    {cat.nome}
                  </button>
                ))}
              </div>
            </aside>

            {/* Lista de Produtos */}
            <div className="flex-1 animate-in fade-in duration-300">
                <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-[20px] border border-zinc-100 shadow-sm">
                   <h2 className="text-lg font-black italic">{nomeCategoriaAtiva}</h2>
                   <span className="text-[10px] font-bold bg-zinc-100 px-3 py-1 rounded-full">{produtosFiltrados.length} ITENS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 pb-20 w-full max-w-full">
                    {produtosFiltrados.map((prod) => (
                        <ProductCard key={prod.id} produto={prod} noCarrinho={carrinho.filter(i => i.id === prod.id).length > 0 ? {quantidade: carrinho.filter(i => i.id === prod.id).length} : null} onAdd={handleAddClick} />
                    ))}
                </div>
            </div>
          </div>
        )}
      </section>

      {/* WIDGET FLUTUANTE ADAPTADO */}
      {!mostrarCarrinho && totalItens > 0 && !produtoEmCustomizacao && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-zinc-900/95 backdrop-blur-md text-white p-4 md:p-5 rounded-[24px] md:rounded-[32px] shadow-2xl z-40 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-black text-zinc-400 tracking-widest">Total com Entrega</span>
              <span className="text-xl font-black italic">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProdutos + taxaEntrega)}</span>
            </div>
            <button onClick={() => setMostrarCarrinho(true)} className="bg-orange-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              Ver Carrinho <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CUSTOMIZAÇÃO MOBILE-FIRST */}
      {produtoEmCustomizacao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[40px] p-6 md:p-8 animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase tracking-tighter">{produtoEmCustomizacao.nome}</h2>
              <button onClick={() => setProdutoEmCustomizacao(null)} className="p-2 bg-zinc-100 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase text-orange-600 mb-3 tracking-widest">Ponto da Carne</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['Mal', 'Ao Ponto', 'Bem'].map(p => (
                    <button key={p} onClick={() => setPontoCarne(p)} className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${pontoCarne === p ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-zinc-100 text-zinc-400'}`}>{p}</button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase text-orange-600 mb-3 tracking-widest">Adicionais</h3>
                <div className="space-y-2">
                  {EXTRAS_OPCOES.map(ex => {
                    const sel = extrasSelecionados.find(e => e.id === ex.id);
                    return (
                      <button key={ex.id} onClick={() => sel ? setExtrasSelecionados(extrasSelecionados.filter(e => e.id !== ex.id)) : setExtrasSelecionados([...extrasSelecionados, ex])} className={`w-full flex justify-between p-4 rounded-xl border-2 transition-all ${sel ? 'border-orange-600 bg-orange-50' : 'border-zinc-100'}`}>
                        <span className="text-xs font-bold">{ex.nome}</span>
                        <span className="text-[10px] font-black text-zinc-400">+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ex.preco)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <button onClick={() => adicionarAoCarrinhoFinal(produtoEmCustomizacao, pontoCarne, extrasSelecionados)} className="w-full mt-8 bg-green-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">Confirmar e Adicionar</button>
          </div>
        </div>
      )}
<footer className="bg-white border-t border-zinc-100 pt-12 pb-28 md:pb-12 px-4 mt-12">
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
    
   {/* COLUNA 1: LOGO E REDES SOCIAIS */}
    <div className="flex flex-col items-center md:items-start">
      <h3 className="font-black italic text-orange-600 text-xl mb-2 uppercase tracking-tighter">
        BURGUER HOUSE
      </h3>
      
      {/* Novo Título da Sessão */}
      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
        Contatos
      </h4>

      <div className="flex gap-3">
        {/* Instagram: Altura ajustada (p-2.5) e arredondado (rounded-full) */}
        <a 
          href="https://www.instagram.com/burguerhausee?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-zinc-100 p-2.5 rounded-full text-zinc-600 hover:bg-[#E1306C] hover:text-white transition-all shadow-sm flex items-center justify-center"
        >
          <Camera size={18} />
        </a>

        {/* WhatsApp: Altura ajustada (p-2.5) */}
        <a 
          href="https://wa.me/5561985613049" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-zinc-100 p-2.5 rounded-full text-zinc-600 hover:bg-[#25D366] hover:text-white transition-all shadow-sm flex items-center justify-center"
        >
          <MessageSquare size={18} />
        </a>
      </div>
    </div>

    {/* COLUNA 2: HORÁRIOS */}
    <div className="flex flex-col items-center md:items-start">
      <h4 className="font-black text-zinc-900 text-sm mb-4 uppercase tracking-widest">Horários</h4>
      <div className="space-y-1">
        <p className="text-zinc-400 text-[10px] font-bold">TERÇA A DOMINGO</p>
        <p className="text-zinc-600 text-xs font-black italic">20:00 ÀS 00:00</p>
        <p className="text-zinc-400 text-[10px] font-bold mt-2">SEXTA E SÁBADO</p>
        <p className="text-zinc-600 text-xs font-black italic">20:00 ÀS 00:00</p>
      </div>
    </div>

    {/* COLUNA 3: LOCALIZAÇÃO */}
    <div className="flex flex-col items-center md:items-start">
      <h4 className="font-black text-zinc-900 text-sm mb-4 uppercase tracking-widest">Onde Estamos</h4>
      <div className="flex items-start gap-2 justify-center md:justify-start">
        <MapPin size={16} className="text-orange-600 flex-shrink-0" />
        <p className="text-zinc-500 text-xs font-bold leading-tight">
         Qr 1029 Conjunto 1 Casa 8, 8 - Samambaia Norte <br>
         </br>
         Brasilia - DF<br>
         </br>
         CEP: 72338-660
        </p>
      </div>
    </div>

  </div>

  {/* RODAPÉ FINAL: CRÉDITOS */}
  <div className="text-center mt-12 pt-8 border-t border-zinc-50">
    <p className="text-[10px] text-zinc-300 font-black uppercase tracking-[0.2em]">
      © 2026 Burguer House • Desenvolvido por Henrique Moreira
    </p>
  </div>
</footer>    </main>
  )
}