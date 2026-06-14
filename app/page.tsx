// @ts-nocheck
'use client';
import { useState } from 'react';

const CATEGORIES = [
  { id: 'kosodate', label: '🍼 子育て・育児' },
  { id: 'jutaku', label: '🏠 住宅・リフォーム' },
  { id: 'iryo', label: '🏥 医療・介護' },
  { id: 'kyoiku', label: '📚 教育・奨学金' },
  { id: 'seikatsu', label: '💰 生活支援' },
  { id: 'shuro', label: '💼 就労支援' },
];

const CATEGORY_QUESTIONS = {
  kosodate: {
    q1: { label: 'お子さんの年齢', options: ['妊娠中', '0〜2歳', '3〜5歳', '小学生', '中学生以上'] },
    q2: { label: '世帯の状況', options: ['ひとり親', '共働き', '専業主婦(夫)', '低所得世帯', '多子世帯(3人以上)', '障害のある子'] },
  },
  jutaku: {
    q1: { label: '住宅の状況', options: ['持ち家', '賃貸', 'これから購入予定'] },
    q2: { label: 'リフォーム内容', options: ['省エネ・断熱', '耐震改修', 'バリアフリー', 'その他'] },
  },
  iryo: {
    q1: { label: '該当する状況', options: ['高額医療費がかかっている', '介護が必要な家族がいる', '障害がある', '難病・特定疾患'] },
    q2: { label: '世帯状況', options: ['低所得世帯', 'ひとり親', '高齢者のみ世帯', '特になし'] },
  },
  kyoiku: {
    q1: { label: '対象者', options: ['本人が学生', '子どもが学生', '両方'] },
    q2: { label: '学校の種別', options: ['高校', '大学・短大', '専門学校', '大学院'] },
  },
  seikatsu: {
    q1: { label: '世帯の状況', options: ['低所得世帯', 'ひとり親', '高齢者のみ世帯', '障害のある家族がいる'] },
    q2: { label: '困っていること', options: ['生活費が苦しい', '食費が苦しい', '光熱費が苦しい', 'その他'] },
  },
  shuro: {
    q1: { label: '現在の状況', options: ['求職中', '育休後復職予定', '移住検討中', '副業・起業検討中'] },
    q2: { label: '希望すること', options: ['職業訓練を受けたい', '再就職手当を受けたい', '移住支援を受けたい', '起業支援を受けたい'] },
  },
};

