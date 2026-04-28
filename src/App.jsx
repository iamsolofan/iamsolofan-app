import React, { useState, useEffect } from 'react';

// === 1. Supabase 연결 설정 (아무것도 설치할 필요 없는 가장 안전한 방식) ===
const supabaseUrl = 'https://gditohvmfxofuqbsbfhab.supabase.co';
const supabaseKey = 'sb_publishable_JuLu0N945MyR5VNoAaiJNA_Wrx9uQTG';

const supabaseHeaders = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// 금고(Supabase)와 안전하게 통신하는 함수 모음
const supabaseApi = {
  getPosts: async () => {
    const res = await fetch(`${supabaseUrl}/rest/v1/posts?select=*&order=created_at.desc`, { headers: supabaseHeaders });
    if (!res.ok) throw new Error('게시글을 불러올 수 없습니다.');
    return res.json();
  },
  insertPost: async (post) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/posts`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify(post)
    });
    if (!res.ok) throw new Error('게시글 작성에 실패했습니다.');
    return res.json();
  },
  updatePost: async (id, post) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${id}`, {
      method: 'PATCH',
      headers: supabaseHeaders,
      body: JSON.stringify(post)
    });
    if (!res.ok) throw new Error('게시글 수정에 실패했습니다.');
    return res.json();
  },
  getComments: async (postId) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/comments?post_id=eq.${postId}&select=*&order=created_at.desc`, { headers: supabaseHeaders });
    if (!res.ok) throw new Error('댓글을 불러올 수 없습니다.');
    return res.json();
  },
  insertComment: async (comment) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/comments`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify(comment)
    });
    if (!res.ok) throw new Error('댓글 작성에 실패했습니다.');
    return res.json();
  }
};

// === 2. 댓글창 컴포넌트 ===
function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (postId) fetchComments();
  }, [postId]);

  async function fetchComments() {
    try {
      const data = await supabaseApi.getComments(postId);
      setComments(data || []);
    } catch (error) {
      console.error(error.message);
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim() === '') return;
    
    try {
      await supabaseApi.insertComment({ post_id: postId, text: newComment, author: '익명' });
      setNewComment(''); 
      fetchComments();   
    } catch (error) {
      alert('댓글 저장에 실패했습니다.');
    }
  };

  return (
    <div className="mt-8 p-4 bg-slate-50 rounded-xl">
      <h3 className="text-lg font-bold mb-4 text-slate-800">댓글 {comments.length}개</h3>
      
      <form onSubmit={handleAddComment} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="출연자들을 향한 따뜻한 댓글을 남겨주세요!"
          className="flex-1 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium"
        />
        <button 
          type="submit" 
          className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 font-semibold whitespace-nowrap text-sm shadow-sm transition-colors"
        >
          등록
        </button>
      </form>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
            <p className="text-slate-700 text-sm leading-relaxed">{comment.text}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-slate-400 text-center py-6 text-sm font-medium">첫 번째 댓글을 남겨보세요!</p>
        )}
      </div>
    </div>
  );
}

