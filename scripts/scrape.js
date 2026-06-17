/**
 * scripts/scrape.js
 * Puppeteerを使って自治体サイトを自動巡回し
 * 補助金データのURLを検証・更新するスクリプト
 *
 * 使い方: node scripts/scrape.js
 */

import puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'subsidies-static.json');

const MUNICIPALITY_TARGETS = [
  { id: 'tokyo-childcare-001', url: 'https://www.fukushi.metro.tokyo.lg.jp/kodomo/kosodate/josei/', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=東京都+こども医療費助成' },
  { id: 'tokyo-childcare-002', url: 'https://www.fukushi.metro.tokyo.lg.jp/kodomo/kosodate/akachan_first.html', keyword: '赤ちゃんファースト', fallbackUrl: 'https://www.google.com/search?q=東京都+赤ちゃんファースト+出産応援' },
  { id: 'tokyo-housing-001', url: 'https://www.juutakuseisaku.metro.tokyo.lg.jp/juutaku_shien/', keyword: '家賃', fallbackUrl: 'https://www.google.com/search?q=東京都+住宅確保+家賃補助' },
  { id: 'tokyo-education-001', url: 'https://www.metro.tokyo.lg.jp/tosei/hodohappyo/press/2023/04/14/06.html', keyword: '授業料', fallbackUrl: 'https://www.google.com/search?q=東京都+私立高校+授業料軽減+助成' },
  { id: 'tokyo-livelihood-001', url: 'https://www.fukushi.metro.tokyo.lg.jp/seikatsu/shikin/', keyword: '生活福祉資金', fallbackUrl: 'https://www.google.com/search?q=東京都+生活福祉資金+緊急小口' },
  { id: 'tokyo-employment-001', url: 'https://www.hataraku.metro.tokyo.lg.jp/jichitai/hojyokin/', keyword: '正規雇用', fallbackUrl: 'https://www.google.com/search?q=東京都+正規雇用転換+助成金' },
  { id: 'yokohama-childcare-001', url: 'https://www.city.yokohama.lg.jp/kenko-iryo-fukushi/kenko-iryo/iryohijosei/shoni/child.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=横浜市+こども医療費助成' },
  { id: 'yokohama-childcare-002', url: 'https://www.city.yokohama.lg.jp/kurashi/kosodate-kyoiku/kosodateshien/shussankosodate/', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=横浜市+出産子育て応援給付金' },
  { id: 'yokohama-housing-001', url: 'https://www.city.yokohama.lg.jp/kurashi/sumai-kurashi/sumai/shien/minkan/', keyword: '入居', fallbackUrl: 'https://www.google.com/search?q=横浜市+民間賃貸住宅+入居支援' },
  { id: 'yokohama-education-001', url: 'https://www.city.yokohama.lg.jp/kurashi/kosodate-kyoiku/kyoiku/shogakushien/', keyword: '奨学', fallbackUrl: 'https://www.google.com/search?q=横浜市+奨学給付金' },
  { id: 'yokohama-medical-001', url: 'https://www.city.yokohama.lg.jp/kurashi/kenko-iryo/iryo/josei/judo/', keyword: '障害', fallbackUrl: 'https://www.google.com/search?q=横浜市+重度障害者+医療費助成' },
  { id: 'yokohama-livelihood-001', url: 'https://www.city.yokohama.lg.jp/kurashi/fukushi-kaigo/fukushi/', keyword: '給付', fallbackUrl: 'https://www.google.com/search?q=横浜市+生活支援+給付金' },
  { id: 'kawasaki-childcare-001', url: 'https://www.city.kawasaki.jp/450/page/0000128564.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=川崎市+こども医療費助成' },
  { id: 'kawasaki-childcare-002', url: 'https://www.city.kawasaki.jp/450/page/0000142897.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=川崎市+出産子育て応援給付金' },
  { id: 'kawasaki-housing-001', url: 'https://www.city.kawasaki.jp/500/page/0000043481.html', keyword: '居住', fallbackUrl: 'https://www.google.com/search?q=川崎市+居住支援+賃貸住宅' },
  { id: 'kawasaki-education-001', url: 'https://www.city.kawasaki.jp/880/page/0000024500.html', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=川崎市+就学援助' },
  { id: 'kawasaki-medical-001', url: 'https://www.city.kawasaki.jp/350/page/0000009700.html', keyword: '障害', fallbackUrl: 'https://www.google.com/search?q=川崎市+重度障害者+医療費助成' },
  { id: 'kawasaki-livelihood-001', url: 'https://www.city.kawasaki.jp/350/page/0000048949.html', keyword: '給付', fallbackUrl: 'https://www.google.com/search?q=川崎市+住居確保給付金' },
  { id: 'saitama-childcare-001', url: 'https://www.city.saitama.jp/006/013/002/p003478.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=さいたま市+こども医療費助成' },
  { id: 'saitama-childcare-002', url: 'https://www.city.saitama.jp/006/010/005/p090000.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=さいたま市+出産子育て応援給付金' },
  { id: 'saitama-housing-001', url: 'https://www.city.saitama.jp/001/015/011/003/index.html', keyword: '住宅', fallbackUrl: 'https://www.google.com/search?q=さいたま市+住宅+補助' },
  { id: 'saitama-education-001', url: 'https://www.city.saitama.jp/006/010/003/p000000.html', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=さいたま市+就学援助' },
  { id: 'saitama-livelihood-001', url: 'https://www.city.saitama.jp/006/006/', keyword: '生活', fallbackUrl: 'https://www.google.com/search?q=さいたま市+生活困窮者+支援' },
  { id: 'chiba-childcare-001', url: 'https://www.city.chiba.jp/kosodate/kosodate/kosodate/index.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=千葉市+こども医療費助成' },
  { id: 'chiba-childcare-002', url: 'https://www.city.chiba.jp/kodomomirai/kodomomirai/oenkyuhukin.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=千葉市+出産子育て応援給付金' },
  { id: 'chiba-housing-001', url: 'https://www.city.chiba.jp/toshi/jutaku/shien.html', keyword: '住宅', fallbackUrl: 'https://www.google.com/search?q=千葉市+住宅+入居支援' },
  { id: 'chiba-education-001', url: 'https://www.city.chiba.jp/kyoiku/gakko/shogakushien/', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=千葉市+就学援助' },
  { id: 'chiba-medical-001', url: 'https://www.city.chiba.jp/hokenfukushi/iryoeisei/shien/judo.html', keyword: '障害', fallbackUrl: 'https://www.google.com/search?q=千葉市+重度障害者+医療費助成' },
  { id: 'chiba-livelihood-001', url: 'https://www.city.chiba.jp/hokenfukushi/fukushi/seikatsu/', keyword: '生活', fallbackUrl: 'https://www.google.com/search?q=千葉市+生活困窮者+給付金' },
  { id: 'osaka-childcare-001', url: 'https://www.city.osaka.lg.jp/kodomo/page/0000008398.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=大阪市+こども医療費助成' },
  { id: 'osaka-childcare-002', url: 'https://www.city.osaka.lg.jp/kodomo/page/0000588079.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=大阪市+出産応援給付金' },
  { id: 'osaka-housing-001', url: 'https://www.city.osaka.lg.jp/toshiseibi/page/0000009525.html', keyword: '家賃', fallbackUrl: 'https://www.google.com/search?q=大阪市+民間賃貸住宅+家賃補助' },
  { id: 'osaka-education-001', url: 'https://www.city.osaka.lg.jp/kyoiku/page/0000009398.html', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=大阪市+就学援助' },
  { id: 'osaka-medical-001', url: 'https://www.city.osaka.lg.jp/fukushi/page/0000009123.html', keyword: '障害', fallbackUrl: 'https://www.google.com/search?q=大阪市+重度障害者+医療費助成' },
  { id: 'osaka-livelihood-001', url: 'https://www.city.osaka.lg.jp/fukushi/page/0000580000.html', keyword: '給付', fallbackUrl: 'https://www.google.com/search?q=大阪市+生活支援+給付金' },
  { id: 'kyoto-childcare-001', url: 'https://www.city.kyoto.lg.jp/hokenfukushi/page/0000011234.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=京都市+こども医療費助成' },
  { id: 'kyoto-childcare-002', url: 'https://www.city.kyoto.lg.jp/hokenfukushi/page/0000300000.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=京都市+出産子育て応援給付金' },
  { id: 'kyoto-housing-001', url: 'https://www.city.kyoto.lg.jp/tokei/page/0000200000.html', keyword: '空き家', fallbackUrl: 'https://www.google.com/search?q=京都市+空き家+リフォーム補助' },
  { id: 'kyoto-education-001', url: 'https://www.city.kyoto.lg.jp/kyoiku/page/0000011000.html', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=京都市+就学援助' },
  { id: 'kyoto-livelihood-001', url: 'https://www.city.kyoto.lg.jp/hokenfukushi/page/0000012000.html', keyword: '生活', fallbackUrl: 'https://www.google.com/search?q=京都市+生活困窮者+自立支援' },
  { id: 'kobe-childcare-001', url: 'https://www.city.kobe.lg.jp/a39607/shise/kekaku/shisaku/kodomo/iryohi.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=神戸市+こども医療費助成' },
  { id: 'kobe-childcare-002', url: 'https://www.city.kobe.lg.jp/a39607/shise/kekaku/shisaku/kodomo/ouen.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=神戸市+出産子育て応援給付金' },
  { id: 'kobe-housing-001', url: 'https://www.city.kobe.lg.jp/a39607/shise/kekaku/shisaku/jutaku/reform.html', keyword: 'リフォーム', fallbackUrl: 'https://www.google.com/search?q=神戸市+住宅リフォーム助成' },
  { id: 'kobe-education-001', url: 'https://www.city.kobe.lg.jp/a39607/shise/kekaku/shisaku/kyoiku/shugaku.html', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=神戸市+就学援助' },
  { id: 'kobe-livelihood-001', url: 'https://www.city.kobe.lg.jp/a39607/shise/kekaku/shisaku/fukushi/kyufu.html', keyword: '給付', fallbackUrl: 'https://www.google.com/search?q=神戸市+生活支援+給付金' },
  { id: 'nagoya-childcare-001', url: 'https://www.city.nagoya.jp/kodomoseishonen/page/0000009398.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=名古屋市+こども医療費助成' },
  { id: 'nagoya-childcare-002', url: 'https://www.city.nagoya.jp/kodomoseishonen/page/0000170000.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=名古屋市+出産子育て応援給付金' },
  { id: 'nagoya-housing-001', url: 'https://www.city.nagoya.jp/jutakutoshi/page/0000009000.html', keyword: 'リフォーム', fallbackUrl: 'https://www.google.com/search?q=名古屋市+住宅リフォーム助成' },
  { id: 'nagoya-education-001', url: 'https://www.city.nagoya.jp/kyoiku/page/0000009100.html', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=名古屋市+就学援助' },
  { id: 'nagoya-livelihood-001', url: 'https://www.city.nagoya.jp/fukushi/page/0000580000.html', keyword: '給付', fallbackUrl: 'https://www.google.com/search?q=名古屋市+生活支援+給付金' },
  { id: 'fukuoka-childcare-001', url: 'https://www.city.fukuoka.lg.jp/kodomo/k-kyufu/child/kodomotiryouhi.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=福岡市+こども医療費助成' },
  { id: 'fukuoka-childcare-002', url: 'https://www.city.fukuoka.lg.jp/kodomo/k-kyufu/child/ouen.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=福岡市+出産子育て応援給付金' },
  { id: 'fukuoka-housing-001', url: 'https://www.city.fukuoka.lg.jp/jutaku/r-support/reform.html', keyword: 'リフォーム', fallbackUrl: 'https://www.google.com/search?q=福岡市+住宅リフォーム助成' },
  { id: 'fukuoka-education-001', url: 'https://www.city.fukuoka.lg.jp/kyoiku/shugakushien/index.html', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=福岡市+就学援助' },
  { id: 'fukuoka-livelihood-001', url: 'https://www.city.fukuoka.lg.jp/hofuku/seikatsu/index.html', keyword: '給付', fallbackUrl: 'https://www.google.com/search?q=福岡市+生活支援+給付金' },
  { id: 'sapporo-childcare-001', url: 'https://www.city.sapporo.jp/kodomo/shien/iryohi/index.html', keyword: '医療費', fallbackUrl: 'https://www.google.com/search?q=札幌市+こども医療費助成' },
  { id: 'sapporo-childcare-002', url: 'https://www.city.sapporo.jp/kodomo/shien/ouen/index.html', keyword: '給付金', fallbackUrl: 'https://www.google.com/search?q=札幌市+出産子育て応援給付金' },
  { id: 'sapporo-housing-001', url: 'https://www.city.sapporo.jp/toshi/jutaku/reform/index.html', keyword: 'リフォーム', fallbackUrl: 'https://www.google.com/search?q=札幌市+住宅リフォーム助成' },
  { id: 'sapporo-education-001', url: 'https://www.city.sapporo.jp/kyoiku/shien/index.html', keyword: '就学援助', fallbackUrl: 'https://www.google.com/search?q=札幌市+就学援助' },
  { id: 'sapporo-livelihood-001', url: 'https://www.city.sapporo.jp/fukushi/seikatsu/index.html', keyword: '給付', fallbackUrl: 'https://www.google.com/search?q=札幌市+生活支援+給付金' },
];

async function verifyAndFixUrls() {
  console.log('🚀 Puppeteerを起動中...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
  let fixedCount = 0;
  let okCount = 0;
  console.log(`\n📋 ${MUNICIPALITY_TARGETS.length}件のURLを検証します...\n`);
  for (const target of MUNICIPALITY_TARGETS) {
    const subsidy = data.subsidies.find(s => s.id === target.id);
    if (!subsidy) continue;
    process.stdout.write(`[${target.id}] `);
    try {
      const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const status = response.status();
      const content = await page.content();
      const hasKeyword = content.includes(target.keyword);
      if (status === 200 && hasKeyword) {
        console.log(`✅ OK`);
        okCount++;
      } else {
        console.log(`❌ ${status} / キーワード${hasKeyword ? 'あり' : 'なし'} → Google検索URLに変更`);
        subsidy.applicationUrl = target.fallbackUrl;
        fixedCount++;
      }
    } catch (e) {
      console.log(`❌ エラー → Google検索URLに変更`);
      subsidy.applicationUrl = target.fallbackUrl;
      fixedCount++;
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  await browser.close();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('\n' + '='.repeat(60));
  console.log(`✅ OK: ${okCount}件 / 🔧 修正: ${fixedCount}件`);
  console.log('💾 保存完了');
  console.log('='.repeat(60));
  console.log('\n次のコマンドでデプロイ:');
  console.log('git add public/subsidies-static.json && git commit -m "fix: URLを自動検証・修正" && git push origin main');
}

verifyAndFixUrls().catch(e => { console.error('❌ エラー:', e); process.exit(1); });