const CATEGORY_KEYWORDS = {
  kosodate: ['子育て', '育児', '保育'],
  jutaku: ['住宅', 'リフォーム', '省エネ'],
  iryo: ['医療', '介護', '障害'],
  kyoiku: ['奨学金', '教育', '学費'],
  seikatsu: ['生活支援', '給付金', '物価'],
  shuro: ['就労', '職業訓練', '再就職'],
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [answers1, setAnswers1] = useState([]);
  const [answers2, setAnswers2] = useState([]);
  const [pref, setPref] = useState('');
  const [results, setResults] = useState([]);

  const prefOptions = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県', '大阪府', '京都府', '兵庫県'];

  const toggleItem = (item, list, setList) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const currentCat = categories[0];
  const questions = currentCat ? CATEGORY_QUESTIONS[currentCat] : null;

  const search = async () => {
    setStep(5);
    const allResults = [];
    const keywords = categories.flatMap(c => CATEGORY_KEYWORDS[c] || []);
    const uniqueKeywords = [...new Set(keywords)];

    for (const kw of uniqueKeywords) {
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

try {
      const res = await fetch('/subsidies-static.json');
      const staticData = await res.json();
      const staticList = staticData.subsidies || staticData;
      const catMap = { kosodate: 'childcare', jutaku: 'housing', iryo: 'medical', kyoiku: 'education', seikatsu: 'livelihood', shuro: 'employment' };
      const selectedCats = categories.map(c => catMap[c]);
      staticList.filter(s => selectedCats.includes(s.category)).forEach(s => allResults.push({
        id: s.id || s.name,
        title: s.name,
        amount: s.amount,
        deadline: null,
        area: s.municipality || s.prefecture || '全国',
        url: s.applicationUrl || s.url,
        description: s.description,
        type: 'static',
      }));
    } catch(e) {}

    const unique = Array.from(new Map(allResults.map(r => [r.id, r])).values());
    setResults(unique);
    setStep(6);
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-12 min-h-screen">

      {step === 0 && (
        <div>
          <p className="text-sm text-emerald-600 mb-3 font-medium">🌿 補助金かんたん検索</p>
          <h1 className="text-3xl font-medium mb-4 leading-snug">あなたに使える補助金、<br />まとめて見つけます。</h1>
          <p className="text-gray-500 mb-10">いくつかの質問に答えるだけで、国・自治体の補助金をリストアップします。</p>
          <button onClick={() => setStep(1)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg transition">はじめる →</button>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="flex gap-1 mb-8">{[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i === 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}</div>
          <p className="text-xs text-gray-400 mb-2">質問 1 / 4</p>
          <h2 className="text-lg font-medium mb-2">どんな補助金を探していますか？</h2>
          <p className="text-sm text-gray-400 mb-5">該当するものをすべて選んでください</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => toggleItem(c.id, categories, setCategories)}
                className={`px-4 py-2 rounded-full border text-sm transition ${categories.includes(c.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-600'}`}>
                {c.label}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={categories.length === 0} className="bg-emerald-600 text-white px-8 py-3 rounded-lg disabled:opacity-40">次へ →</button>
        </div>
      )}

      {step === 2 && questions && (
        <div>
          <div className="flex gap-1 mb-8">{[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}</div>
          <p className="text-xs text-gray-400 mb-2">質問 2 / 4</p>
          <h2 className="text-lg font-medium mb-2">{questions.q1.label}</h2>
          <p className="text-sm text-gray-400 mb-5">該当するものをすべて選んでください</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {questions.q1.options.map(o => (
              <button key={o} onClick={() => toggleItem(o, answers1, setAnswers1)}
                className={`px-4 py-2 rounded-full border text-sm transition ${answers1.includes(o) ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-600'}`}>
                {o}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border border-gray-300 px-6 py-3 rounded-lg text-sm">← 戻る</button>
            <button onClick={() => setStep(3)} disabled={answers1.length === 0} className="bg-emerald-600 text-white px-8 py-3 rounded-lg disabled:opacity-40">次へ →</button>
          </div>
        </div>
      )}

      {step === 3 && questions && (
        <div>
          <div className="flex gap-1 mb-8">{[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}</div>
          <p className="text-xs text-gray-400 mb-2">質問 3 / 4</p>
          <h2 className="text-lg font-medium mb-2">{questions.q2.label}</h2>
          <p className="text-sm text-gray-400 mb-5">該当するものをすべて選んでください</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {questions.q2.options.map(o => (
              <button key={o} onClick={() => toggleItem(o, answers2, setAnswers2)}
                className={`px-4 py-2 rounded-full border text-sm transition ${answers2.includes(o) ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-600'}`}>
                {o}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="border border-gray-300 px-6 py-3 rounded-lg text-sm">← 戻る</button>
            <button onClick={() => setStep(4)} disabled={answers2.length === 0} className="bg-emerald-600 text-white px-8 py-3 rounded-lg disabled:opacity-40">次へ →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="flex gap-1 mb-8">{[1,2,3,4].map(i => <div key={i} className="h-1 flex-1 rounded-full bg-emerald-500" />)}</div>
          <p className="text-xs text-gray-400 mb-2">質問 4 / 4</p>
          <h2 className="text-lg font-medium mb-2">お住まいの都道府県は？</h2>
          <p className="text-sm text-gray-400 mb-5">地域の補助金も表示します</p>
          <select value={pref} onChange={e => setPref(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-8 text-gray-700">
            <option value="">選択してください</option>
            {prefOptions.map(p => <option key={p}>{p}</option>)}
          </select>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="border border-gray-300 px-6 py-3 rounded-lg text-sm">← 戻る</button>
            <button onClick={search} disabled={!pref} className="bg-emerald-600 text-white px-8 py-3 rounded-lg disabled:opacity-40">補助金を探す →</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="text-center py-24">
          <div className="flex justify-center gap-1 mb-4">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
          </div>
          <p className="text-gray-400 text-sm">補助金を検索中…</p>
        </div>
      )}

      {step === 6 && (
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
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline">詳細・申請ページ →</a>}
            </div>
          ))}
          <button onClick={() => { setStep(0); setCategories([]); setAnswers1([]); setAnswers2([]); setPref(''); }} className="mt-6 text-sm text-gray-400 hover:text-gray-600">← 最初からやり直す</button>
        </div>
      )}
    </main>
  );
}