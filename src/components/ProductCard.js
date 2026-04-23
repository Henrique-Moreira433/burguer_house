import { Plus, Minus, Pizza } from 'lucide-react'

export default function ProductCard({ produto, noCarrinho, onAdd, onRemove }) {
  return (
    <div className="bg-white p-4 rounded-[24px] shadow-sm border border-zinc-100 flex gap-4 items-center transition-all">
      <div className="w-24 h-24 bg-zinc-100 rounded-2xl overflow-hidden flex-shrink-0 border flex items-center justify-center text-zinc-300">
        {produto.imagem_url ? (
          <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
        ) : (
          <Pizza size={32} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-zinc-800 text-lg leading-tight truncate">{produto.nome}</h3>
        <p className="text-zinc-500 text-[10px] line-clamp-2 mt-1 mb-2 leading-relaxed uppercase">
          {produto.descricao}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-orange-600 font-black text-xl italic">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
          </span>
          
          <div className="flex items-center gap-3">
            {/* Se houver itens no carrinho, mostramos apenas a quantidade total desse ID */}
            {noCarrinho && (
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black">
                {noCarrinho.quantidade} no total
              </span>
            )}
            <button 
              onClick={() => onAdd(produto)} 
              className="bg-orange-600 text-white p-2.5 rounded-xl hover:bg-orange-700 active:scale-90 transition-all shadow-lg"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}