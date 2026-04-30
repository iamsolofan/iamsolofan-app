import React, { useState, useEffect } from 'react';

// === 1. Supabase 연결 설정 (안전한 fetch 방식 및 로컬 자동 전환) ===
const supabaseUrl = 'https://gditohvmfxofuqsbfhab.supabase.co';
const supabaseKey = 'sb_publishable_JuLu0N945MyR5VNoAaiJNA_Wrx9uQTG';

const supabaseHeaders = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const getMyItems = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const addMyItem = (key, id) => {
  const items = getMyItems(key);
  if (!items.includes(id)) localStorage.setItem(key, JSON.stringify([...items, id]));
};

// API 통신 클라이언트
const supabaseApi = {
  _useLocal: false,
  _initLocal() {
    if (!localStorage.getItem('iamsolo_posts')) localStorage.setItem('iamsolo_posts', JSON.stringify([]));
    if (!localStorage.getItem('iamsolo_comments')) localStorage.setItem('iamsolo_comments', JSON.stringify([]));
    if (!localStorage.getItem('iamsolo_participants')) localStorage.setItem('iamsolo_participants', JSON.stringify([]));
    if (!localStorage.getItem('iamsolo_votes')) localStorage.setItem('iamsolo_votes', JSON.stringify([]));
  },

  async getPosts() {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/posts?select=*&order=created_at.desc`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error('API Error'); return await res.json();
    } catch (e) { this._useLocal = true; this._initLocal(); return JSON.parse(localStorage.getItem('iamsolo_posts')); }
  },
  async insertPost(post) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/posts`, { method: 'POST', headers: supabaseHeaders, body: JSON.stringify(post) });
      if (!res.ok) throw new Error('API Error'); return await res.json();
    } catch (e) {
      this._useLocal = true; this._initLocal();
      const posts = JSON.parse(localStorage.getItem('iamsolo_posts'));
      const newPost = { ...post, id: Date.now(), created_at: new Date().toISOString(), likes: 0 };
      localStorage.setItem('iamsolo_posts', JSON.stringify([newPost, ...posts])); return [newPost];
    }
  },
  async updatePost(id, post) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${id}`, { method: 'PATCH', headers: supabaseHeaders, body: JSON.stringify(post) });
      if (!res.ok) throw new Error('API Error'); return await res.json();
    } catch (e) {
      this._useLocal = true; this._initLocal();
      const posts = JSON.parse(localStorage.getItem('iamsolo_posts'));
      const updatedPosts = posts.map(p => p.id === id ? { ...p, ...post } : p);
      localStorage.setItem('iamsolo_posts', JSON.stringify(updatedPosts)); return updatedPosts.filter(p => p.id === id);
    }
  },
  async deletePost(id) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${id}`, { method: 'DELETE', headers: supabaseHeaders });
    } catch (e) {
      this._useLocal = true; this._initLocal();
      let posts = JSON.parse(localStorage.getItem('iamsolo_posts'));
      posts = posts.filter(p => p.id !== id); localStorage.setItem('iamsolo_posts', JSON.stringify(posts));
    }
  },
  async getComments(postId) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/comments?post_id=eq.${postId}&select=*&order=created_at.desc`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error('API Error'); return await res.json();
    } catch (e) {
      this._useLocal = true; this._initLocal();
      return JSON.parse(localStorage.getItem('iamsolo_comments')).filter(c => c.post_id === postId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },
  async insertComment(comment) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/comments`, { method: 'POST', headers: supabaseHeaders, body: JSON.stringify(comment) });
      if (!res.ok) throw new Error('API Error'); return await res.json();
    } catch (e) {
      this._useLocal = true; this._initLocal();
      const comments = JSON.parse(localStorage.getItem('iamsolo_comments'));
      const newComment = { ...comment, id: Date.now(), created_at: new Date().toISOString() };
      localStorage.setItem('iamsolo_comments', JSON.stringify([newComment, ...comments])); return [newComment];
    }
  },
  async updateComment(id, text) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/comments?id=eq.${id}`, { method: 'PATCH', headers: supabaseHeaders, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error('API Error'); return true;
    } catch (e) {
      this._useLocal = true; this._initLocal();
      const comments = JSON.parse(localStorage.getItem('iamsolo_comments'));
      const updated = comments.map(c => c.id === id ? { ...c, text } : c);
      localStorage.setItem('iamsolo_comments', JSON.stringify(updated)); return false;
    }
  },
  async deleteComment(id) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      await fetch(`${supabaseUrl}/rest/v1/comments?id=eq.${id}`, { method: 'DELETE', headers: supabaseHeaders });
    } catch (e) {
      this._useLocal = true; this._initLocal();
      let comments = JSON.parse(localStorage.getItem('iamsolo_comments'));
      comments = comments.filter(c => c.id !== id); localStorage.setItem('iamsolo_comments', JSON.stringify(comments));
    }
  },
  async getAllComments() {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/comments?select=id,post_id`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error('API Error'); return await res.json();
    } catch (e) { this._useLocal = true; this._initLocal(); return JSON.parse(localStorage.getItem('iamsolo_comments')); }
  },

  async getAvailableSeasons() {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/participants?select=season`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const seasons = Array.from(new Set(data.map(d => d.season)));
      return seasons.length > 0 ? seasons.sort((a,b)=>a-b) : [31];
    } catch (e) {
      this._useLocal = true; this._initLocal();
      const localData = JSON.parse(localStorage.getItem('iamsolo_participants') || '[]');
      const seasons = Array.from(new Set(localData.map(d => d.season)));
      return seasons.length > 0 ? seasons.sort((a,b)=>a-b) : [31];
    }
  },

  async getParticipants(season) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/participants?season=eq.${season}&select=*`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error('API Error');
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
    } catch (error) {
      this._useLocal = true; this._initLocal();
      return JSON.parse(localStorage.getItem('iamsolo_participants')).filter(p => p.season === season);
    }
  },
  async saveParticipant(cast, season) {
    const payload = {
      season: season,
      name: cast.name || '이름없음',
      gender: cast.gender === 'M' ? '남' : '여',
      age: cast.age || '', 
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
      if (this._useLocal) throw new Error('Local Mode');
      if (typeof cast.id === 'number') { 
        await fetch(`${supabaseUrl}/rest/v1/participants?id=eq.${cast.id}`, { method: 'PATCH', headers: supabaseHeaders, body: JSON.stringify(payload) });
      } else { 
        await fetch(`${supabaseUrl}/rest/v1/participants`, { method: 'POST', headers: supabaseHeaders, body: JSON.stringify(payload) });
      }
    } catch (error) {
      this._useLocal = true; this._initLocal();
      let participants = JSON.parse(localStorage.getItem('iamsolo_participants'));
      if (typeof cast.id === 'number') {
        participants = participants.map(p => p.id === cast.id ? { ...p, ...payload, gender: cast.gender, quote: cast.quote, img: cast.img } : p);
      } else {
        participants.push({ id: Date.now(), ...payload, gender: cast.gender, quote: cast.quote, img: cast.img });
      }
      localStorage.setItem('iamsolo_participants', JSON.stringify(participants));
    }
  },
  async deleteParticipant(id) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      if (typeof id === 'number') await fetch(`${supabaseUrl}/rest/v1/participants?id=eq.${id}`, { method: 'DELETE', headers: supabaseHeaders });
    } catch (error) {
      this._useLocal = true; this._initLocal();
      let participants = JSON.parse(localStorage.getItem('iamsolo_participants'));
      participants = participants.filter(p => p.id !== id);
      localStorage.setItem('iamsolo_participants', JSON.stringify(participants));
    }
  },

  async getVotes() {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/votes?select=*`, { headers: supabaseHeaders });
      if (!res.ok) throw new Error('API Error'); return await res.json();
    } catch (error) { this._useLocal = true; this._initLocal(); return JSON.parse(localStorage.getItem('iamsolo_votes')); }
  },
  async saveVote(couple_name) {
    try {
      if (this._useLocal) throw new Error('Local Mode');
      const res = await fetch(`${supabaseUrl}/rest/v1/votes?couple_name=eq.${couple_name}`, { headers: supabaseHeaders });
      const data = await res.json();
      if (data && data.length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/votes?id=eq.${data[0].id}`, { method: 'PATCH', headers: supabaseHeaders, body: JSON.stringify({ vote_count: data[0].vote_count + 1 }) });
      } else {
        await fetch(`${supabaseUrl}/rest/v1/votes`, { method: 'POST', headers: supabaseHeaders, body: JSON.stringify({ couple_name, vote_count: 1 }) });
      }
    } catch (error) {
      this._useLocal = true; this._initLocal();
      let votes = JSON.parse(localStorage.getItem('iamsolo_votes'));
      const existing = votes.find(v => v.couple_name === couple_name);
      if (existing) existing.vote_count += 1;
      else votes.push({ id: Date.now(), couple_name, vote_count: 1 });
      localStorage.setItem('iamsolo_votes', JSON.stringify(votes));
    }
  }
};

