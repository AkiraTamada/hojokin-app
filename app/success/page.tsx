export default function SuccessPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-6">🎉</p>
      <h1 className="text-2xl font-medium mb-4">ご購入ありがとうございます！</h1>
      <p className="text-gray-500 mb-8">プレミアム機能が有効になりました。すべての補助金を検索できます。</p>
      <a href="/" className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition">補助金を探す →</a>
    </main>
  );
}
