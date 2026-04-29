import React, { useState, useEffect } from 'react';

// === 1. Supabase 연결 설정 ===
// 🚨 주의: 반드시 'eyJ...' 로 시작하는 Legacy anon 키를 넣으셔야 통신이 됩니다!
const supabaseUrl = 'https://gditohvmfxofuqbsbfhab.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaXRvaHZtZnhvZnVxc2JmaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjE4NDcsImV4cCI6MjA5MjkzNzg0N30.SMp5W8Uxmwug_6fsny51mczi9ZYm9K-ubB3takBNwTc'; 

const supabaseHeaders = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// 로컬 저장소 유틸리티 (내 글 표시용)
const getMyItems = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const addMyItem = (key, id) => {
  const items = getMyItems(key);
  if (!items.includes(id)) localStorage.setItem(key, JSON.stringify([...items, id]));
};

// Supabase API 통신 객체 (오프라인 우회 로직 포함)
const supabaseApi = {
  _useLocal: false,

  async getPosts() {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/posts?select=*&order=created_at.desc`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      this._useLocal = false;
      return await res.json();
    } catch (e) { 
      this._useLocal = true; 
      return JSON.parse(localStorage.getItem('iamsolo_posts') || '[]'); 
    }
  },
  async insertPost(post) {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/posts`, { method: 'POST', headers: supabaseHeaders, body: JSON.stringify(post) });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return { data: await res.json(), success: true };
    } catch (e) { 
      this._useLocal = true;
      const posts = JSON.parse(localStorage.getItem('iamsolo_posts') || '[]');
      const newPost = { ...post, id: Date.now(), created_at: new Date().toISOString(), likes: 0 };
      localStorage.setItem('iamsolo_posts', JSON.stringify([newPost, ...posts]));
      return { data: [newPost], success: false };
    }
  },
  async updatePost(id, post) {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${id}`, { method: 'PATCH', headers: supabaseHeaders, body: JSON.stringify(post) });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return true;
    } catch (e) { 
      this._useLocal = true;
      const posts = JSON.parse(localStorage.getItem('iamsolo_posts') || '[]');
      const updated = posts.map(p => p.id === id ? { ...p, ...post } : p);
      localStorage.setItem('iamsolo_posts', JSON.stringify(updated));
      return false;
    }
  },
  async deletePost(id) {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${id}`, { method: 'DELETE', headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return true;
    } catch (e) { 
      this._useLocal = true;
      const posts = JSON.parse(localStorage.getItem('iamsolo_posts') || '[]');
      localStorage.setItem('iamsolo_posts', JSON.stringify(posts.filter(p => p.id !== id)));
      return false;
    }
  },

  async getComments(postId) {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/comments?post_id=eq.${postId}&select=*&order=created_at.desc`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return await res.json();
    } catch (e) { 
      this._useLocal = true;
      return JSON.parse(localStorage.getItem('iamsolo_comments') || '[]').filter(c => c.post_id === postId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },
  async insertComment(comment) {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/comments`, { method: 'POST', headers: supabaseHeaders, body: JSON.stringify(comment) });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return { data: await res.json(), success: true };
    } catch (e) { 
      this._useLocal = true;
      const comments = JSON.parse(localStorage.getItem('iamsolo_comments') || '[]');
      const newComment = { ...comment, id: Date.now(), created_at: new Date().toISOString() };
      localStorage.setItem('iamsolo_comments', JSON.stringify([newComment, ...comments]));
      return { data: [newComment], success: false };
    }
  },
  async deleteComment(id) {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/comments?id=eq.${id}`, { method: 'DELETE', headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
    } catch (e) { 
      this._useLocal = true;
      const comments = JSON.parse(localStorage.getItem('iamsolo_comments') || '[]');
      localStorage.setItem('iamsolo_comments', JSON.stringify(comments.filter(c => c.id !== id)));
    }
  },
  async getAllComments() {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/comments?select=id,post_id`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return await res.json();
    } catch (e) { 
      this._useLocal = true;
      return JSON.parse(localStorage.getItem('iamsolo_comments') || '[]'); 
    }
  },

  async getAvailableSeasons() {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/participants?select=season`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      const seasons = Array.from(new Set(data.map(d => d.season)));
      return seasons.length > 0 ? seasons.sort((a,b)=>a-b) : [31];
    } catch (e) { 
      this._useLocal = true;
      const localData = JSON.parse(localStorage.getItem('iamsolo_participants') || '[]');
      const seasons = Array.from(new Set(localData.map(d => d.season)));
      return seasons.length > 0 ? seasons.sort((a,b)=>a-b) : [31];
    }
  },
  async getParticipants(season) {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/participants?season=eq.${season}&select=*`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      this._useLocal = false;
      const data = await res.json();
      return data.map(d => ({
        id: d.id, 
        season: d.season, 
        name: d.name, 
        gender: d.gender === '남' ? 'M' : 'F',
        age: d.age || '', 
        birth_year: d.birth_year || '', 
        job: d.job || '',
        company: d.company || '', 
        position: d.position || '', 
        education: d.education || '',
        location: d.location || '', 
        hobbies: d.hobbies || '', 
        others: d.others || '',
        quote: d.description || '', 
        img: d.image_url || ''
      }));
    } catch (e) { 
      this._useLocal = true; 
      return JSON.parse(localStorage.getItem('iamsolo_participants') || '[]').filter(p => p.season === season);
    }
  },
  async saveParticipant(cast, season) {
    const payload = {
      season: season,
      name: cast.name,
      gender: cast.gender === 'M' ? '남' : '여',
      age: cast.age || '', // text 타입 대응 완료
      birth_year: cast.birth_year || '',
      job: cast.job || '',
      company: cast.company || '',
      position: cast.position || '',
      education: cast.education || '',
      location: cast.location || '',
      hobbies: cast.hobbies || '',
      others: cast.others || '',
      description: cast.quote || '',
      image_url: cast.img || ''
    };
    try {
      if (this._useLocal) throw new Error('Local');
      if (typeof cast.id === 'number') {
        const res = await fetch(`${supabaseUrl}/rest/v1/participants?id=eq.${cast.id}`, { method: 'PATCH', headers: supabaseHeaders, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
      } else {
        const res = await fetch(`${supabaseUrl}/rest/v1/participants`, { method: 'POST', headers: supabaseHeaders, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
      }
      return true;
    } catch (e) { 
      this._useLocal = true;
      let local = JSON.parse(localStorage.getItem('iamsolo_participants') || '[]');
      if (typeof cast.id === 'number') {
        local = local.map(p => p.id === cast.id ? {...p, ...payload, gender: cast.gender, quote: cast.quote, img: cast.img} : p);
      } else {
        local.push({...payload, id: Date.now(), gender: cast.gender, quote: cast.quote, img: cast.img});
      }
      localStorage.setItem('iamsolo_participants', JSON.stringify(local));
      return false;
    }
  },
  async deleteParticipant(id) {
    try {
      if (this._useLocal) throw new Error('Local');
      if (typeof id === 'number') {
        const res = await fetch(`${supabaseUrl}/rest/v1/participants?id=eq.${id}`, { method: 'DELETE', headers: supabaseHeaders });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
      }
      return true;
    } catch (e) { 
      this._useLocal = true;
      const local = JSON.parse(localStorage.getItem('iamsolo_participants') || '[]');
      localStorage.setItem('iamsolo_participants', JSON.stringify(local.filter(p => p.id !== id)));
      return false;
    }
  },

  async getVotes() {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/votes?select=*`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return await res.json();
    } catch (e) { 
      this._useLocal = true;
      return JSON.parse(localStorage.getItem('iamsolo_votes') || '[]'); 
    }
  },
  async saveVote(couple_name) {
    try {
      if (this._useLocal) throw new Error('Local');
      const res = await fetch(`${supabaseUrl}/rest/v1/votes?couple_name=eq.${couple_name}`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const res2 = await fetch(`${supabaseUrl}/rest/v1/votes?id=eq.${data[0].id}`, { method: 'PATCH', headers: supabaseHeaders, body: JSON.stringify({ vote_count: data[0].vote_count + 1 }) });
        if (!res2.ok) throw new Error(`API Error: ${res2.status}`);
      } else {
        const res3 = await fetch(`${supabaseUrl}/rest/v1/votes`, { method: 'POST', headers: supabaseHeaders, body: JSON.stringify({ couple_name, vote_count: 1 }) });
        if (!res3.ok) throw new Error(`API Error: ${res3.status}`);
      }
      return true;
    } catch (e) { 
      this._useLocal = true;
      let votes = JSON.parse(localStorage.getItem('iamsolo_votes') || '[]');
      const existing = votes.find(v => v.couple_name === couple_name);
      if (existing) existing.vote_count += 1;
      else votes.push({ id: Date.now(), couple_name, vote_count: 1 });
      localStorage.setItem('iamsolo_votes', JSON.stringify(votes));
      return false;
    }
  }
};

// --- 아이콘 컴포넌트 ---
const IconHeart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconCloud = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19a5.5 5.5 0 0 0 2.5-10.5 8.5 8.5 0 1 0-14.5 4.5 5.5 5.5 0 0 0 2 6"></path></svg>;

// 기본 고정 명단 14명
const STANDARD_CAST = [
  { name: '영수', gender: 'M' }, { name: '영호', gender: 'M' }, { name: '영식', gender: 'M' }, { name: '영철', gender: 'M' }, { name: '광수', gender: 'M' }, { name: '상철', gender: 'M' }, { name: '경수', gender: 'M' },
  { name: '영숙', gender: 'F' }, { name: '정숙', gender: 'F' }, { name: '순자', gender: 'F' }, { name: '영자', gender: 'F' }, { name: '옥순', gender: 'F' }, { name: '현숙', gender: 'F' }, { name: '정희', gender: 'F' }
];

// 댓글 섹션 컴포넌트
function CommentSection({ postId, isAdmin, showConfirm }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => { 
    if (postId) fetch(); 
  }, [postId]);

  const fetch = async () => {
    const data = await supabaseApi.getComments(postId);
    setComments(data || []);
  };

  const add = async (e) => {
    e.preventDefault(); 
    if (!newComment.trim()) return;
    const res = await supabaseApi.insertComment({ post_id: postId, text: newComment, author: '익명' });
    if (res.success && res.data?.[0]) addMyItem('my_comments', res.data[0].id);
    setNewComment(''); 
    fetch();
  };

  const del = (id) => {
    showConfirm('댓글을 삭제하시겠습니까?', async () => { 
      await supabaseApi.deleteComment(id); 
      fetch(); 
    });
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <h3 className="text-lg font-black mb-4">댓글 {comments.length}</h3>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <input type="text" value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="따뜻한 댓글을 남겨주세요." className="flex-1 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-200 font-bold" />
        <button className="bg-gray-900 text-white px-6 rounded-2xl font-black transition-transform active:scale-95">등록</button>
      </form>
      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-start group animate-fade-in">
            <p className="text-gray-700 font-medium leading-relaxed pr-4">{c.text}</p>
            {(getMyItems('my_comments').includes(c.id) || isAdmin) && (
              <button onClick={()=>del(c.id)} className="text-xs text-gray-300 hover:text-red-500 font-black shrink-0">삭제</button>
            )}
          </div>
        ))}
        {comments.length === 0 && <p className="text-center text-gray-400 font-bold py-6 text-sm">첫 번째 댓글을 남겨주세요!</p>}
      </div>
    </div>
  );
}

// === 메인 앱 컴포넌트 ===
export default function App() {
  const [season, setSeason] = useState(31);
  const [activeTab, setActiveTab] = useState('coupleVote');
  const [availableSeasons, setAvailableSeasons] = useState([31]);
  const [castData, setCastData] = useState([]);
  const [coupleVotes, setCoupleVotes] = useState({});
  const [villainVotes, setVillainVotes] = useState({});
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [castEditModal, setCastEditModal] = useState({ isOpen: false, data: null });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [writeModal, setWriteModal] = useState({ isOpen: false, isEdit: false, postId: null, author: '', title: '', content: '' });
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  
  const [isCloud, setIsCloud] = useState(true);
  const [hasVotedCouple, setHasVotedCouple] = useState(false);
  const [hasVotedVillainM, setHasVotedVillainM] = useState(false);
  const [hasVotedVillainF, setHasVotedVillainF] = useState(false);
  const [firstCouplePick, setFirstCouplePick] = useState(null);

  useEffect(() => {
    async function init() {
      const s = await supabaseApi.getAvailableSeasons();
      setAvailableSeasons(Array.from(new Set([...s, 31])).sort((a,b)=>a-b));
    }
    init();
  }, []);

  useEffect(() => {
    fetchCast(); 
    fetchVotes();
    if (activeTab === 'board') fetchPosts();
    setSearchTerm('');
  }, [activeTab, season]);

  // 🚀 SEO 최적화 메타 태그 (카카오톡, 구글 검색 유입 극대화)
  useEffect(() => {
    let tabName = '';
    switch (activeTab) {
      case 'coupleVote': tabName = '최애 커플 투표'; break;
      case 'villainVote': tabName = '최고 빌런 투표'; break;
      case 'profile': tabName = '출연진 프로필'; break;
      case 'board': tabName = '자유 게시판'; break;
      default: tabName = '홈';
    }
    
    // 브라우저 탭 타이틀 동적 변경
    const pageTitle = `${season}기 ${tabName} - 나는솔로팬이다`;
    document.title = pageTitle;

    const setMetaTag = (attrName, name, content) => {
      let meta = document.querySelector(`meta[${attrName}="${name}"]`);
      if (!meta) { 
        meta = document.createElement('meta'); 
        meta.setAttribute(attrName, name); 
        document.head.appendChild(meta); 
      }
      meta.setAttribute('content', content);
    };

    // 검색 키워드에 현재 기수 출연진 이름 자동 삽입
    const names = castData.map(c => c.name);
    const keywords = `나는솔로, 나는 솔로, 나는SOLO, ${season}기, ${season}기 직업, ${season}기 인스타, ${names.join(', ')}, ${names.map(n => `나는 솔로 ${season}기 ${n}`).join(', ')}`;
    const description = `나는 솔로(나는 SOLO) ${season}기 출연진 프로필, 직업, 인스타 및 시청자들의 실시간 인기 투표와 솔직한 리뷰를 볼 수 있는 팬 커뮤니티입니다.`;

    // 기본 SEO 태그
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'description', description);

    // 오픈 그래프 (카카오톡/인스타그램 공유 시 노출되는 정보)
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', '나는솔로팬이다');
  }, [season, activeTab, castData]);

  async function fetchCast() {
    const db = await supabaseApi.getParticipants(season) || [];
    setIsCloud(!supabaseApi._useLocal);
    
    let merged = [...db];
    let tid = 1;
    
    STANDARD_CAST.forEach(std => {
      if (!db.find(d => d.name === std.name)) {
        merged.push({ id: `temp_${tid++}`, season, name: std.name, gender: std.gender });
      }
    });
    
    setCastData(merged.sort((a,b) => STANDARD_CAST.findIndex(s=>s.name===a.name) - STANDARD_CAST.findIndex(s=>s.name===b.name)));
  }

  async function fetchVotes() {
    const data = await supabaseApi.getVotes() || [];
    const cMap = {}, vMap = {};
    data.forEach(v => {
      if (v.couple_name.startsWith('villain_')) {
        vMap[v.couple_name.replace('villain_', '')] = v.vote_count;
      } else {
        cMap[v.couple_name] = v.vote_count;
      }
    });
    setCoupleVotes(cMap); 
    setVillainVotes(vMap);
  }

  async function fetchPosts() {
    const [p, c] = await Promise.all([supabaseApi.getPosts(), supabaseApi.getAllComments()]);
    const counts = {}; 
    (c || []).forEach(x => counts[x.post_id] = (counts[x.post_id] || 0) + 1);
    setPosts((p || []).map(x => ({ ...x, commentCount: counts[x.id] || 0 })));
  }

  const showAlert = (m) => setModal({ isOpen: true, type: 'alert', message: m });
  const showConfirm = (m, c) => setModal({ isOpen: true, type: 'confirm', message: m, onConfirm: c });

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement('canvas'); 
        const max = 350; 
        const s = max / img.width;
        cvs.width = max; 
        cvs.height = img.height * s;
        cvs.getContext('2d').drawImage(img, 0, 0, cvs.width, cvs.height);
        setCastEditModal(p => ({...p, data: {...p.data, img: cvs.toDataURL('image/jpeg', 0.6)}}));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'hoonie2') { setIsAdmin(true); setShowAdminLogin(false); setAdminPassword(''); showAlert('운영자 인증 성공'); }
    else showAlert('비밀번호가 틀렸습니다.');
  };

  const handleCoupleVote = async (p2) => {
    if (hasVotedCouple) return showAlert('이미 투표하셨습니다.');
    const key = [firstCouplePick.name, p2.name].sort().join('_');
    setCoupleVotes(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    setHasVotedCouple(true); 
    setFirstCouplePick(null);
    const success = await supabaseApi.saveVote(key);
    if (!success) showAlert('⚠️ 통신 불안정: 투표가 브라우저에 임시 저장되었습니다.');
    else showAlert('커플 투표가 성공적으로 기록되었습니다!');
  };

  const handleVillainVote = (c) => {
    if (c.gender === 'M' && hasVotedVillainM) return showAlert('남성 부문은 이미 투표하셨습니다.');
    if (c.gender === 'F' && hasVotedVillainF) return showAlert('여성 부문은 이미 투표하셨습니다.');
    showConfirm(`${c.name}님께 투표하시겠습니까?`, async () => {
      setVillainVotes(p => ({ ...p, [c.id]: (p[c.id] || 0) + 1 }));
      if (c.gender === 'M') setHasVotedVillainM(true); 
      else setHasVotedVillainF(true);
      const success = await supabaseApi.saveVote(`villain_${c.id}`); 
      if (!success) showAlert('⚠️ 통신 불안정: 투표가 브라우저에 임시 저장되었습니다.');
      else showAlert('투표 완료!');
    });
  };

  const handlePostSave = async () => {
    if (!writeModal.title || !writeModal.content) return alert('제목과 내용을 입력하세요.');
    let success = false;
    if (writeModal.isEdit) {
      success = await supabaseApi.updatePost(writeModal.postId, writeModal);
    } else {
      const res = await supabaseApi.insertPost({ ...writeModal, likes: 0, author: writeModal.author || '익명' });
      if (res.success && res.data?.[0]) addMyItem('my_posts', res.data[0].id);
      success = res.success;
    }
    setWriteModal({ isOpen: false }); 
    fetchPosts();
    if (!success) showAlert('⚠️ 통신 에러: 게시글이 로컬에 임시 저장되었습니다.');
  };

  const handleDeletePost = (id) => {
    showConfirm('정말 이 게시글을 영구 삭제하시겠습니까?', async () => {
      const success = await supabaseApi.deletePost(id);
      setSelectedPost(null);
      fetchPosts();
      if (!success) showAlert('⚠️ 오류 발생: 서버에서 완전히 삭제되지 않았습니다.');
      else showAlert('게시글이 삭제되었습니다.');
    });
  };

  const getSortedCoupleResults = () => {
    const total = Object.values(coupleVotes).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(coupleVotes).map(([k, v]) => {
      const [n1, n2] = k.split('_');
      const c1 = castData.find(c => c.name === n1);
      const c2 = castData.find(c => c.name === n2);
      return { k, name: k.replace('_', ' & '), img1: c1?.img, img2: c2?.img, votes: v, percentage: ((v/total)*100).toFixed(1) };
    }).sort((a, b) => b.votes - a.votes).slice(0, 5);
  };

  const getSortedVillainResults = () => {
    const total = Object.values(villainVotes).reduce((a,b)=>a+b, 0) || 1;
    return Object.entries(villainVotes).map(([id, v]) => {
      const c = castData.find(x => String(x.id) === String(id));
      return { id, name: c?.name, img: c?.img, votes: v, percentage: ((v/total)*100).toFixed(1) };
    }).filter(x=>x.name).sort((a,b)=>b.votes - a.votes).slice(0, 3);
  };

  const filteredCast = castData.filter(c => !searchTerm || [c.name, c.job, c.location, c.company, c.birth_year].some(v => String(v)?.includes(searchTerm)));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shrink-0 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-pink-500 tracking-tighter flex items-center gap-2"><IconHeart/> 나는솔로팬이다</h1>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5">제작진과 아무 상관 없는 팬 커뮤니티</p>
          </div>
          <div className="bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100 flex items-center gap-2">
            <span className="text-[11px] font-black text-pink-600">기수:</span>
            <select value={season} onChange={e => e.target.value === 'new' ? (()=>{ const n = prompt('기수 숫자 입력'); if(n) {setAvailableSeasons(p=>[...p, Number(n)].sort((a,b)=>a-b)); setSeason(Number(n));} })() : setSeason(Number(e.target.value))} className="bg-transparent text-pink-600 text-xs font-black outline-none border-none cursor-pointer">
              {availableSeasons.map(s => <option key={s} value={s}>{s}기</option>)}
              {isAdmin && <option value="new">+ 추가</option>}
            </select>
          </div>
        </div>
        <nav className="max-w-4xl mx-auto px-4 flex gap-4 overflow-x-auto border-t border-gray-50 scrollbar-hide">
          {[{id:'coupleVote',l:'💞 커플 투표'},{id:'villainVote',l:'👿 빌런 투표'},{id:'profile',l:'📸 출연진'},{id:'board',l:'💬 게시판'},...(isAdmin?[{id:'admin',l:'⚙️ 운영자'}]:[])].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`py-4 px-2 text-xs font-black border-b-4 transition-all whitespace-nowrap ${activeTab===t.id?'border-pink-500 text-pink-500':'border-transparent text-gray-400'}`}>{t.l}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        
        {/* === 커플 투표 탭 === */}
        {activeTab === 'coupleVote' && (
          <div className="animate-fade-in space-y-10">
            <div className="bg-white p-6 sm:p-10 rounded-[40px] shadow-sm border border-pink-100">
              <h2 className="text-xl font-black mb-8 text-gray-800 tracking-tight text-center">{season}기 응원 커플 투표</h2>
              {!firstCouplePick ? (
                <div className="space-y-10">
                  {['M', 'F'].map(g => (
                    <div key={g}>
                      <h3 className={`text-xs font-black mb-4 border-b-2 pb-2 ${g==='M'?'text-blue-500 border-blue-50':'text-pink-500 border-pink-50'}`}>{g==='M'?'SOLO 남성':'SOLO 여성'}</h3>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {castData.filter(c=>c.gender===g).map(c=>(
                          <div key={c.id} onClick={()=>setFirstCouplePick(c)} className="cursor-pointer group relative rounded-[20px] overflow-hidden aspect-square bg-gray-100 border active:scale-95 transition-transform">
                            {c.img ? <img src={c.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><IconUser/></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-2">
                              {/* 직업 제거, 이름만 표시 */}
                              <span className="text-white font-black text-[11px] sm:text-xs">{c.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-full sm:w-1/3 flex flex-col items-center p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 mb-4 uppercase">선택한 멤버</p>
                    <div className="w-24 sm:w-32 aspect-square rounded-[20px] overflow-hidden border bg-white relative shadow-md">
                      {firstCouplePick.img ? <img src={firstCouplePick.img} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><IconUser/></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-2">
                        <span className="text-white font-black text-[11px] sm:text-xs">{firstCouplePick.name}</span>
                      </div>
                    </div>
                    <button onClick={()=>setFirstCouplePick(null)} className="mt-6 text-[10px] font-black text-gray-500 bg-white border border-gray-200 px-4 py-2 rounded-full flex items-center gap-1 shadow-sm"><IconX/> 다시 고르기</button>
                  </div>
                  <div className="flex-1 w-full">
                    <p className="text-pink-500 font-black mb-6 text-sm underline decoration-pink-200 underline-offset-4 text-center sm:text-left">상대방을 선택하세요!</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {castData.filter(c=>c.gender!==firstCouplePick.gender).map(c=>(
                        <div key={c.id} onClick={()=>handleCoupleVote(c)} className="cursor-pointer group relative rounded-[20px] overflow-hidden aspect-square bg-gray-100 border active:scale-95 transition-transform">
                          {c.img ? <img src={c.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><IconUser/></div>}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-2">
                            <span className="text-white font-black text-[11px] sm:text-xs">{c.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-sm border border-gray-100 mt-10">
              <h3 className="text-lg font-black mb-8 flex items-center justify-center sm:justify-start gap-2">🏆 실시간 커플 랭킹</h3>
              <div className="space-y-6">
                {getSortedCoupleResults().length > 0 ? getSortedCoupleResults().map((r, i) => (
                  <div key={i} className="flex items-center gap-4 sm:gap-6">
                    <span className="text-2xl sm:text-3xl font-black text-gray-200 w-6 text-center">{i+1}</span>
                    <div className="flex -space-x-4">
                      <img src={r.img1 || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm bg-white z-10"/>
                      <img src={r.img2 || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm bg-white"/>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-black mb-2"><span>{r.name}</span><span className="text-pink-500">{r.votes}표 ({r.percentage}%)</span></div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden"><div className="bg-pink-400 h-full transition-all duration-1000" style={{width:`${r.percentage}%`}}/></div>
                    </div>
                  </div>
                )) : <div className="py-10 text-center font-bold text-gray-300 text-sm">아직 투표 데이터가 없습니다.</div>}
              </div>
            </div>
          </div>
        )}

        {/* === 출연진 프로필 탭 === */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-4 rounded-3xl shadow-sm border flex items-center gap-3">
              <IconSearch />
              <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="이름, 직업, 출생연도 등으로 검색..." className="flex-1 border-none outline-none font-bold text-sm" />
            </div>
            {['M', 'F'].map(g => (
              <div key={g}>
                <h2 className={`text-lg font-black mb-6 border-l-4 pl-3 ${g==='M'?'text-blue-500 border-blue-500':'text-pink-500 border-pink-500'}`}>{g==='M'?'남성 출연진':'여성 출연진'}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {filteredCast.filter(c=>c.gender===g).map(c => (
                    <div key={c.id} onClick={()=> {setSelectedProfile(c);}} className="bg-white p-2 rounded-[28px] shadow-sm border border-gray-100 cursor-pointer transition-transform active:scale-95 animate-fade-in">
                      <div className="aspect-[4/5] rounded-[22px] overflow-hidden bg-gray-100 relative">
                         {c.img ? <img src={c.img} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><IconUser/></div>}
                      </div>
                      <div className="p-2 text-center">
                        <p className="font-black text-gray-800 text-sm">{c.name} {c.age && <span className="text-[9px] text-gray-400">({c.age})</span>}</p>
                        {/* 프로필 탭에서는 직업 노출 */}
                        <p className="text-[9px] text-pink-500 font-bold mt-0.5 truncate">{c.job || '정보 없음'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === 빌런 투표 탭 === */}
        {activeTab === 'villainVote' && (
          <div className="space-y-12 animate-fade-in text-center">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border">
              <h2 className="text-xl font-black mb-1 text-red-500 uppercase tracking-widest">Villain Voting</h2>
              <p className="text-gray-400 text-[11px] font-bold mb-8">기수별 최고의 빌런에게 투표하세요!</p>
              {['M', 'F'].map(g => (
                <div key={g} className="mb-10 last:mb-0">
                  <h3 className={`text-[10px] font-black mb-4 border-b pb-1 ${g==='M'?'text-blue-400':'text-pink-400'}`}>{g==='M'?'SOLO 남성 부문':'SOLO 여성 부문'}</h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {castData.filter(c=>c.gender===g).map(c => (
                      <div key={c.id} onClick={()=>handleVillainVote(c)} className="w-16 text-center cursor-pointer group active:scale-90 transition-transform">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-red-500 relative">
                          {c.img ? <img src={c.img} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-200"><IconUser/></div>}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* 직업 제거, 이름만 표시 */}
                            <span className="text-white font-black text-[10px]">{c.name}</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-black mt-1.5">{c.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-sm border">
              <h3 className="text-lg font-black mb-12 text-red-600">🏆 실시간 빌런 시상대</h3>
              <div className="flex justify-center items-end gap-2 h-40">
                {getSortedVillainResults().map((r, i) => {
                  const colors = i===0 ? 'bg-red-500 h-32' : i===1 ? 'bg-gray-400 h-24' : 'bg-amber-600 h-16';
                  const order = i===0 ? 'order-2' : i===1 ? 'order-1' : 'order-3';
                  return (
                    <div key={r.id} className={`flex-1 max-w-[90px] flex flex-col items-center ${order} animate-fade-in`}>
                      <img src={r.img || 'https://via.placeholder.com/50'} className="w-10 h-10 rounded-full border-2 border-white shadow-md mb-2 object-cover bg-white"/>
                      <div className={`${colors} w-full rounded-t-xl flex flex-col justify-center text-white p-1 shadow-inner`}>
                        <p className="text-[9px] font-black truncate">{r.name}</p>
                        <p className="text-[8px] font-black">{r.votes}표</p>
                      </div>
                    </div>
                  );
                })}
                {getSortedVillainResults().length === 0 && <p className="w-full text-gray-300 font-bold text-sm">첫 투표를 기다리고 있습니다!</p>}
              </div>
            </div>
          </div>
        )}

        {/* === 자유 게시판 탭 === */}
        {activeTab === 'board' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-5 rounded-[32px] border shadow-sm">
              <h2 className="text-xl font-black tracking-tight">자유 게시판</h2>
              <button onClick={()=>setWriteModal({isOpen:true, isEdit:false, author:'', title:'', content:''})} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-black text-xs active:scale-95 transition-transform">글쓰기</button>
            </div>
            <div className="bg-white rounded-[32px] border shadow-sm divide-y overflow-hidden">
              {posts.map(p => (
                <div key={p.id} onClick={()=> setSelectedPost(p)} className="p-5 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors">
                  <div className="flex-1 pr-4">
                    <h3 className="font-black text-base line-clamp-1 flex items-center flex-wrap gap-2">
                      {p.title} 
                      {p.commentCount > 0 && <span className="text-pink-500 text-xs">[{p.commentCount}]</span>}
                      {/* 내가 쓴 글 뱃지 */}
                      {getMyItems('my_posts').includes(p.id) && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded ml-1 font-black whitespace-nowrap">내가 쓴 글</span>}
                    </h3>
                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{p.author} | {p.created_at ? new Date(p.created_at).toLocaleDateString() : '방금'}</p>
                  </div>
                  <span className="text-pink-500 font-black text-[10px] bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100 whitespace-nowrap">♥ {p.likes || 0}</span>
                </div>
              ))}
              {posts.length === 0 && <div className="p-20 text-center text-gray-200 font-black">아직 등록된 글이 없습니다.</div>}
            </div>
          </div>
        )}

        {/* === 운영자 설정 탭 === */}
        {activeTab === 'admin' && isAdmin && (
          <div className="bg-white p-6 rounded-[40px] shadow-2xl border-4 border-gray-900 animate-fade-in">
             <div className="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-8">
                <h2 className="text-xl font-black uppercase tracking-tighter">Admin Dashboard</h2>
                <button onClick={()=>setCastEditModal({isOpen:true, data:{name:'', gender:'M'}})} className="bg-pink-500 text-white px-5 py-2 rounded-xl font-black text-xs">+ 수동 추가</button>
             </div>
             <div className="divide-y max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                {castData.map(c => (
                  <div key={c.id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <img src={c.img || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-full border object-cover bg-white shadow-sm"/>
                      <p className="font-black text-sm">{c.name} {typeof c.id==='string'&&<span className="text-[8px] text-gray-400 ml-1">(미작성 빈 슬롯)</span>}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>setCastEditModal({isOpen:true, data:{...c}})} className="text-[10px] font-black bg-gray-100 px-3 py-1.5 rounded-lg">편집</button>
                      <button onClick={()=>handleDeleteCast(c.id, c.name)} className="text-[10px] font-black bg-red-50 text-red-500 px-3 py-1.5 rounded-lg">삭제</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-center border-t flex flex-col items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black ${isCloud ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          <IconCloud /> {isCloud ? '운영 서버 연결됨 (Cloud)' : '오프라인 캐시 모드 (Offline)'}
        </div>
        {!isAdmin ? <button onClick={()=>setShowAdminLogin(true)} className="text-[9px] text-gray-200 font-black hover:text-pink-300 transition-colors">ADMIN_LOGIN</button> : <p className="text-[9px] text-pink-400 font-black tracking-widest">MASTER_MODE_ACTIVE</p>}
      </footer>

      {/* 모달: 프로필 상세보기 (중앙 팝업 / 가로 배치) */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setSelectedProfile(null)} />
          <div className="relative w-full max-w-md bg-white rounded-[40px] p-6 sm:p-10 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
            <button onClick={()=>setSelectedProfile(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full z-10"><IconX/></button>
            <div className="flex flex-row items-center gap-5 sm:gap-8 mt-4 bg-gray-50 p-5 rounded-[32px] border border-gray-100 shrink-0">
              <div className="w-24 sm:w-32 aspect-[4/5] rounded-2xl overflow-hidden border-4 border-white bg-white shrink-0 shadow-md relative">
                 <div className="absolute top-2 left-2 bg-black text-white text-[8px] px-2 py-1 rounded-full font-black z-10">{season}기</div>
                 {selectedProfile.img ? <img src={selectedProfile.img} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-200"><IconUser/></div>}
              </div>
              <div className="flex-1">
                 <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{selectedProfile.name}</h2>
                 {selectedProfile.age && <p className="text-gray-400 font-bold text-xs mt-2">{selectedProfile.age}</p>}
                 <p className="text-pink-500 font-black text-lg mt-2">{selectedProfile.job || '정보 없음'}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
               {[
                 {l:'출생연도',v:selectedProfile.birth_year},
                 {l:'거주지',v:selectedProfile.location},
                 {l:'소속',v:selectedProfile.company},
                 {l:'학력',v:selectedProfile.education}
               ].map(x=>(
                 <div key={x.l} className="bg-gray-50 p-4 rounded-2xl border border-gray-50 shadow-inner">
                    <span className="text-[8px] text-gray-400 font-black block mb-0.5 uppercase tracking-widest">{x.l}</span>
                    <p className="text-xs font-black truncate">{x.v || '-'}</p>
                 </div>
               ))}
               <div className="col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-50 shadow-inner"><span className="text-[8px] text-gray-400 font-black block mb-0.5 uppercase tracking-widest">취미 및 특기</span><p className="text-xs font-black whitespace-pre-wrap">{selectedProfile.hobbies || '-'}</p></div>
               <div className="col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-50 shadow-inner"><span className="text-[8px] text-gray-400 font-black block mb-0.5 uppercase tracking-widest">기타 정보</span><p className="text-xs font-black whitespace-pre-wrap">{selectedProfile.others || '-'}</p></div>
            </div>
            {selectedProfile.quote && (
              <div className="mt-6 p-6 bg-gradient-to-br from-pink-50 to-white rounded-[32px] text-center border border-pink-100 relative shadow-inner">
                <p className="text-gray-700 font-bold text-base italic leading-relaxed break-keep">"{selectedProfile.quote}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 모달: 게시글 상세보기 (중앙) */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setSelectedPost(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] p-6 sm:p-10 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Community Post</span>
               <div className="flex gap-4">
                 {/* 본인 글일 경우 수정/삭제 버튼 노출 */}
                 {(getMyItems('my_posts').includes(selectedPost.id) || isAdmin) && (
                   <div className="flex items-center gap-3">
                     <button onClick={()=>setWriteModal({isOpen:true, isEdit:true, postId:selectedPost.id, ...selectedPost})} className="text-[10px] font-black text-gray-400 hover:text-pink-500">수정</button>
                     <button onClick={()=>handleDeletePost(selectedPost.id)} className="text-[10px] font-black text-gray-400 hover:text-red-500">삭제</button>
                   </div>
                 )}
                 <button onClick={()=>setSelectedPost(null)} className="p-1.5 bg-gray-100 rounded-full"><IconX/></button>
               </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-3 break-all">{selectedPost.title}</h2>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 border"><IconUser/></div>
               <div className="flex flex-col"><p className="text-xs font-black">{selectedPost.author}</p><p className="text-[9px] text-gray-400 font-bold">{selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString() : ''}</p></div>
            </div>
            <div className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap min-h-[120px] mb-10 break-all">{selectedPost.content}</div>
            <div className="flex justify-center mb-8">
               <button onClick={async()=>{
                  if(getMyItems('post_likes').includes(selectedPost.id)) return showAlert('이미 응원했습니다!');
                  const l = (selectedPost.likes||0)+1; await supabaseApi.updatePost(selectedPost.id, {likes:l});
                  addMyItem('post_likes', selectedPost.id); setSelectedPost({...selectedPost, likes:l}); fetchPosts();
               }} className="bg-pink-500 text-white px-8 py-3 rounded-full font-black text-sm flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-pink-100">♥ 응원해요 {selectedPost.likes || 0}</button>
            </div>
            <CommentSection postId={selectedPost.id} isAdmin={isAdmin} showConfirm={showConfirm} />
          </div>
        </div>
      )}

      {/* 기타 입력 모달 (게시글 작성) */}
      {writeModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={()=>setWriteModal({isOpen:false})} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[85vh]">
            <h3 className="text-xl font-black text-center mb-6 uppercase tracking-tighter">{writeModal.isEdit ? '글 수정' : '새 게시글 쓰기'}</h3>
            <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide flex-1">
              <input type="text" placeholder="제목을 입력하세요." value={writeModal.title} onChange={e=>setWriteModal({...writeModal, title:e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none font-black text-base focus:ring-2 focus:ring-pink-200" />
              <input type="text" placeholder="닉네임 (미입력 시 익명)" value={writeModal.author} onChange={e=>setWriteModal({...writeModal, author:e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none font-black text-sm" />
              <textarea placeholder="내용을 자유롭게 입력하세요." value={writeModal.content} onChange={e=>setWriteModal({...writeModal, content:e.target.value})} className="w-full bg-gray-50 p-5 rounded-xl border-none outline-none h-48 text-sm font-medium focus:ring-2 focus:ring-pink-200" />
            </div>
            <div className="flex gap-3 mt-6"><button onClick={()=>setWriteModal({isOpen:false})} className="flex-1 py-4 bg-gray-100 rounded-xl font-black text-gray-400 text-sm">취소</button><button onClick={handlePostSave} className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-black shadow-xl text-sm">등록</button></div>
          </div>
        </div>
      )}

      {/* 운영자 로그인 모달 */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setShowAdminLogin(false)} />
          <div className="relative bg-white p-10 rounded-[50px] w-full max-w-xs text-center border-4 border-gray-900 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 text-gray-900 uppercase tracking-widest">Master</h3>
            <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} className="w-full bg-gray-50 p-5 rounded-3xl text-center mb-8 border-2 border-gray-100 font-black text-xl outline-none focus:border-pink-500 transition-all" placeholder="PASSWORD" onKeyDown={e=>e.key==='Enter'&&handleAdminLogin()}/>
            <button onClick={handleAdminLogin} className="w-full py-4 bg-gray-900 text-white font-black rounded-3xl shadow-xl active:scale-95 text-sm">LOGIN</button>
          </div>
        </div>
      )}

      {/* 데이터 편집 모달 */}
      {castEditModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={()=>setCastEditModal({isOpen:false})} />
          <div className="relative bg-white w-full max-w-3xl rounded-[40px] p-8 shadow-2xl border-4 border-gray-900 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
            <h3 className="text-lg font-black mb-6 uppercase text-center">{season}기 출연진 마스터 편집</h3>
            <div className="space-y-5 flex-1 pb-4">
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-gray-50 p-5 rounded-3xl border">
                 <div className="w-16 h-16 bg-white rounded-full overflow-hidden border shadow-sm flex items-center justify-center shrink-0">
                    {castEditModal.data?.img ? <img src={castEditModal.data.img} className="w-full h-full object-cover"/> : <IconUser/>}
                 </div>
                 <div className="flex-1 w-full space-y-2">
                    <input type="text" value={castEditModal.data?.img || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, img:e.target.value}})} className="w-full bg-white p-2.5 rounded-lg border text-[10px] font-bold" placeholder="이미지 주소 (URL 붙여넣기)" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="text-[10px] font-black block" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><span className="text-[9px] font-black text-gray-400 ml-2">이름</span><input type="text" value={castEditModal.data?.name || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, name:e.target.value}})} className="w-full p-3.5 bg-gray-50 rounded-xl border-none outline-none font-black text-sm" placeholder="이름" /></div>
                <div className="space-y-1"><span className="text-[9px] font-black text-gray-400 ml-2">성별</span><select value={castEditModal.data?.gender || 'M'} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, gender:e.target.value}})} className="w-full p-3.5 bg-gray-50 rounded-xl border-none outline-none font-black text-sm"><option value="M">남성</option><option value="F">여성</option></select></div>
                <div className="space-y-1"><span className="text-[9px] font-black text-gray-400 ml-2">나이 (자유 입력)</span><input type="text" value={castEditModal.data?.age || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, age:e.target.value}})} className="w-full p-3.5 bg-gray-50 rounded-xl border-none outline-none font-black text-sm" placeholder="예: 33세, 비공개" /></div>
                <div className="space-y-1"><span className="text-[9px] font-black text-gray-400 ml-2">출생연도</span><input type="text" value={castEditModal.data?.birth_year || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, birth_year:e.target.value}})} className="w-full p-3.5 bg-gray-50 rounded-xl border-none outline-none font-black text-sm" placeholder="예: 1992년생" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" value={castEditModal.data?.job || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, job:e.target.value}})} className="p-3.5 bg-gray-50 rounded-xl border-none font-bold text-xs" placeholder="직업 (예: 변호사)" />
                <input type="text" value={castEditModal.data?.location || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, location:e.target.value}})} className="p-3.5 bg-gray-50 rounded-xl border-none font-bold text-xs" placeholder="거주지 (예: 서울 송파구)" />
                <input type="text" value={castEditModal.data?.company || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, company:e.target.value}})} className="p-3.5 bg-gray-50 rounded-xl border-none font-bold text-xs" placeholder="소속명" />
                <input type="text" value={castEditModal.data?.position || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, position:e.target.value}})} className="p-3.5 bg-gray-50 rounded-xl border-none font-bold text-xs" placeholder="직책" />
              </div>
              <textarea value={castEditModal.data?.education || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, education:e.target.value}})} className="w-full p-4 bg-gray-50 rounded-xl border-none h-14 font-bold text-xs" placeholder="학력 정보" />
              <textarea value={castEditModal.data?.hobbies || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, hobbies:e.target.value}})} className="w-full p-4 bg-gray-50 rounded-xl border-none h-14 font-bold text-xs" placeholder="취미 및 특기" />
              <textarea value={castEditModal.data?.others || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, others:e.target.value}})} className="w-full p-4 bg-gray-50 rounded-xl border-none h-14 font-bold text-xs" placeholder="인스타 계정 등 기타 정보" />
              <textarea value={castEditModal.data?.quote || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, quote:e.target.value}})} className="w-full p-4 bg-gray-50 rounded-xl border-none h-16 font-bold text-xs" placeholder="명대사/한줄평" />
            </div>
            <div className="flex gap-3 mt-4 shrink-0">
               <button onClick={()=>setCastEditModal({isOpen:false})} className="flex-1 py-4 bg-gray-100 rounded-xl font-black text-gray-400 text-sm">취소</button>
               <button onClick={async()=>{
                  const success = await supabaseApi.saveParticipant(castEditModal.data, season); 
                  setCastEditModal({isOpen:false}); 
                  fetchCast(); 
                  if(success) showAlert('데이터 금고 저장 성공!');
                  else showAlert('⚠️ 서버 저장 실패!\n현재 환경에서 통신이 차단되어 임시 저장되었습니다.\nCodeSandbox 같은 실제 환경에서 실행해 주세요.');
               }} className="flex-1 py-4 bg-pink-500 text-white rounded-xl font-black text-sm shadow-lg shadow-pink-50">금고에 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />
          <div className="relative bg-white w-full max-w-sm rounded-[48px] p-10 text-center shadow-2xl animate-fade-in">
            <p className="font-black text-gray-900 text-lg mb-10 break-keep leading-snug whitespace-pre-wrap">{modal.message}</p>
            <div className="flex gap-3">
              {modal.type === 'confirm' && <button onClick={()=>setModal({isOpen:false})} className="flex-1 py-4 bg-gray-100 font-black rounded-3xl text-gray-400 text-sm">취소</button>}
              <button onClick={()=>{modal.onConfirm?.(); setModal({isOpen:false})}} className="flex-1 py-4 bg-pink-500 text-white font-black rounded-3xl active:scale-95 transition-transform text-sm">확인</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        body { -webkit-tap-highlight-color: transparent; }
        input, select, textarea { font-size: 16px !important; }
      `}</style>
    </div>
  );
}