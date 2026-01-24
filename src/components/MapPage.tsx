import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import JapanMap, { prefectureCoordinates } from './JapanMap';
import type { MapLocation } from './JapanMap';

const MapPage: React.FC = () => {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  // 地図データを取得
  useEffect(() => {
    fetch('/api/map-locations')
      .then(res => res.json())
      .then(data => {
        const response = data as { success: boolean; locations?: MapLocation[] };
        if (response.success && response.locations) {
          setLocations(response.locations);
        }
      })
      .catch(err => console.error('Failed to fetch map locations:', err));
  }, []);

  // ピンがクリックされたときの処理
  const handlePinClick = (location: MapLocation) => {
    setSelectedLocation(location);
    // カードまでスクロール
    const element = document.getElementById(`location-card-${location.id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // カードから削除
  const handleDelete = async (locationId: number) => {
    if (!window.confirm("この地点を本当に削除しますか？")) {
      return;
    }
    const password = window.prompt("削除するにはパスワードを入力してください：");
    if (password === null || password === "") return;

    const res = await fetch(`/api/map-locations/${locationId}`, {
      method: "DELETE",
      headers: {
        'X-Auth-Password': password,
      },
    });

    if (res.ok) {
      alert("地点を削除しました。");
      setLocations(locations.filter(loc => loc.id !== locationId));
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(null);
      }
    } else {
      alert("地点の削除に失敗しました。");
    }
  };

  return (
    <div>
      <h1>Map - 訪問地点</h1>

      {/* メインコンテンツ: 左側に地図、右側にカード */}
      <div className="map-layout">
        {/* 左側: 日本地図 */}
        <div className="map-container">
          <JapanMap locations={locations} onPinClick={handlePinClick} />
        </div>

        {/* 右側: カード一覧 */}
        <div className="cards-container">
          {locations.length === 0 ? (
            <p>まだ地点が登録されていません。</p>
          ) : (
            locations.map(location => (
              <div
                key={location.id}
                id={`location-card-${location.id}`}
                className="category-card border rounded-lg p-4 shadow-md mb-4"
                style={{
                  backgroundColor: selectedLocation?.id === location.id ? '#fff3cd' : 'white',
                  transition: 'background-color 0.3s'
                }}
              >
                <p style={{ fontSize: '0.9rem', color: '#666' }}>ID: {location.id}</p>
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>
                  {location.name}
                  <span style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#666',
                    fontWeight: 'normal'
                  }}>
                    ({location.prefecture})
                  </span>
                </h3>
                <p style={{ margin: '0.5rem 0', color: '#555' }}>{location.memo}</p>

                {/* リンクされた投稿があれば表示 */}
                {location.linked_post_id && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link
                      to={`/post/${location.linked_post_id}`}
                      style={{ color: '#0066cc', textDecoration: 'underline' }}
                    >
                      関連記事を見る →
                    </Link>
                  </div>
                )}

                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                  {new Date(location.created_at).toLocaleDateString()}
                </p>

                <button
                  onClick={() => handleDelete(location.id)}
                  className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                  style={{ marginTop: '0.5rem' }}
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 地点追加フォーム */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
        <h2>新しい地点を追加</h2>
        <MapLocationForm onSubmit={(newLocation) => setLocations([...locations, newLocation])} />
      </div>
    </div>
  );
};

// 地点追加フォームコンポーネント
const MapLocationForm: React.FC<{ onSubmit: (location: MapLocation) => void }> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [prefecture, setPrefecture] = useState('東京');
  const [memo, setMemo] = useState('');
  const [linkedPostId, setLinkedPostId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !prefecture || !memo) {
      alert('名前、都道府県、メモは必須です。');
      return;
    }

    // ボタンを押した時にパスワードをプロンプトで入力
    const password = window.prompt('パスワードを入力してください：');
    if (!password) {
      alert('パスワードが入力されませんでした。');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('prefecture', prefecture);
    formData.append('memo', memo);
    formData.append('password', password);
    if (linkedPostId) {
      formData.append('linked_post_id', linkedPostId);
    }

    try {
      const res = await fetch('/api/map-locations', {
        method: 'POST',
        body: formData,
      });

      const data: { success: boolean; location?: MapLocation; error?: string } = await res.json();

      if (data.success && data.location) {
        alert('地点を追加しました！');
        onSubmit(data.location);
        // フォームをリセット
        setName('');
        setPrefecture('東京');
        setMemo('');
        setLinkedPostId('');
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('地点の追加に失敗しました。');
    }
  };

  const prefectures = Object.keys(prefectureCoordinates);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.25rem' }}>
          場所の名前 *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 有馬温泉"
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div>
        <label htmlFor="prefecture" style={{ display: 'block', marginBottom: '0.25rem' }}>
          都道府県 *
        </label>
        <select
          id="prefecture"
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {prefectures.map(pref => (
            <option key={pref} value={pref}>{pref}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="memo" style={{ display: 'block', marginBottom: '0.25rem' }}>
          メモ *
        </label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="ちょっとしたメモ"
          rows={3}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div>
        <label htmlFor="linkedPostId" style={{ display: 'block', marginBottom: '0.25rem' }}>
          関連する投稿ID（任意）
        </label>
        <input
          id="linkedPostId"
          type="number"
          value={linkedPostId}
          onChange={(e) => setLinkedPostId(e.target.value)}
          placeholder="例: 12"
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <button
        type="submit"
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
      >
        地点を追加
      </button>
    </form>
  );
};

export default MapPage;