// === 3. 메인 화면 (게시판) 컴포넌트 ===
export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [writeModal, setWriteModal] = useState({ isOpen: false, isEdit: false, postId: null, author: '', title: '', content: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      setLoading(true);
      const data = await supabaseApi.getPosts();
      setPosts(data || []);
    } catch (error) {
      console.error('게시글 불러오기 실패:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSavePost = async () => {
    if (!writeModal.title || !writeModal.content) {
      alert('제목과 내용을 모두 입력해주세요!');
      return;
    }

    try {
      if (writeModal.isEdit) {
        await supabaseApi.updatePost(writeModal.postId, { title: writeModal.title, content: writeModal.content });
      } else {
        await supabaseApi.insertPost({ title: writeModal.title, content: writeModal.content, author: writeModal.author || '익명' });
      }

      setWriteModal({ isOpen: false, isEdit: false, postId: null, author: '', title: '', content: '' });
      fetchPosts(); 
      
    } catch (error) {
      alert('게시글 저장에 실패했습니다.');
    }
  };

  const handleLikePost = async () => {
    if (!selectedPost) return;

    try {
      const newLikes = (selectedPost.likes || 0) + 1;
      await supabaseApi.updatePost(selectedPost.id, { likes: newLikes });

      setSelectedPost({ ...selectedPost, likes: newLikes });
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, likes: newLikes } : p));
    } catch (error) {
      console.error('좋아요 실패:', error.message);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      <main className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">자유 게시판</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">방송 후기나 다양한 의견을 남겨주세요.</p>
          </div>
          <button 
            onClick={() => setWriteModal({ isOpen: true, isEdit: false, author: '', title: '', content: '' })} 
            className="bg-pink-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold shadow-sm hover:bg-pink-600 hover:-translate-y-0.5 transition-all active:translate-y-0 text-sm sm:text-base whitespace-nowrap"
          >
            + 새 글 쓰기
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {loading ? (
             <div className="py-24 text-center font-medium text-slate-400 text-sm">금고에서 게시글을 불러오는 중입니다...</div>
          ) : posts.length === 0 ? (
             <div className="py-24 text-center font-medium text-slate-400 text-sm">등록된 글이 없습니다. 첫 글을 남겨주세요!</div>
          ) : (
            posts.map(p => (
              <div key={p.id} onClick={() => { setSelectedPost(p); document.body.style.overflow='hidden'; }} className="p-6 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors">
                <div className="flex-1 pr-4">
                  <h3 className="font-semibold text-base sm:text-lg text-slate-800 mb-1.5 truncate">{p.title}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {p.author} 
                    <span className="mx-2 opacity-50">|</span> 
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-rose-500 font-medium text-xs bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100 whitespace-nowrap">♥ {p.likes || 0}</span>
              </div>
            ))
          )}
        </div>
        
      </main>

      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => { setSelectedPost(null); document.body.style.overflow='unset'; }} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 tracking-wider">POST</span>
              <button onClick={() => { setSelectedPost(null); document.body.style.overflow = 'unset'; }} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors">닫기</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 sm:p-10 scrollbar-hide">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 leading-snug tracking-tight">{selectedPost.title}</h2>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">👤</div>
                <div>
                  <span className="block text-sm font-bold text-slate-700">{selectedPost.author}</span>
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5">{new Date(selectedPost.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-slate-700 leading-loose text-base min-h-[300px] break-words">{selectedPost.content}</div>
              
              <div className="flex items-center gap-4 px-8 py-4 border-t border-slate-100 mt-8">
                <button 
                  onClick={handleLikePost} 
                  className="flex items-center gap-2 text-rose-500 font-semibold hover:scale-110 transition-transform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  <span>{selectedPost.likes || 0}</span>
                </button>
                <span className="text-slate-400 text-sm">이 글이 마음에 드시나요?</span>
              </div>
              
              {/* 댓글창이 여기에 쏙 들어가 있습니다! */}
              <CommentSection postId={selectedPost.id} /> 
              
            </div>
          </div>
        </div>
      )}

      {writeModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setWriteModal({isOpen: false})} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl p-8 sm:p-10 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <h3 className="text-xl sm:text-2xl font-bold mb-8 text-slate-800 tracking-tight">{writeModal.isEdit ? '게시글 수정' : '새 글 작성'}</h3>
            <div className="space-y-5 overflow-y-auto pr-2 scrollbar-hide">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">닉네임</label>
                <input type="text" value={writeModal.author} onChange={e => setWriteModal({...writeModal, author: e.target.value})} placeholder="닉네임 (선택)" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">제목 <span className="text-rose-500">*</span></label>
                <input type="text" value={writeModal.title} onChange={e => setWriteModal({...writeModal, title: e.target.value})} placeholder="제목을 입력하세요" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">내용 <span className="text-rose-500">*</span></label>
                <textarea value={writeModal.content} onChange={e => setWriteModal({...writeModal, content: e.target.value})} placeholder="내용을 작성해주세요..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 h-64 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm font-medium leading-relaxed" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
              <button onClick={() => setWriteModal({isOpen: false})} className="px-6 py-3 rounded-2xl font-semibold text-slate-500 hover:bg-slate-100 transition-colors text-sm">취소</button>
              <button onClick={handleSavePost} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-semibold shadow-md hover:bg-slate-800 transition-all text-sm">등록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}