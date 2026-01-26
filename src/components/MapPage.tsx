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
    <div className="map-page-wrapper">
      <h1 style={{ textAlign: 'center' }}>Map - 訪問地点</h1>

      {/* グリッドコンテナのラッパー */}
      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        {/* メインコンテンツ: 左側に地図、右側にカード */}
        <div className="map-layout" style={{ paddingBottom: '2rem' }}>
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
      </div>

      {/* 地点追加フォーム */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f9f9f9',
        borderRadius: '8px',
        position: 'relative',
        zIndex: 10,
        clear: 'both'
      }}>
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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    if (latitude) {
      formData.append('latitude', latitude);
    }
    if (longitude) {
      formData.append('longitude', longitude);
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
        setLatitude('');
        setLongitude('');
        setSearchQuery('');
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('地点の追加に失敗しました。');
    }
  };

  const prefectures = Object.keys(prefectureCoordinates);

  // Google Maps検索を開く
  const handleGoogleMapsSearch = () => {
    const query = searchQuery || `${name} ${prefecture}`;
    if (!query.trim()) {
      alert('検索ワードを入力してください');
      return;
    }
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

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

      {/* Google Maps検索セクション */}
      <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1e40af' }}>
          📍 Google Mapsで座標を確認
        </h3>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="searchQuery" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
            検索ワード（省略可 - 場所名＋都道府県で自動検索）
          </label>
          <input
            id="searchQuery"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`例: ${name || '有馬温泉'} ${prefecture}`}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #93c5fd' }}
          />
        </div>
        <button
          type="button"
          onClick={handleGoogleMapsSearch}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500',
            width: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          🔍 Google Mapsで検索
        </button>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
          ヒント: Google Mapsで場所を右クリック → 座標をコピー → 下に貼り付け
        </p>
      </div>

      {/* 緯度経度入力欄 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="latitude" style={{ display: 'block', marginBottom: '0.25rem' }}>
            緯度（任意）
          </label>
          <input
            id="latitude"
            type="number"
            step="0.000001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="例: 35.233850"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label htmlFor="longitude" style={{ display: 'block', marginBottom: '0.25rem' }}>
            経度（任意）
          </label>
          <input
            id="longitude"
            type="number"
            step="0.000001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="例: 139.095552"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>
        ※ 緯度経度を入力しない場合は、都道府県のデフォルト位置にピンが表示されます
      </p>

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
