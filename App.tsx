
import React, { useState, useCallback, useMemo } from 'react';
import { Game, GenerationResult, FinancialResult, PRIZE_TABLE, COST_PER_GAME } from './types';
import { searchClosure } from './utils/generator';
import { toBitmask, countSetBits } from './utils/math';

const App: React.FC = () => {
  const [selectedPool, setSelectedPool] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConference, setShowConference] = useState(false);

  // Toggle selection for pool (21 numbers)
  const togglePoolNumber = (n: number) => {
    if (selectedPool.includes(n)) {
      setSelectedPool(selectedPool.filter(i => i !== n));
    } else if (selectedPool.length < 21) {
      setSelectedPool([...selectedPool, n].sort((a, b) => a - b));
    }
  };

  // Randomly fill 21 numbers
  const handleRandomPool = () => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 21).sort((a, b) => a - b);
    setSelectedPool(selected);
  };

  // Clear selection
  const handleClearPool = () => {
    setSelectedPool([]);
    setGeneration(null);
    setDrawnNumbers([]);
    setShowConference(false);
  };

  // Export as TXT
  const handleExportTxt = () => {
    if (!generation) return;
    const content = generation.games
      .map(g => g.numbers.map(n => n.toString().padStart(2, '0')).join(' '))
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lotofacil_jogos_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV (Compatible with ODS/Excel)
  const handleExportCsv = () => {
    if (!generation) return;
    const headers = "Jogo;D1;D2;D3;D4;D5;D6;D7;D8;D9;D10;D11;D12;D13;D14;D15";
    const rows = generation.games.map(g => `Jogo ${g.id};${g.numbers.join(';')}`);
    const content = [headers, ...rows].join('\n');
    
    // Add BOM for Excel UTF-8 recognition
    const blob = new Blob(["\ufeff", content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lotofacil_planilha_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Toggle selection for drawn (15 numbers)
  const toggleDrawnNumber = (n: number) => {
    if (drawnNumbers.includes(n)) {
      setDrawnNumbers(drawnNumbers.filter(i => i !== n));
    } else if (drawnNumbers.length < 15) {
      setDrawnNumbers([...drawnNumbers, n].sort((a, b) => a - b));
    }
  };

  const handleGenerate = () => {
    if (selectedPool.length !== 21) return;
    setIsProcessing(true);
    // Use a timeout to allow UI to show "Processing"
    setTimeout(() => {
      const result = searchClosure(selectedPool);
      setGeneration(result);
      setIsProcessing(false);
      setShowConference(false);
      setDrawnNumbers([]);
    }, 100);
  };

  const financialResults = useMemo((): FinancialResult | null => {
    if (!generation || drawnNumbers.length !== 15) return null;

    const drawnMask = toBitmask(drawnNumbers);
    const hitCount: Record<number, number> = { 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 };
    let totalPrize = 0;

    generation.games.forEach(game => {
      const gameMask = toBitmask(game.numbers);
      const hits = countSetBits(gameMask & drawnMask);
      if (hits >= 11) {
        hitCount[hits] = (hitCount[hits] || 0) + 1;
        totalPrize += PRIZE_TABLE[hits];
      }
    });

    const cost = generation.games.length * COST_PER_GAME;
    return {
      cost,
      prize: totalPrize,
      balance: totalPrize - cost,
      hitCount
    };
  }, [generation, drawnNumbers]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-emerald-700 text-white py-8 px-4 shadow-lg mb-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <i className="fas fa-calculator text-2xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lotofácil Garantia Real</h1>
            <p className="text-emerald-100 opacity-90">Fechamento Matemático Auditável de 21 Dezenas</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 space-y-8">
        
        {/* Step 1: Selection Pool */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">1</span>
              Escolha 21 Dezenas
            </h2>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                onClick={handleRandomPool}
                className="flex-1 md:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-random"></i>
                Aleatório
              </button>
              <button 
                onClick={handleClearPool}
                className="flex-1 md:flex-none px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-trash-alt"></i>
                Limpar
              </button>
              <div className="hidden md:block text-sm font-medium px-3 py-1 bg-slate-100 rounded-full text-slate-600">
                {selectedPool.length} / 21
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 gap-3 max-w-md mx-auto">
            {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => togglePoolNumber(n)}
                className={`
                  h-12 w-full rounded-xl font-bold text-lg transition-all duration-200
                  ${selectedPool.includes(n) 
                    ? 'bg-emerald-600 text-white shadow-md transform scale-105' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'}
                `}
              >
                {n.toString().padStart(2, '0')}
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={selectedPool.length !== 21 || isProcessing}
              className={`
                px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all
                flex items-center gap-3
                ${selectedPool.length === 21 && !isProcessing
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
              `}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processando Provas...
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  Gerar com Garantia Real
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Section */}
        {generation && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Proof Info Card */}
            <div className={`p-6 rounded-2xl border ${generation.guaranteed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${generation.guaranteed ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                  <i className={`fas ${generation.guaranteed ? 'fa-check-double' : 'fa-times-circle'} text-xl`}></i>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${generation.guaranteed ? 'text-emerald-800' : 'text-red-800'}`}>
                    {generation.guaranteed ? 'Garantia Comprovada (11 Pontos)' : 'Não foi encontrada garantia'}
                  </h3>
                  <div className="mt-2 text-sm space-y-1 opacity-80">
                    <p>• O sistema processou todas as 54.264 combinações.</p>
                    <p>• Menor pontuação encontrada: <strong>{generation.minPoints} pontos</strong>.</p>
                    <p>• Tempo de processamento: {generation.timeMs}ms ({generation.attempts} tentativas).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* The Games */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generation.games.map((game) => {
                const hits = drawnNumbers.length === 15 
                  ? countSetBits(toBitmask(game.numbers) & toBitmask(drawnNumbers))
                  : null;
                
                return (
                  <div key={game.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:border-emerald-300 transition-colors relative">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jogo #{game.id}</span>
                      {hits !== null ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hits >= 11 ? 'bg-lime-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {hits} Pontos
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">15 Números</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {game.numbers.map(num => {
                        const isHit = drawnNumbers.includes(num);
                        return (
                          <span 
                            key={num} 
                            className={`
                              w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all
                              ${isHit ? 'bg-lime-500 text-white shadow-sm scale-110' : 'bg-slate-100 text-slate-700'}
                            `}
                          >
                            {num.toString().padStart(2, '0')}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Export Actions Area */}
            <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h4 className="font-bold text-slate-700">Exportar Jogos</h4>
                <p className="text-xs text-slate-500">Salve seus jogos para imprimir ou usar em planilhas.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={handleExportTxt}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-emerald-500 transition-all flex items-center gap-2 shadow-sm"
                >
                  <i className="fas fa-file-alt text-emerald-600"></i>
                  Exportar .TXT
                </button>
                <button 
                  onClick={handleExportCsv}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-lime-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <i className="fas fa-file-excel text-lime-600"></i>
                  Exportar .CSV (Planilha)
                </button>
              </div>
            </div>

            {/* Conference Section Toggle */}
            <div className="flex flex-col items-center">
              {!showConference ? (
                <button 
                  onClick={() => setShowConference(true)}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 shadow-md transition-all flex items-center gap-2"
                >
                  <i className="fas fa-search"></i>
                  Simular Conferência
                </button>
              ) : (
                <div className="w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-800">Conferência dos Jogos</h3>
                    <button onClick={() => setShowConference(false)} className="text-slate-400 hover:text-slate-600">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <p className="text-slate-500">Selecione as 15 dezenas sorteadas para calcular o prêmio e balanço financeiro.</p>
                  
                  <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 max-w-sm mx-auto">
                    {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => toggleDrawnNumber(n)}
                        className={`
                          h-10 w-full rounded-lg font-bold text-sm transition-all
                          ${drawnNumbers.includes(n) 
                            ? 'bg-lime-500 text-white shadow-sm' 
                            : 'bg-slate-50 text-slate-400 border border-slate-100'}
                        `}
                      >
                        {n.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>

                  {financialResults && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                      {/* Breakdown */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-700 mb-4">Desempenho</h4>
                        {[15, 14, 13, 12, 11].map(lvl => (
                          <div key={lvl} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                            <span className="font-medium text-slate-600">{lvl} Pontos</span>
                            <span className={`font-bold ${financialResults.hitCount[lvl] > 0 ? 'text-lime-600' : 'text-slate-400'}`}>
                              {financialResults.hitCount[lvl]} jogo(s)
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financials */}
                      <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between">
                        <div>
                          <h4 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4">Resumo Financeiro</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Investimento Total</span>
                              <span className="font-bold">R$ {financialResults.cost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total de Prêmios</span>
                              <span className="font-bold text-lime-400">R$ {financialResults.prize.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Saldo Final</span>
                            <span className={`text-2xl font-black ${financialResults.balance >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
                              {financialResults.balance >= 0 ? '+' : ''} R$ {financialResults.balance.toFixed(2)}
                            </span>
                          </div>
                          <p className={`text-[10px] mt-2 text-center uppercase tracking-tighter ${financialResults.balance >= 0 ? 'text-lime-500' : 'text-red-500'}`}>
                            {financialResults.balance >= 0 ? 'Operação em Lucro' : 'Operação em Prejuízo'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-12 py-8 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-500 text-xs space-y-2">
          <p>ESTE É UM SIMULADOR BASEADO EM PROVAS MATEMÁTICAS REAIS.</p>
          <p>A garantia de 11 pontos é válida somente se as 15 dezenas sorteadas estiverem entre as 21 escolhidas.</p>
          <p>Preços e premiações baseados nos valores oficiais vigentes (R$ 3,50 por cota).</p>
          <p className="font-bold text-slate-600 mt-4">Jogue com responsabilidade.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