// --- 아이콘 컴포넌트 ---
const IconHeart = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconRefresh = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

const STANDARD_CAST = [
  { name: '영수', gender: 'M' }, { name: '영호', gender: 'M' }, { name: '영식', gender: 'M' }, { name: '영철', gender: 'M' }, { name: '광수', gender: 'M' }, { name: '상철', gender: 'M' }, { name: '경수', gender: 'M' },
  { name: '영숙', gender: 'F' }, { name: '정숙', gender: 'F' }, { name: '순자', gender: 'F' }, { name: '영자', gender: 'F' }, { name: '옥순', gender: 'F' }, { name: '현숙', gender: 'F' }, { name: '정희', gender: 'F' }
];

// === 2. 댓글창 컴포넌트 ===
function CommentSection({ postId, isAdmin, showConfirm }) {
  const [comments, setComments] = useState([]);
  const [newAuthor, setNewAuthor] = useState(''); // 💡 추가: 작성자 닉네임 상태
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => { if (postId) fetchComments(); }, [postId]);

  async function fetchComments() {
    try {
      const data = await supabaseApi.getComments(postId);
      setComments(data || []);
    } catch (error) { console.error(error.message); }
  }

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim() === '') return;
    try {
      const authorName = newAuthor.trim() === '' ? '익명' : newAuthor.trim(); // 닉네임 미입력시 '익명'
      const res = await supabaseApi.insertComment({ post_id: postId, text: newComment, author: authorName });
      if (res && res.length > 0) addMyItem('my_comments', res[0].id);
      setNewComment(''); 
      fetchComments();   
    } catch (error) { alert('댓글 저장에 실패했습니다.'); }
  };

  const handleSaveEdit = async (id) => {
    if (editText.trim() === '') return;
    try {
      await supabaseApi.updateComment(id, editText);
      setEditingId(null);
      fetchComments();
    } catch (error) { alert('댓글 수정에 실패했습니다.'); }
  };

  const handleDeleteComment = (id) => {
    showConfirm('댓글을 삭제하시겠습니까?', async () => {
      await supabaseApi.deleteComment(id);
      fetchComments();
    });
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      <h3 className="text-lg font-bold mb-4 text-gray-800">댓글 {comments.length}개</h3>
      {/* 💡 수정: 작성자와 내용을 함께 입력받는 폼 */}
      <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input type="text" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="닉네임 (선택)" className="w-full sm:w-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium shrink-0" />
        <div className="flex flex-1 gap-2">
          <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="따뜻한 댓글을 남겨주세요!" className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium" />
          <button type="submit" className="bg-gray-900 text-white px-6 py-4 rounded-2xl hover:bg-black font-black text-sm shadow-sm transition-colors shrink-0">등록</button>
        </div>
      </form>
      <div className="space-y-3">
        {comments.map((comment) => {
          const isMine = getMyItems('my_comments').includes(comment.id);
          return (
            <div key={comment.id} className="p-5 bg-gray-50 rounded-2xl shadow-sm flex flex-col group transition-all">
              {editingId === comment.id ? (
                <div className="flex gap-2 w-full items-center">
                  <input type="text" value={editText} onChange={e=>setEditText(e.target.value)} className="flex-1 p-3 rounded-xl border border-gray-200 font-medium text-sm focus:ring-2 focus:ring-pink-300 bg-white outline-none" autoFocus />
                  <button onClick={()=>handleSaveEdit(comment.id)} className="text-xs text-blue-500 font-black px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">완료</button>
                  <button onClick={()=>setEditingId(null)} className="text-xs text-gray-400 font-black px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap">취소</button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    {/* 💡 수정: 댓글 작성자 표시 영역 추가 */}
                    <span className="text-[10px] font-black text-gray-400 block mb-1">{comment.author || '익명'}</span>
                    <p className="text-gray-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                  </div>
                  <div className="flex gap-3 shrink-0 mt-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isMine && (
                      <button onClick={() => { setEditingId(comment.id); setEditText(comment.text); }} className="text-xs font-black text-gray-400 hover:text-blue-500 transition-colors whitespace-nowrap">수정</button>
                    )}
                    {(isMine || isAdmin) && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-xs font-black text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap">삭제</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {comments.length === 0 && <p className="text-gray-400 text-center py-6 text-sm font-bold">첫 번째 댓글을 남겨보세요!</p>}
      </div>
    </div>
  );
}

// 💡 [완벽 제어] 사진 컴포넌트: 이름 텍스트 위치를 완전히 바닥(bottom-0)으로 고정!
const CastCard = ({ cast, onClick, showJob = false }) => (
  <div onClick={() => onClick(cast)} className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all aspect-square w-full bg-gray-100 border border-gray-200 flex flex-col">
    {cast.img ? (
      <img src={cast.img} alt={cast.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
    ) : (
      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
        <IconUser /> <span className="text-[10px] mt-1 font-bold opacity-50 uppercase tracking-widest text-center">Empty<br/>Slot</span>
      </div>
    )}
    
    {/* 💡 텍스트가 위로 뜨지 않도록 absolute inset-x-0 bottom-0 을 사용해 제일 아래 칸에 고정시켰습니다. */}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center justify-end pt-12 pb-2 sm:pb-2.5 px-2 pointer-events-none">
      <span className="text-white font-black text-sm sm:text-base drop-shadow-md text-center">
        {cast.name} {showJob && cast.age && <span className="text-[10px] sm:text-xs font-bold text-gray-300 ml-1">({cast.age})</span>}
      </span>
      {/* showJob이 true일 때(출연진 탭)만 직업이 표시됨 */}
      {showJob && cast.job && (
        <span className="text-pink-300 font-bold text-[10px] sm:text-xs truncate mt-0.5 text-center">{cast.job}</span>
      )}
    </div>
  </div>
);

// === 3. 메인 애플리케이션 컴포넌트 ===
export default function App() {
  const [season, setSeason] = useState(31);
  const [activeTab, setActiveTab] = useState('coupleVote');
  const [availableSeasons, setAvailableSeasons] = useState([31]);
  const [castData, setCastData] = useState([]);
  const [coupleVotes, setCoupleVotes] = useState({});
  const [villainVotes, setVillainVotes] = useState({});
  const [posts, setPosts] = useState([]);
  
  const [hasVotedCouple, setHasVotedCouple] = useState(false);
  const [hasVotedVillainM, setHasVotedVillainM] = useState(false);
  const [hasVotedVillainF, setHasVotedVillainF] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState([]);
  
  const [firstCouplePick, setFirstCouplePick] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [writeModal, setWriteModal] = useState({ isOpen: false, isEdit: false, postId: null, author: '', title: '', content: '' });
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [castEditModal, setCastEditModal] = useState({ isOpen: false, data: null });

  useEffect(() => {
    async function initSeasons() {
      const fetchedSeasons = await supabaseApi.getAvailableSeasons();
      if (!fetchedSeasons.includes(31)) fetchedSeasons.push(31);
      setAvailableSeasons(fetchedSeasons.sort((a, b) => a - b));
    }
    initSeasons();
  }, []);

  useEffect(() => {
    fetchCast();
    fetchVotes();
    if (activeTab === 'board') fetchPosts();
    setSearchTerm('');
  }, [activeTab, season]);

  useEffect(() => {
    let tabName = '';
    switch (activeTab) {
      case 'coupleVote': tabName = '최애 커플 투표'; break;
      case 'villainVote': tabName = '최고 빌런 투표'; break;
      case 'profile': tabName = '출연진 프로필'; break;
      case 'board': tabName = '전체 게시판'; break;
      case 'admin': tabName = '운영자 설정'; break;
      default: tabName = '홈';
    }
    document.title = `${season}기 ${tabName} - 나는솔로팬이다`;

    const dbNames = castData.map(c => c.name);
    const allNames = Array.from(new Set([...STANDARD_CAST.map(s=>s.name), ...dbNames]));
    const nameKeywords = allNames.map(n => `나는 솔로 ${season}기 ${n}, 나는솔로 ${season}기 ${n}, 나솔 ${season}기 ${n}, 나는솔로 ${n}`).join(', ');
    const keywords = `나는솔로, 나는 솔로, 나는solo, 나는솔로 ${season}기, 나솔 ${season}기, 나는솔로 갤러리, 나솔갤, 나는솔로 투표, 나는솔로 인스타, 나는솔로 직업, ${nameKeywords}`;
    const description = `나는 솔로(나는 SOLO) ${season}기 출연진 프로필, 직업, 인스타 및 시청자들의 실시간 인기 투표와 솔직한 리뷰를 볼 수 있는 팬 커뮤니티입니다.`;

    const setMetaTag = (name, content, attr = 'name') => {
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attr, name); document.head.appendChild(meta); }
      meta.setAttribute('content', content);
    };

    setMetaTag('keywords', keywords);
    setMetaTag('description', description);
    setMetaTag('og:title', document.title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:type', 'website', 'property');
    setMetaTag('og:site_name', '나는솔로팬이다', 'property');
  }, [season, activeTab, castData]);

  async function fetchCast() {
    try {
      const dbData = await supabaseApi.getParticipants(season) || [];
      let mergedData = [...dbData];
      let tempIdCounter = 1;
      
      STANDARD_CAST.forEach(std => {
        const exists = dbData.find(d => d.name === std.name);
        if (!exists) {
          mergedData.push({
            id: `temp_${tempIdCounter++}`,
            season: season,
            name: std.name,
            gender: std.gender,
            birth_year: '', job: '', company: '', position: '', education: '', location: '', hobbies: '', others: '', quote: '', img: ''
          });
        }
      });
      
      mergedData.sort((a, b) => {
         const idxA = STANDARD_CAST.findIndex(s => s.name === a.name);
         const idxB = STANDARD_CAST.findIndex(s => s.name === b.name);
         if (idxA !== -1 && idxB !== -1) return idxA - idxB;
         if (idxA !== -1) return -1;
         if (idxB !== -1) return 1;
         return a.id > b.id ? 1 : -1;
      });

      setCastData(mergedData);
    } catch (error) { console.error(error); }
  }

  async function fetchVotes() {
    try {
      const data = await supabaseApi.getVotes();
      const cMap = {};
      const vMap = {};
      
      data.forEach(v => {
        if (v.couple_name.startsWith('villain_')) {
          vMap[v.couple_name.replace('villain_', '')] = v.vote_count;
        } else {
          cMap[v.couple_name] = v.vote_count;
        }
      });
      setCoupleVotes(cMap);
      setVillainVotes(vMap);
    } catch (e) { console.error(e); }
  }

  async function fetchPosts() {
    try {
      const [postsData, commentsData] = await Promise.all([ supabaseApi.getPosts(), supabaseApi.getAllComments() ]);
      const counts = {};
      if (commentsData) commentsData.forEach(c => { counts[c.post_id] = (counts[c.post_id] || 0) + 1; });
      const enrichedPosts = (postsData || []).map(p => ({ ...p, commentCount: counts[p.id] || 0 }));
      setPosts(enrichedPosts);
    } catch (error) { console.error('게시글 로드 실패'); }
  }

  const showAlert = (m) => setModal({ isOpen: true, type: 'alert', message: m });
  const showConfirm = (m, c) => setModal({ isOpen: true, type: 'confirm', message: m, onConfirm: c });
  const openProfile = (p) => { setSelectedProfile(p); setIsPanelOpen(true); document.body.style.overflow = 'hidden'; };
  const closeProfile = () => { setIsPanelOpen(false); document.body.style.overflow = 'unset'; };

  const handleAdminLogin = () => {
    if (adminPassword === 'hoonie2') { setIsAdmin(true); setShowAdminLogin(false); setAdminPassword(''); showAlert('운영자 인증 성공! ⚙️운영자 탭이 활성화되었습니다.'); }
    else showAlert('비밀번호가 틀렸습니다.');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCastEditModal(prev => ({...prev, data: {...prev.data, img: dataUrl}}));
      }
      img.src = event.target.result;
    }
    reader.readAsDataURL(file);
  };

  const handleSaveCastEdit = async () => {
    try {
      await supabaseApi.saveParticipant(castEditModal.data, season);
      setCastEditModal({ isOpen: false }); showAlert('출연진 정보가 안전하게 저장되었습니다!'); fetchCast();
    } catch (e) { showAlert('저장에 실패했습니다.'); }
  };

  const handleDeleteCast = (id, name) => {
    if (typeof id === 'string') return showAlert('이건 아직 금고에 저장되지 않은 빈 슬롯입니다. 삭제할 내용이 없습니다!');
    
    showConfirm(`${name}님을 금고에서 완전히 삭제하시겠습니까?`, async () => {
      await supabaseApi.deleteParticipant(id); showAlert('삭제가 완료되었습니다.'); fetchCast();
    });
  };

  const handleCoupleVote = async (p2) => {
    if (hasVotedCouple) return showAlert('이미 투표하셨습니다.');
    const key = [firstCouplePick.name, p2.name].sort().join('_');
    setCoupleVotes(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    setHasVotedCouple(true); setFirstCouplePick(null);
    showAlert('커플 투표가 성공적으로 기록되었습니다!');
    await supabaseApi.saveVote(key);
  };

  const handleVillainVote = (c) => {
    if (c.gender === 'M' && hasVotedVillainM) return showAlert('남성 부문은 이미 투표하셨습니다.');
    if (c.gender === 'F' && hasVotedVillainF) return showAlert('여성 부문은 이미 투표하셨습니다.');
    
    showConfirm(`${c.name}님께 투표하시겠습니까?`, async () => {
      setVillainVotes(prev => ({ ...prev, [c.id]: (prev[c.id] || 0) + 1 }));
      if (c.gender === 'M') setHasVotedVillainM(true);
      if (c.gender === 'F') setHasVotedVillainF(true);
      showAlert(`${c.gender === 'M' ? '남성' : '여성'} 부문 빌런 투표 완료!`);
      await supabaseApi.saveVote(`villain_${c.id}`);
    });
  };

  const handleSavePost = async () => {
    if (!writeModal.title || !writeModal.content) return alert('제목과 내용을 모두 입력해주세요!');
    try {
      if (writeModal.isEdit) {
        await supabaseApi.updatePost(writeModal.postId, { title: writeModal.title, content: writeModal.content });
        if (selectedPost && selectedPost.id === writeModal.postId) {
          setSelectedPost({...selectedPost, title: writeModal.title, content: writeModal.content, author: writeModal.author});
        }
        showAlert('수정 완료되었습니다.');
      } else {
        const res = await supabaseApi.insertPost({ title: writeModal.title, content: writeModal.content, author: writeModal.author || '익명', likes: 0 });
        if (res && res.length > 0) addMyItem('my_posts', res[0].id);
        showAlert('게시글이 저장되었습니다!');
      }
      setWriteModal({ isOpen: false, isEdit: false, postId: null, author: '', title: '', content: '' });
      fetchPosts(); 
    } catch (error) { alert('게시글 저장에 실패했습니다.'); }
  };

  const handleLikePost = async () => {
    if (!selectedPost) return;
    if (likedPostIds.includes(selectedPost.id)) return showAlert('이미 좋아요를 눌렀습니다.');
    try {
      const newLikes = (selectedPost.likes || 0) + 1;
      await supabaseApi.updatePost(selectedPost.id, { likes: newLikes });
      setLikedPostIds([...likedPostIds, selectedPost.id]);
      setSelectedPost({ ...selectedPost, likes: newLikes });
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, likes: newLikes } : p));
    } catch (error) { console.error('좋아요 실패'); }
  };

  const handleDeletePost = (id) => {
    showConfirm('정말 이 게시글을 영구 삭제하시겠습니까?', async () => {
      await supabaseApi.deletePost(id);
      setSelectedPost(null); document.body.style.overflow = 'unset';
      fetchPosts();
      showAlert('게시글이 삭제되었습니다.');
    });
  };

  const closePostModal = () => {
    setSelectedPost(null); document.body.style.overflow = 'unset'; fetchPosts(); 
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
    const total = Object.values(villainVotes).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(villainVotes)
      .map(([id, v]) => {
        const cast = castData.find(c => String(c.id) === String(id));
        return { id, name: cast?.name, img: cast?.img, votes: v, percentage: ((v/total)*100).toFixed(1) };
      })
      .filter(c => c.name)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
  };

  const filteredCastData = castData.filter(c => 
    !searchTerm || 
    (c.name && c.name.includes(searchTerm)) || 
    (c.job && c.job.includes(searchTerm)) || 
    (c.location && c.location.includes(searchTerm)) ||
    (c.company && c.company.includes(searchTerm)) ||
    (c.education && c.education.includes(searchTerm)) ||
    (c.hobbies && c.hobbies.includes(searchTerm)) ||
    (c.birth_year && c.birth_year.includes(searchTerm)) ||
    (c.age && String(c.age).includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-pink-500 tracking-tighter flex items-center gap-4">
              <span className="scale-125 sm:scale-150"><IconHeart /></span> 나는솔로팬이다
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 font-bold tracking-tight">제작진과 아무 상관 없는 팬 커뮤니티</p>
          </div>
          <div className="flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-full border border-pink-100 shrink-0">
            <span className="text-sm font-black text-pink-600">기수 선택:</span>
            <select value={season} onChange={(e) => {
                if (e.target.value === 'new') {
                    const next = Math.max(...availableSeasons, 30) + 1;
                    const input = prompt('추가할 기수를 숫자로 입력하세요.', next);
                    if (input && !isNaN(input)) {
                        setAvailableSeasons(prev => Array.from(new Set([...prev, Number(input)])).sort((a,b)=>a-b));
                        setSeason(Number(input));
                    }
                } else {
                    setSeason(Number(e.target.value));
                }
            }} className="bg-transparent text-pink-600 text-sm font-black outline-none border-none cursor-pointer">
              {availableSeasons.map(s => <option key={s} value={s}>{s}기</option>)}
              {isAdmin && <option value="new">+ 새 기수 추가</option>}
            </select>
          </div>
        </div>
        <nav className="max-w-4xl mx-auto px-4 flex gap-4 overflow-x-auto border-t border-gray-100 scrollbar-hide">
          {[{ id: 'coupleVote', l: '💞 최애 커플' }, { id: 'villainVote', l: '👿 빌런 투표' }, { id: 'profile', l: '📸 출연진' }, { id: 'board', l: '💬 게시판' }, ...(isAdmin ? [{ id: 'admin', l: '⚙️ 운영자' }] : [])].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-4 px-3 text-sm font-black border-b-4 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-pink-500 text-pink-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{t.l}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        {activeTab === 'coupleVote' && (
          <div className="animate-fade-in space-y-10">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-pink-100">
              <h2 className="text-2xl font-black mb-8 text-gray-800 tracking-tight">{season}기 응원 커플 투표</h2>
              {!firstCouplePick ? (
                <div className="space-y-10">
                  {['M', 'F'].map(g => (
                    <div key={g}>
                      <h3 className={`text-xs font-black mb-5 border-b-2 pb-2 ${g==='M'?'text-blue-500 border-blue-50':'text-pink-500 border-pink-50'}`}>{g==='M'?'SOLO 남성':'SOLO 여성'}</h3>
                      <div className="flex flex-wrap gap-4">
                        {castData.filter(c=>c.gender===g).map(c=>(<div key={c.id} className="w-[calc(33.33%-0.75rem)] sm:w-[calc(20%-1rem)] max-w-[120px]"><CastCard cast={c} onClick={setFirstCouplePick}/></div>))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="w-full md:w-1/3 flex flex-col items-center p-8 bg-gray-50 rounded-[40px] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-300 mb-4 uppercase tracking-widest">선택한 멤버</p>
                    <div className="w-40"><CastCard cast={firstCouplePick} onClick={()=>{}}/></div>
                    <button onClick={()=>setFirstCouplePick(null)} className="mt-8 text-xs font-black text-gray-500 bg-white border border-gray-200 px-5 py-3 rounded-full flex items-center gap-2 shadow-sm"><IconRefresh/> 다시 고르기</button>
                  </div>
                  <div className="flex-1 w-full">
                    <p className="text-pink-500 font-black mb-8 text-lg underline decoration-pink-200 underline-offset-8">상대방을 선택하세요!</p>
                    <div className="flex flex-wrap gap-5">
                      {castData.filter(c=>c.gender!==firstCouplePick.gender).map(c=>(<div key={c.id} className="w-[calc(33.33%-0.85rem)] sm:w-[calc(25%-1rem)] max-w-[120px]"><CastCard cast={c} onClick={handleCoupleVote}/></div>))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black mb-10 flex items-center gap-3">🏆 실시간 커플 랭킹</h3>
              <div className="space-y-10">
                {getSortedCoupleResults().length > 0 ? getSortedCoupleResults().map((r, i) => (
                  <div key={i} className="flex items-center gap-8">
                    <span className="text-4xl font-black text-gray-100 w-10">{i+1}</span>
                    <div className="flex -space-x-5"><img src={r.img1 || 'https://via.placeholder.com/100?text=No+Image'} className="w-14 h-14 rounded-full border-4 border-white object-cover shadow-md z-10 bg-white"/><img src={r.img2 || 'https://via.placeholder.com/100?text=No+Image'} className="w-14 h-14 rounded-full border-4 border-white object-cover shadow-md bg-white"/></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm font-black mb-3"><span>{r.name}</span><span className="text-pink-500">{r.votes}표 ({r.percentage}%)</span></div>
                      <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner"><div className="bg-pink-400 h-full transition-all duration-1000 ease-out shadow-lg shadow-pink-200" style={{width:`${r.percentage}%`}}/></div>
                    </div>
                  </div>
                )) : <div className="py-20 text-center font-bold text-gray-300">투표 데이터가 없습니다.</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'villainVote' && (
          <div className="animate-fade-in space-y-10">
            <div className="bg-white p-10 rounded-[40px] border border-red-50 shadow-sm">
              <h2 className="text-3xl font-black mb-3 text-red-500 tracking-tighter uppercase">Villain Voting</h2>
              <p className="text-gray-400 text-sm font-bold mb-12">이번 기수 최고의 빌런은? (남/녀 구분)</p>
              {['M', 'F'].map(g => (
                <div key={g} className="mt-12 first:mt-0">
                  <h3 className={`text-xs font-black mb-6 border-b-2 pb-3 ${g==='M'?'text-blue-500 border-blue-50':'text-pink-500 border-pink-50'}`}>{g==='M'?'SOLO 남성 부문':'SOLO 여성 부문'}</h3>
                  <div className="flex flex-wrap gap-6">
                    {castData.filter(c=>c.gender===g).map(c => {
                      const v = villainVotes[c.id] || 0;
                      const total = Object.values(villainVotes).reduce((a, b) => a + b, 0) || 1;
                      return (
                        <div key={c.id} className="w-[calc(33.33%-1rem)] sm:w-[calc(20%-1.2rem)] max-w-[120px] text-center">
                          <CastCard cast={c} onClick={() => handleVillainVote(c)} />
                          <div className="mt-4">
                            <p className="text-base font-black text-gray-800">{v}표</p>
                            <p className="text-[10px] text-red-500 font-black bg-red-50 rounded-full px-3 py-1 inline-block border border-red-100">{((v/total)*100).toFixed(1)}%</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black mb-16 flex items-center gap-3 text-red-500">👿 실시간 빌런 랭킹</h3>
              <div className="flex justify-center items-end gap-2 sm:gap-6 h-64 pt-10">
                {getSortedVillainResults().length > 0 ? (
                  <>
                    {getSortedVillainResults()[1] && (
                      <div className="flex flex-col items-center w-1/3 max-w-[120px]">
                        <div className="relative mb-4">
                          <img src={getSortedVillainResults()[1].img || 'https://via.placeholder.com/100'} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-300 shadow-lg z-10 relative bg-white" />
                          <div className="absolute -top-3 -right-3 bg-gray-300 text-white font-black w-7 h-7 flex items-center justify-center rounded-full text-xs shadow-md z-20">2</div>
                        </div>
                        <div className="w-full bg-gray-200 h-24 sm:h-32 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-inner"><p className="font-black text-gray-800">{getSortedVillainResults()[1].name}</p><p className="text-xs text-red-500 font-black mt-1">{getSortedVillainResults()[1].votes}표</p></div>
                      </div>
                    )}
                    {getSortedVillainResults()[0] && (
                      <div className="flex flex-col items-center w-1/3 max-w-[140px] z-10">
                        <div className="relative mb-4">
                          <img src={getSortedVillainResults()[0].img || 'https://via.placeholder.com/100'} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-yellow-400 shadow-2xl z-10 relative bg-white" />
                          <div className="absolute -top-4 -right-2 bg-yellow-400 text-white font-black w-8 h-8 flex items-center justify-center rounded-full text-sm shadow-md animate-bounce z-20">1</div>
                        </div>
                        <div className="w-full bg-red-500 h-32 sm:h-48 rounded-t-3xl flex flex-col items-center justify-start pt-5 shadow-2xl shadow-red-200"><p className="font-black text-white text-lg">{getSortedVillainResults()[0].name}</p><p className="text-sm text-red-100 font-black mt-1">{getSortedVillainResults()[0].votes}표 ({getSortedVillainResults()[0].percentage}%)</p></div>
                      </div>
                    )}
                    {getSortedVillainResults()[2] && (
                      <div className="flex flex-col items-center w-1/3 max-w-[120px]">
                        <div className="relative mb-4">
                          <img src={getSortedVillainResults()[2].img || 'https://via.placeholder.com/100'} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-amber-600 shadow-lg z-10 relative bg-white" />
                          <div className="absolute -top-3 -right-3 bg-amber-600 text-white font-black w-6 h-6 flex items-center justify-center rounded-full text-[10px] shadow-md z-20">3</div>
                        </div>
                        <div className="w-full bg-amber-100 h-16 sm:h-20 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-inner"><p className="font-black text-amber-900 text-sm">{getSortedVillainResults()[2].name}</p><p className="text-[10px] text-amber-600 font-black mt-1">{getSortedVillainResults()[2].votes}표</p></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">아직 투표 데이터가 없습니다. 첫 투표를 해주세요!</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade-in space-y-10">
            <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-4">
              <IconSearch />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="이름, 직업, 거주지 등으로 검색해보세요... (예: 변호사, 영숙)" 
                className="flex-1 bg-transparent border-none outline-none font-bold text-gray-800 placeholder-gray-400 text-sm sm:text-base"
              />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600"><IconX /></button>}
            </div>

            {['M', 'F'].map(g => {
              const genderCasts = filteredCastData.filter(c => c.gender === g);
              if (genderCasts.length === 0) return null; 
              return (
                <div key={g} className="pt-4">
                  <h2 className={`text-2xl font-black mb-8 border-l-8 pl-5 py-2 ${g==='M'?'text-blue-500 border-blue-500':'text-pink-500 border-pink-500'}`}>{g==='M'?'SOLO 남성':'SOLO 여성'}</h2>
                  <div className="flex flex-wrap gap-8">
                    {genderCasts.map(c => (
                      <div key={c.id} onClick={() => openProfile(c)} className="w-[calc(50%-1rem)] sm:w-[calc(33.33%-1.4rem)] md:w-[calc(25%-1.5rem)] max-w-[220px]">
                        <CastCard cast={c} onClick={() => {}} showJob={true} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredCastData.length === 0 && (
              <div className="py-20 text-center font-bold text-gray-400">검색 결과가 없습니다.</div>
            )}
          </div>
        )}

        {activeTab === 'board' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter">전체 게시판</h2>
              <button onClick={()=>setWriteModal({isOpen:true, isEdit:false, author:'', title:'', content:''})} className="bg-gray-900 text-white px-8 py-4 rounded-[24px] text-base font-black flex items-center gap-3 shadow-2xl active:scale-95 transition-all"><IconEdit/> 글쓰기</button>
            </div>
            
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 divide-y overflow-hidden">
              {posts.length === 0 ? (
                <div className="p-32 text-center font-black text-gray-200 text-xl tracking-tighter">첫 글의 주인공이 되어보세요!</div>
              ) : (
                posts.map(p => (
                  <div key={p.id} onClick={()=>{setSelectedPost(p); document.body.style.overflow='hidden';}} className="p-6 sm:p-8 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-all group">
                    <div className="flex-1 pr-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-black text-lg sm:text-xl text-gray-800 group-hover:text-pink-500 transition-colors line-clamp-1">
                          {p.title}
                          {p.commentCount > 0 && <span className="text-pink-500 ml-2 text-sm">[{p.commentCount}]</span>}
                        </h3>
                        {getMyItems('my_posts').includes(p.id) && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded-md font-black whitespace-nowrap">내가 쓴 글</span>}
                      </div>
                      <p className="text-xs text-gray-400 font-bold tracking-tight uppercase line-clamp-1">
                        {p.author} | {p.created_at ? new Date(p.created_at).toLocaleDateString() : '방금 전'}
                      </p>
                    </div>
                    <span className="text-pink-500 font-black text-xs sm:text-sm bg-pink-50 px-4 sm:px-5 py-2 sm:py-3 rounded-full border border-pink-100 shadow-sm whitespace-nowrap">♥ {p.likes || 0}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="animate-fade-in space-y-10 bg-white p-6 sm:p-10 rounded-[40px] shadow-2xl border-4 border-gray-900">
            <div className="flex flex-col md:flex-row justify-between items-center border-b-4 border-gray-900 pb-8 gap-6">
              <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-4"><IconSettings /> {season}기 출연진 관리</h2>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={()=>setCastEditModal({isOpen:true, data:{season: season, name:'', gender:'M', birth_year:'', company:'', position:'', education:'', location:'', hobbies:'', others:'', job:'', quote:'', img:'', age:''}})} className="flex-1 md:flex-none bg-pink-500 text-white px-6 py-4 rounded-3xl font-black shadow-xl hover:scale-105 transition-transform">
                  + 새 출연자 추가
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto pr-2 sm:pr-4 scrollbar-hide">
              {castData.map(c => (
                <div key={c.id} className="py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 px-2 sm:px-4 rounded-3xl transition-colors gap-4">
                  <div className="flex items-center gap-5">
                    <img src={c.img || 'https://via.placeholder.com/100?text=No+Image'} className="w-16 h-16 rounded-full object-cover border-2 border-gray-900 shadow-lg bg-white"/>
                    <div className="flex flex-col">
                      <p className="font-black text-xl text-gray-900">
                        {c.name} 
                        <span className="text-xs text-pink-500 ml-2">{c.gender === 'M' ? '남성' : '여성'} {c.age && `/ ${c.age}`}</span>
                        {typeof c.id === 'string' && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded ml-2 font-black">미작성 빈칸</span>}
                      </p>
                      <p className="text-xs text-gray-400 font-bold mt-1 line-clamp-1">{c.job} {c.company && `| ${c.company}`}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-3 self-end sm:self-auto">
                    <button onClick={()=>setCastEditModal({isOpen:true, data:{...c}})} className="text-sm font-black bg-gray-100 px-6 py-3 rounded-2xl hover:bg-gray-200">편집</button>
                    <button onClick={()=>handleDeleteCast(c.id, c.name)} className="text-sm font-black bg-red-50 text-red-500 px-6 py-3 rounded-2xl hover:bg-red-100">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-16 text-center bg-white border-t border-gray-100">
        {!isAdmin ? (
          <button onClick={()=>setShowAdminLogin(true)} className="text-[10px] font-black text-gray-200 hover:text-pink-300 transition-colors uppercase">ADMIN_LOGIN</button>
        ) : (
          <p className="text-[10px] text-pink-400 font-black tracking-widest uppercase">OWNER_MODE_ACTIVE</p>
        )}
      </footer>

      {/* 기본 모달 */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />
          <div className="relative bg-white w-full max-w-sm rounded-[48px] p-10 text-center shadow-2xl animate-fade-in">
            <p className="font-black text-gray-900 text-xl mb-12 break-keep">{modal.message}</p>
            <div className="flex gap-4">
              {modal.type === 'confirm' && <button onClick={()=>setModal({isOpen:false})} className="flex-1 py-5 bg-gray-100 font-black rounded-3xl text-gray-400">취소</button>}
              <button onClick={()=>{modal.onConfirm?.(); setModal({isOpen:false})}} className="flex-1 py-5 bg-pink-500 text-white font-black rounded-3xl shadow-xl shadow-pink-100 active:scale-95 transition-transform">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 운영자 로그인 모달 */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setShowAdminLogin(false)} />
          <div className="relative bg-white p-12 rounded-[56px] w-full max-w-sm text-center shadow-2xl border-4 border-gray-900 animate-fade-in">
            <h3 className="text-3xl font-black mb-10 text-gray-900 uppercase">Master Login</h3>
            <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} className="w-full bg-gray-50 p-6 rounded-[32px] text-center mb-10 outline-none border-4 border-gray-100 font-black text-2xl focus:border-pink-500 transition-all" placeholder="PASSWORD" onKeyDown={e=>e.key==='Enter'&&handleAdminLogin()}/>
            <button onClick={handleAdminLogin} className="w-full py-6 bg-gray-900 text-white font-black rounded-[32px] shadow-2xl active:scale-95 transition-all uppercase tracking-widest text-lg">Login</button>
          </div>
        </div>
      )}

      {/* 운영자: 출연진 편집/추가 팝업 */}
      {castEditModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={()=>setCastEditModal({isOpen:false})} />
          <div className="relative bg-white w-full max-w-3xl rounded-[40px] sm:rounded-[56px] p-8 sm:p-12 flex flex-col shadow-2xl border-4 border-gray-900 animate-fade-in max-h-[95vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{season}기 출연자 편집</h3>
              <button onClick={()=>setCastEditModal({isOpen:false})} className="p-2 bg-gray-100 rounded-full"><IconX /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 sm:pr-4 scrollbar-hide space-y-8 pb-4">
              
              <div className="bg-gray-50 p-6 rounded-[32px] border-2 border-gray-100 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center">
                  {castEditModal.data?.img ? <img src={castEditModal.data.img} className="w-full h-full object-cover" /> : <IconUser />}
                </div>
                <div className="flex-1 w-full space-y-3">
                  <p className="text-xs font-bold text-gray-500">사진 URL을 넣거나 내 컴퓨터에서 파일을 선택하세요.</p>
                  <input type="text" value={castEditModal.data?.img || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, img:e.target.value}})} className="w-full bg-white p-3 rounded-xl text-xs font-bold outline-none border border-gray-200" placeholder="http://... 이미지 주소 붙여넣기" />
                  <div className="relative w-full">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-full bg-pink-50 text-pink-500 border border-pink-200 p-3 rounded-xl text-center text-sm font-black hover:bg-pink-100 transition-colors pointer-events-none">
                      📸 앨범에서 사진 파일 선택하기
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">이름</label><input type="text" value={castEditModal.data?.name || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, name:e.target.value}})} className="w-full bg-gray-50 p-4 mt-1 rounded-2xl text-sm font-black outline-none border-2 focus:border-pink-300" placeholder="예: 영수" /></div>
                <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">성별</label><select value={castEditModal.data?.gender || 'M'} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, gender:e.target.value}})} className="w-full bg-gray-50 p-4 mt-1 rounded-2xl text-sm font-black outline-none border-2 focus:border-pink-300"><option value="M">남성</option><option value="F">여성</option></select></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[32px] border-2 border-gray-100">
                <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">나이</label><input type="text" value={castEditModal.data?.age || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, age:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="예: 33세, 비공개" /></div>
                <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">출생연도</label><input type="text" value={castEditModal.data?.birth_year || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, birth_year:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="예: 1990년생" /></div>
                <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">거주지</label><input type="text" value={castEditModal.data?.location || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, location:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="예: 서울 송파구" /></div>
                <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">직업</label><input type="text" value={castEditModal.data?.job || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, job:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="예: 변호사" /></div>
                <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">학력</label><input type="text" value={castEditModal.data?.education || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, education:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="예: OO대 법학과" /></div>
                <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">소속명(직장)</label><input type="text" value={castEditModal.data?.company || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, company:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="예: 법무법인 OO" /></div>
                <div className="sm:col-span-2"><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">직책</label><input type="text" value={castEditModal.data?.position || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, position:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="예: 대표 변호사" /></div>
                <div className="sm:col-span-2"><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">취미 및 특기</label><input type="text" value={castEditModal.data?.hobbies || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, hobbies:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="예: 골프, 와인 테이스팅" /></div>
                <div className="sm:col-span-2"><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">기타 (인스타 등)</label><input type="text" value={castEditModal.data?.others || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, others:e.target.value}})} className="w-full bg-white p-3 mt-1 rounded-xl text-sm font-bold outline-none border" placeholder="자유롭게 작성" /></div>
              </div>

              <div><label className="text-[10px] font-black text-gray-400 ml-2 uppercase">명대사 / 한줄평</label><textarea value={castEditModal.data?.quote || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, quote:e.target.value}})} className="w-full bg-gray-50 p-4 mt-1 rounded-2xl text-sm font-bold outline-none border-2 focus:border-pink-300 h-24" placeholder="출연자의 명대사나 인상깊은 특징을 적어주세요." /></div>
            </div>
            
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 shrink-0">
              <button onClick={()=>setCastEditModal({isOpen:false})} className="w-1/3 py-5 bg-gray-100 font-black rounded-3xl text-gray-400">취소</button>
              <button onClick={handleSaveCastEdit} className="flex-1 py-5 bg-gray-900 text-white font-black rounded-3xl shadow-xl hover:bg-black transition-colors">금고에 영구 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 상세보기 패널 */}
      {selectedProfile && isPanelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeProfile} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] sm:rounded-[56px] shadow-2xl flex flex-col p-6 sm:p-10 max-h-[90vh] overflow-y-auto animate-fade-in scrollbar-hide">
            <button onClick={closeProfile} className="absolute top-6 right-6 p-3 bg-gray-100 rounded-full z-10 hover:bg-gray-200 transition-colors"><IconX /></button>
            
            <div className="flex flex-row items-center gap-6 sm:gap-8 mt-4 sm:mt-2 bg-gray-50 p-5 sm:p-6 rounded-[32px] border border-gray-100 shrink-0">
              <div className="overflow-hidden rounded-[20px] shadow-lg border-4 border-white shrink-0 relative bg-gray-200 w-28 sm:w-36 aspect-[4/5]">
                <div className="absolute top-2 left-2 bg-black text-white font-black px-2 py-1 rounded-full text-[10px] shadow-md z-10">{season}기</div>
                <img src={selectedProfile.img || 'https://via.placeholder.com/400x500?text=No+Image'} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex flex-col justify-center flex-1">
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter break-keep">
                  {selectedProfile.name}
                </h2>
                {selectedProfile.age && <p className="text-sm sm:text-base font-bold text-gray-400 mt-1">{selectedProfile.age}</p>}
                <p className="text-pink-500 font-black text-xl sm:text-2xl mt-2">{selectedProfile.job || '직업 미상'}</p>
              </div>
            </div>
            
            <div className="mt-6 sm:mt-8 pb-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 p-4 sm:p-5 rounded-[24px] border border-gray-100"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">나이</span><p className="font-black text-gray-800 text-sm sm:text-base">{selectedProfile.age || '-'}</p></div>
                <div className="bg-gray-50 p-4 sm:p-5 rounded-[24px] border border-gray-100"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">출생연도</span><p className="font-black text-gray-800 text-sm sm:text-base">{selectedProfile.birth_year || '-'}</p></div>
                <div className="col-span-2 bg-gray-50 p-4 sm:p-5 rounded-[24px] border border-gray-100"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">거주지</span><p className="font-black text-gray-800 text-sm sm:text-base line-clamp-2">{selectedProfile.location || '-'}</p></div>
                <div className="col-span-2 bg-gray-50 p-4 sm:p-5 rounded-[24px] border border-gray-100"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">소속 / 직책</span><p className="font-black text-gray-800 text-sm sm:text-base">{selectedProfile.company || '-'}{selectedProfile.position && ` / ${selectedProfile.position}`}</p></div>
                <div className="col-span-2 bg-gray-50 p-4 sm:p-5 rounded-[24px] border border-gray-100"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">학력</span><p className="font-black text-gray-800 text-sm sm:text-base">{selectedProfile.education || '-'}</p></div>
                <div className="col-span-2 bg-gray-50 p-4 sm:p-5 rounded-[24px] border border-gray-100"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">취미 및 특기</span><p className="font-black text-gray-800 text-sm sm:text-base whitespace-pre-wrap">{selectedProfile.hobbies || '-'}</p></div>
                {selectedProfile.others && (
                  <div className="col-span-2 bg-gray-50 p-4 sm:p-5 rounded-[24px] border border-gray-100"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">기타 정보</span><p className="font-black text-gray-800 text-sm sm:text-base whitespace-pre-wrap">{selectedProfile.others}</p></div>
                )}
              </div>

              {selectedProfile.quote && (
                <div className="bg-gradient-to-br from-pink-50 to-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] mt-8 border border-pink-100 text-center shadow-inner relative">
                  <span className="text-4xl text-pink-200 absolute top-4 left-4 font-serif">"</span>
                  <p className="text-gray-700 font-bold text-lg sm:text-xl italic break-keep leading-relaxed relative z-10 px-4 pt-4">{selectedProfile.quote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 게시글 상세보기 패널 */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePostModal} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] sm:rounded-[56px] shadow-2xl p-6 sm:p-10 flex flex-col max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 sm:pb-6">
              <span className="text-xs font-black text-gray-300 tracking-widest uppercase">BOARD_READING</span>
              <div className="flex items-center gap-2 sm:gap-4">
                {(getMyItems('my_posts').includes(selectedPost.id) || isAdmin) && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setWriteModal({ isOpen: true, isEdit: true, postId: selectedPost.id, author: selectedPost.author, title: selectedPost.title, content: selectedPost.content })} className="text-sm font-black px-3 py-2 bg-gray-100 rounded-xl text-gray-500 hover:text-pink-500 transition-colors">수정</button>
                    <button onClick={() => handleDeletePost(selectedPost.id)} className="text-sm font-black px-3 py-2 bg-gray-100 rounded-xl text-gray-500 hover:text-red-500 transition-colors">삭제</button>
                  </div>
                )}
                <button onClick={closePostModal} className="p-2 sm:p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><IconX /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pt-6 sm:pt-8 pr-2 scrollbar-hide">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 leading-tight tracking-tighter break-keep">{selectedPost.title}</h2>
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-50">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-200"><IconUser /></div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-gray-800">{selectedPost.author} {isAdmin && <span className="text-[10px] text-pink-500 bg-pink-50 px-2 py-1 rounded ml-2">관리자</span>}</span>
                  <span className="text-[10px] text-gray-400 font-bold mt-1 tracking-widest uppercase">{selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString() : ''} WRITTEN</span>
                </div>
              </div>
              
              <div className="whitespace-pre-wrap text-gray-700 leading-loose text-lg min-h-[150px] break-words">{selectedPost.content}</div>
              
              <div className="flex justify-center pt-8 border-t border-gray-100 mt-12 mb-4">
                <button onClick={handleLikePost} className="py-3 px-8 bg-white text-pink-500 border border-pink-200 font-black text-base rounded-full flex items-center justify-center gap-3 shadow-sm hover:bg-pink-50 hover:border-pink-300 active:scale-95 transition-all">
                  <IconHeart /> 응원해요 {selectedPost.likes || 0}
                </button>
              </div>
              <CommentSection postId={selectedPost.id} isAdmin={isAdmin} showConfirm={showConfirm} />
            </div>
          </div>
        </div>
      )}

      {/* 게시글 작성/수정 모달 */}
      {writeModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={()=>setWriteModal({isOpen:false})} />
          <div className="relative bg-white w-full max-w-2xl rounded-[56px] p-8 sm:p-12 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <h3 className="text-3xl sm:text-4xl font-black mb-10 text-gray-900 tracking-tighter text-center">{writeModal.isEdit ? '글 수정하기' : '새 게시글 쓰기'}</h3>
            <div className="space-y-6 overflow-y-auto pr-2 scrollbar-hide">
              <div className="space-y-2"><span className="text-[10px] font-black text-gray-400 ml-6 uppercase">USERNAME</span><input type="text" placeholder="닉네임 (미입력 시 익명)" value={writeModal.author} onChange={e=>setWriteModal({...writeModal, author:e.target.value})} className="w-full bg-gray-50 border-none p-5 rounded-[24px] outline-none focus:ring-4 focus:ring-pink-100 font-black transition-all" /></div>
              <div className="space-y-2"><span className="text-[10px] font-black text-gray-400 ml-6 uppercase">TITLE</span><input type="text" placeholder="제목을 입력해주세요" value={writeModal.title} onChange={e=>setWriteModal({...writeModal, title:e.target.value})} className="w-full bg-gray-50 border-none p-5 rounded-[24px] outline-none focus:ring-4 focus:ring-pink-100 font-black transition-all" /></div>
              <div className="space-y-2"><span className="text-[10px] font-black text-gray-400 ml-6 uppercase">CONTENT</span><textarea placeholder="자유롭게 이야기를 남겨주세요." value={writeModal.content} onChange={e=>setWriteModal({...writeModal, content:e.target.value})} className="w-full bg-gray-50 border-none p-6 rounded-[32px] min-h-[250px] outline-none focus:ring-4 focus:ring-pink-100 font-medium text-base leading-relaxed transition-all" /></div>
            </div>
            <div className="flex gap-4 mt-10"><button onClick={()=>setWriteModal({isOpen:false})} className="flex-1 py-5 bg-gray-100 font-black rounded-[24px] text-gray-400">취소</button><button onClick={handleSavePost} className="flex-1 py-5 bg-gray-900 text-white font-black rounded-[24px] shadow-2xl active:scale-95 transition-all">{writeModal.isEdit ? '수정 완료' : '등록하기'}</button></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        select { appearance: none; -webkit-appearance: none; }
        body { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}