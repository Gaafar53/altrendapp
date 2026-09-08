import { useEffect, useState } from 'react';

export default function EGChain() {
  const [chain, setChain] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/chain.json')
     .then(r => r.json())
     .then(data => {
        setChain(data);
        setLoading(false);
      })
     .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">جاري تحميل بلوكتشين EG... ⛓️</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold mb-2">⛓️ بلوكتشين EG - نظام المقام</h1>
      <p className="text-gray-600 mb-4">Genesis V3 - 315 = 3×3×5×7 | الوحدة = 1/315</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-black text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{chain.length}</div>
          <div className="text-sm">عدد البلوكات</div>
        </div>
        <div className="bg-purple-600 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{chain[0]?.value || 315}</div>
          <div className="text-sm">المقام الأساسي</div>
        </div>
        <div className="bg-green-600 text-white p-4 rounded-xl">
          <div className="text-sm font-bold">✓ موثق</div>
          <div className="text-sm">EG Blockchain</div>
        </div>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-auto">
        {chain.slice(-20).reverse().map((block: any, i: number) => (
          <div key={i} className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">بلوك #{block.index} - {block.label || block.type}</div>
                <div className="text-sm text-gray-600">{block.formula}</div>
                <div className="text-xs text-gray-500 mt-1">{block.time}</div>
              </div>
              <div className="text-left">
                <div className="text-xs font-mono bg-gray-100 p-1 rounded">{block.fraction}</div>
                <div className="text-xs font-mono mt-1 text-purple-600">{block.hash?.slice(0,20)}...</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="font-bold">💡 فكرة المقام 315</div>
        <div className="text-sm mt-1">كل فيديو في #الترند هيتوثق كـ كسر من 315. 315 وحدة = فيديو كامل متوثق بالبلوكتشين المصري!</div>
      </div>
    </div>
  );
}
