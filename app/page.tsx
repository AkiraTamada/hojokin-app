// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';

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
  const [city, setCity] = useState('');
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        setSession(data?.user ? data : null);
        setSessionLoading(false);
        if (data?.user?.email) {
          fetch(`/api/check-paid?email=${encodeURIComponent(data.user.email)}`)
            .then(r => r.json())
            .then(d => setIsPaid(d.isPaid || false));
        }
      })
      .catch(() => setSessionLoading(false));
  }, []);

  const prefOptions = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県', '大阪府', '京都府', '兵庫県', '愛知県', '福岡県', '北海道'];
  const cityOptions = {
    '東京都': ['新宿区','渋谷区','世田谷区','練馬区','大田区','足立区','江東区','墨田区','板橋区','豊島区','中野区','杉並区','北区','荒川区','港区','千代田区','中央区','台東区','品川区','目黒区','文京区','江戸川区','葛飾区'],
    '神奈川県': ['横浜市','川崎市','相模原市','横須賀市','藤沢市','平塚市','厚木市'],
    '埼玉県': ['さいたま市','川口市','川越市','越谷市','所沢市','草加市'],
    '千葉県': ['千葉市','船橋市','柏市','松戸市','市川市','浦安市'],
    '大阪府': ['大阪市'],
    '京都府': ['京都市'],
    '兵庫県': ['神戸市'],
    '愛知県': ['名古屋市'],
    '福岡県': ['福岡市'],
    '北海道': ['札幌市'],
  };

  const toggleItem = (item, list, setList) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const currentCat = categories[0];
  const questions = currentCat ? CATEGORY_QUESTIONS[currentCat] : null;

  const isFreeResult = (r) => {
    // 無料枠：子育てカテゴリ かつ 国（jgrants or source=national）
    const isKosodate = categories.includes('kosodate');
    const isNational = r.type === 'jgrants' || r.source === 'national';
    return isKosodate && isNational;
  };

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
          url: r.url_to_subsidy || `https://www.jgrants-portal.go.jp/subsidy/search?keyword=${encodeURIComponent(r.title)}`,
          type: 'jgrants',
        })));
      } catch(e) {}
    }

    try {
      const res = await fetch('/subsidies-static.json');
      const staticData = await res.json();
      const staticList = staticData.subsidies || staticData;
      const catMap = { kosodate: '子育て', jutaku: '住宅', iryo: '医療', kyoiku: '教育', seikatsu: '生活支援', shuro: '就労支援' };
      const selectedCats = categories.map(c => catMap[c]);
      staticList.filter(s => s.category.some(c => selectedCats.includes(c)) && (s.source === 'national' || s.prefecture === pref) && (!city || !s.city || s.city === city)).forEach(s => allResults.push({
        id: s.id || s.name,
        title: s.name,
        amount: s.amount,
        deadline: null,
        area: s.municipality || s.prefecture || '全国',
        url: s.applicationUrl || s.url,
        description: s.description,
        type: 'static',
        source: s.source,
      }));
    } catch(e) {}

    const unique = Array.from(new Map(allResults.map(r => [r.id, r])).values());
    setResults(unique);
    setStep(6);
  };

  const isLoggedIn = !!session?.user;

  return (
    <main className="max-w-xl mx-auto px-4 py-12 min-h-screen">

      {step === 0 && (
        <div>
          <div className="flex justify-end mb-6">
            {sessionLoading ? null : isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{session.user.email}</span>
                <a href="/api/auth/signout" className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1 rounded-lg">ログアウト</a>
              </div>
            ) : (
              <a href="/api/auth/signin" className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:border-gray-300 transition">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Googleでログイン
              </a>
            )}
          </div>
          <p className="text-sm text-emerald-600 mb-3 font-medium">🌿 補助金かんたん検索</p>
          <h1 className="text-3xl font-medium mb-4 leading-snug">あなたに使える補助金、<br />まとめて見つけます。</h1>
          <p className="text-gray-500 mb-6">いくつかの質問に答えるだけで、国・自治体の補助金をリストアップします。</p>
          {!isLoggedIn && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8 text-sm text-emerald-700">
              🆓 <strong>無料</strong>で子育て・育児の国の補助金を検索できます。<br />
              自治体の補助金やその他カテゴリは<strong>¥980</strong>でご利用いただけます。
            </div>
          )}
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
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="border border-gray-300 px-6 py-3 rounded-lg text-sm">← 戻る</button>
            <button onClick={() => setStep(2)} disabled={categories.length === 0} className="bg-emerald-600 text-white px-8 py-3 rounded-lg disabled:opacity-40">次へ →</button>
          </div>
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
          <select value={pref} onChange={e => { setPref(e.target.value); setCity(''); }} className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-700">
            <option value="">選択してください</option>
            {prefOptions.map(p => <option key={p}>{p}</option>)}
          </select>
          {pref && (cityOptions[pref] || []).length > 0 && (
            <select value={city} onChange={e => setCity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-8 text-gray-700">
              <option value="">区市町村を選ぶ（任意）</option>
              {(cityOptions[pref] || []).map(c => <option key={c}>{c}</option>)}
            </select>
          )}
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
          {results.map(r => {
            const free = r.type === 'jgrants' || r.source === 'national';
            const locked = !isPaid && !free;
            return (
              <div key={r.id} className={`border rounded-xl p-5 mb-3 transition ${locked ? 'border-gray-100 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                {locked ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-400 mb-2">🔒 この補助金はログイン＆プレミアム登録後にご覧いただけます</p>
                    <a href="/api/auth/signin" className="text-sm text-emerald-600 hover:underline mr-4">Googleでログイン →</a>
                    <button onClick={async () => {
                      if (!isLoggedIn) {
                        window.location.href = '/api/auth/signin';
                        return;
                      }
                      const res = await fetch('/api/checkout', { method: 'POST' });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    }} className="text-sm bg-emerald-600 text-white px-4 py-1 rounded-lg hover:bg-emerald-700">¥980で購入 →</button>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            );
          })}
          <button onClick={() => { setStep(0); setCategories([]); setAnswers1([]); setAnswers2([]); setPref(''); }} className="mt-6 text-sm text-gray-400 hover:text-gray-600">← 最初からやり直す</button>
        </div>
      )}
    </main>
  );
}