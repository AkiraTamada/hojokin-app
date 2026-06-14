export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '子育て';
  const area = searchParams.get('area') || '';
  const limit = searchParams.get('limit') || '10';

  const params = new URLSearchParams({
    keyword,
    sort: 'created_date',
    order: 'DESC',
    limit,
    acceptance: '1',
  });
  if (area) params.append('target_area_search', area);

  const res = await fetch(
    `https://api.jgrants-portal.go.jp/exp/v1/public/subsidies?${params}`
  );
  const data = await res.json();

  return Response.json(data);
}