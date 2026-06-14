'use client';
import { useState } from 'react';

export default function Home() {
  const [step, setStep] = useState(0);
  const [ages, setAges] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [pref, setPref] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const search = async () => {
    setStep(4);
    const keywords = ['子育て', '育児', '保育'];
    const allResults = [];

    // jGrants APIから取得
    for (const kw of keywords) {
      try {
        const res = await fetch(`/api/subsidies?keyword=${kw}&area=${pref}&limit=10`);
        const data = await res.json();
        if (data.result) allResults.push(...data.result.map(r => ({
          id: r.id,
          title: r.title,
          amount: r.subsidy_max_limit ? `最大 ${Number(r.subsidy_max_limit).toLocaleString()}円` : '金額未定',
          deadline: r.acceptance_end_datetime ? new Date(r.acceptance_end_datetime).toLocaleDateString('ja-JP') : null,
          area: r.target_area_search,
          url: r.url_to_subsidy,
          type: 'jgrants',
        })));
      } catch(e) {}
    }

    // 静的データから取得
    try {
      const res = await fetch('/subsidies-static.json');
      const staticData = await res.json();
      staticData.forEach(s => allResults.push({
        id: s.name,
        title: s.name,
        amount: s.amount,
        deadline: null,
        area: '全国',
        url: s.url,
        description: s.description,
        type: 'static',
      }));
    } catch(e) {}

    // 重複除去
    const unique = Array.from(new Map(allResults.map(r => [r.id, r])).values());
    setResults(unique);
    setStep(5);
  };

  const ageOptions = ['妊娠中', '0〜2歳', '3〜5歳', '小学生', '中学生以上'];
  const statusOptions = ['ひとり親', '共働き', '専業主婦(夫)', '低所得世帯', '多子世帯(3人以上)', '障害のある子'];
  const prefOptions = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'];

  return (
    <main className="max-w-xl mx-auto px-4 py-12 min-h-screen">

      {step === 0 && (
        <div>
          <p className="text-sm text-emerald-600 mb-3 font-medium">🌱 子育て補助金かんたん検索</p>
          <h1 className="text-3xl font-medium mb-4 leading-snug">あなたに使える補助金、<br />まとめて見つけます。</h1>
          <p className="text-gray-500 mb-10">3つの質問に答えるだけで、国・自治体の補助金をリストアップします。</p>
          <button onClick={() => setStep(1)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg transition">はじめる →</button>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="flex gap-1 mb-8">{[1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i === 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}</div>
          <p className="text-xs text-gray-400 mb-2">質問 1 / 3</p>
          <h2 className="text-lg font-medium mb-2">お子さんの年齢を教えてください</h2>
          <p className="text-sm text-gray-400 mb-5">該当するものをすべて選んでください</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {ageOptions.map(a => (
              <button key={a} onClick={() => toggleItem(a, ages, setAges)}
                className={`px-4 py-2 rounded-full border text-sm transition ${ages.includes(a) ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                {a}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={ages.length === 0} className="bg-emerald-600 text-white px-8 py-3 rounded-lg disabled:opacity-40">次へ →</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex gap-1 mb-8">{[1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}</div>
          <p className="text-xs text-gray-400 mb-2">質問 2 / 3</p>
          <h2 className="text-lg font-medium mb-2">世帯の状況を教えてください</h2>
          <p className="text-sm text-gray-400 mb-5">該当するものをすべて選んでください</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {statusOptions.map(s => (
              <button key={s} onClick={() => toggleItem(s, statuses, setStatuses)}
                className={`px-4 py-2 rounded-full border text-sm transition ${statuses.includes(s) ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border border-gray-300 px-6 py-3 rounded-lg text-sm">← 戻る</button>
            <button onClick={() => setStep(3)} disabled={statuses.length === 0} className="bg-emerald-600 text-white px-8 py-3 rounded-lg disabled:opacity-40">次へ →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="flex gap-1 mb-8">{[1,2,3].map(i => <div key={i} className="h-1 flex-1 rounded-full bg-emerald-500" />)}</div>
          <p className="text-xs text-gray-400 mb-2">質問 3 / 3</p>
          <h2 className="text-lg font-medium mb-2">お住まいの都道府県は？</h2>
          <p className="text-sm text-gray-400 mb-5">地域の補助金も表示します</p>
          <select value={pref} onChange={e => setPref(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-8 text-gray-700">
            <option value="">選択してください</option>
            {prefOptions.map(p => <option key={p}>{p}</option>)}
          </select>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="border border-gray-300 px-6 py-3 rounded-lg text-sm">← 戻る</button>
            <button onClick={search} disabled={!pref} className="bg-emerald-600 text-white px-8 py-3 rounded-lg disabled:opacity-40">補助金を探す →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-24">
          <div className="flex justify-center gap-1 mb-4">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
          </div>
          <p className="text-gray-400 text-sm">補助金を検索中…</p>
        </div>
      )}

      {step === 5 && (
        <div>
          <p className="text-xs text-gray-400 mb-1">検索結果</p>
          <p className="text-lg font-medium mb-6"><span className="text-emerald-600">{results.length}件</span>の補助金が見つかりました</p>
          {results.map(r => (
            <div key={r.id} className="border border-gray-200 rounded-xl p-5 mb-3 hover:border-gray-300 transition">
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium flex-1">{r.title}</p>
                <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${r.type === 'static' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {r.type === 'static' ? '常設制度' : '公募中'}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mb-2">
                <span className="text-sm text-gray-500">💰 {r.amount}</span>
                {r.deadline && <span className="text-sm text-gray-500">📅 締切: {r.deadline}</span>}
              </div>
              {r.description && <p className="text-sm text-gray-400 mb-2">{r.description}</p>}
              <p className="text-xs text-gray-400 mb-3">📍 {r.area}</p>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline">詳細・申請ページ →</a>
              )}
            </div>
          ))}
          <button onClick={() => setStep(0)} className="mt-6 text-sm text-gray-400 hover:text-gray-600">← 最初からやり直す</button>
        </div>
      )}
    </main>
  );
}