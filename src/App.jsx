import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, query, addDoc } from 'firebase/firestore';
import CommentSection from './CommentSection.jsx';

// --- Firebase 초기화 ---
const firebaseConfig = {
  apiKey: "AIzaSyAgtjiwYvdLjjoY2fUogrdrg5MVezQw4K8",
  authDomain: "iamsolofan.firebaseapp.com",
  projectId: "iamsolofan",
  storageBucket: "iamsolofan.firebasestorage.app",
  messagingSenderId: "665054893490",
  appId: "1:665054893490:web:3f9e6251058b3fe33f80ab",
  measurementId: "G-P6L3B2R5NG"
};

// 파이어베이스 앱 및 서비스 초기화
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase 초기화 에러:", e);
}

const appId = "nasol-fan-v1"; // 앱 식별자

// --- SEO 메타 태그 설정 헬퍼 함수 ---
const setMetaTag = (attrName, attrValue, content) => {
  let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  meta.content = content;
};

// --- 아이콘 컴포넌트 (SVG) ---
const IconHeart = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconRefresh = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconAlert = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

// --- 7:7 총 14명 출연진 초기 데이터 ---
const INITIAL_CAST_DATA = [
  // 남성 7명 (영수, 영호, 영식, 영철, 광수, 상철, 경수)
  { id: 'M1', name: '영수', gender: 'M', age: '미입력', job: '미입력', quote: '진정한 사랑을 찾으러 왔습니다', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
  { id: 'M2', name: '영호', gender: 'M', age: '미입력', job: '미입력', quote: '첫인상이 가장 중요하죠', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
  { id: 'M3', name: '영식', gender: 'M', age: '미입력', job: '미입력', quote: '솔직한 매력으로 다가가겠습니다', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { id: 'M4', name: '영철', gender: 'M', age: '미입력', job: '미입력', quote: '강한 추진력의 소유자', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
  { id: 'M5', name: '광수', gender: 'M', age: '미입력', job: '미입력', quote: '지적인 매력을 보여드릴게요', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80' },
  { id: 'M6', name: '상철', gender: 'M', age: '미입력', job: '미입력', quote: '배려가 몸에 밴 남자', img: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=400&q=80' },
  { id: 'M7', name: '경수', gender: 'M', age: '미입력', job: '미입력', quote: '운동으로 다져진 건강한 정신', img: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=400&q=80' },
  // 여성 7명 (영숙, 정숙, 순자, 영자, 옥순, 현숙, 정희)
  { id: 'F1', name: '영숙', gender: 'F', age: '미입력', job: '미입력', quote: '단아한 매력의 영숙입니다', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { id: 'F2', name: '정숙', gender: 'F', age: '미입력', job: '미입력', quote: '똑 부러지는 성격이에요', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { id: 'F3', name: '순자', gender: 'F', age: '미입력', job: '미입력', quote: '흥이 넘치는 순자입니다', img: 'https://images.unsplash.com/photo-1507152832244-10d45a7eda52?auto=format&fit=crop&w=400&q=80' },
  { id: 'F4', name: '영자', gender: 'F', age: '미입력', job: '미입력', quote: '밝은 에너지를 전해드려요', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { id: 'F5', name: '옥순', gender: 'F', age: '미입력', job: '미입력', quote: '나솔의 꽃, 옥순입니다', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
  { id: 'F6', name: '현숙', gender: 'F', age: '미입력', job: '미입력', quote: '미소가 아름다운 여자', img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80' },
  { id: 'F7', name: '정희', gender: 'F', age: '미입력', job: '미입력', quote: '새로운 사랑을 꿈꿉니다', img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80' }
];

export default function App() {
  const [season, setSeason] = useState(31);
  const [activeTab, setActiveTab] = useState('coupleVote');
  const [availableSeasons, setAvailableSeasons] = useState([31]);
  const [castData, setCastData] = useState(INITIAL_CAST_DATA);
  const [coupleVotes, setCoupleVotes] = useState({});
  const [favoriteVotes, setFavoriteVotes] = useState({});
  const [villainVotes, setVillainVotes] = useState({});
  const [posts, setPosts] = useState([]);
  
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  const [hasVotedCouple, setHasVotedCouple] = useState(false);
  const [hasVotedFavoriteM, setHasVotedFavoriteM] = useState(false);
  const [hasVotedFavoriteF, setHasVotedFavoriteF] = useState(false);
  const [hasVotedVillain, setHasVotedVillain] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState([]);

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [writeModal, setWriteModal] = useState({ isOpen: false, isEdit: false, postId: null, title: '', author: '', content: '' });
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [castEditModal, setCastEditModal] = useState({ isOpen: false, data: null });
  const [firstCouplePick, setFirstCouplePick] = useState(null);

  // 1. SEO 최적화 및 탭 설정 (구글, 네이버 노출 강화)
  useEffect(() => {
    let tabLabel = '';
    switch(activeTab) {
      case 'coupleVote': tabLabel = '선호 커플 투표'; break;
      case 'favoriteVote': tabLabel = '가장 호감가는 출연자'; break;
      case 'villainVote': tabLabel = '최고 빌런 투표'; break;
      case 'profile': tabLabel = '출연진 정보 및 프로필'; break;
      case 'board': tabLabel = '자유 게시판 및 방송 리뷰'; break;
      default: tabLabel = '팬 커뮤니티';
    }
    
    // Title 설정
    const siteTitle = `나는솔로팬이다 | ${season}기 ${tabLabel}`;
    document.title = siteTitle;

    // 출연진 이름을 키워드로 활용
    const castNames = castData.map(c => c.name).join(', ');
    const descContent = `나는 솔로 ${season}기 팬들을 위한 커뮤니티입니다. ${tabLabel}에 참여하고 ${castNames} 등 매력적인 출연진들의 프로필을 확인해보세요! 실시간 투표와 리뷰 게시판을 제공합니다.`;
    const keywordsContent = `나는솔로, 나는 솔로, ${season}기, 나는솔로 ${season}기, 나는솔로 갤러리, 나는솔로 투표, ${castNames}, 나는솔로 팬카페, 나솔팬`;

    // 메타 태그 동적 삽입
    setMetaTag('name', 'description', descContent);
    setMetaTag('name', 'keywords', keywordsContent);
    setMetaTag('name', 'robots', 'index, follow'); // 크롤링 허용
    
    // 오픈 그래프(OG) 태그 (카톡, 페이스북 공유 시 최적화)
    setMetaTag('property', 'og:title', siteTitle);
    setMetaTag('property', 'og:description', descContent);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', '나는솔로팬이다');
  }, [season, activeTab, castData]);

  // 2. Firebase 인증
  useEffect(() => {
    if (!auth) {
      setAuthError("Firebase 설정 오류가 발생했습니다.");
      return;
    }

    let retryCount = 0;
    const maxRetries = 5;

    const performAuth = async () => {
      try {
        await signInAnonymously(auth);
        setAuthError(null);
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(performAuth, Math.pow(2, retryCount) * 1000);
        } else {
          setAuthError(`인증에 실패했습니다. 읽기 전용 모드로 실행됩니다.`);
          setUser({ uid: 'demo_user_fallback' });
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthError(null);
      } else {
        performAuth();
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Firestore 실시간 데이터 연동
  useEffect(() => {
    if (!user || !db || !season) return;

    try {
      const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_metadata', 'main');
      const unsubMeta = onSnapshot(metaRef, (snap) => {
        if (snap.exists() && snap.data().seasons) setAvailableSeasons(snap.data().seasons.sort((a,b)=>b-a));
        else setDoc(metaRef, { seasons: [31] }, { merge: true });
      }, () => {});

      const castRef = doc(db, 'artifacts', appId, 'public', 'data', `season${season}_cast`, 'main');
      const unsubCast = onSnapshot(castRef, (snap) => {
        if (snap.exists()) setCastData(snap.data().castList || INITIAL_CAST_DATA);
        else setCastData(INITIAL_CAST_DATA);
      }, () => {});

      const votesRef = doc(db, 'artifacts', appId, 'public', 'data', `season${season}_votes`, 'main');
      const unsubVotes = onSnapshot(votesRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setCoupleVotes(d.coupleVotes || {});
          setFavoriteVotes(d.favoriteVotes || {}); 
          setVillainVotes(d.villainVotes || {});
        } else { 
          setCoupleVotes({}); 
          setFavoriteVotes({}); 
          setVillainVotes({}); 
        }
      }, () => {});

      const postsRef = collection(db, 'artifacts', appId, 'public', 'data', `season${season}_posts`);
      const unsubPosts = onSnapshot(postsRef, (s) => {
        const p = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(p.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      }, () => {});

      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'history', `season${season}`);
      const unsubUser = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setHasVotedCouple(d.votedCouple || false);
          setHasVotedFavoriteM(d.votedFavoriteM || false);
          setHasVotedFavoriteF(d.votedFavoriteF || false);
          setHasVotedVillain(d.votedVillain || false);
          setLikedPostIds(d.likedPosts || []);
        } else { 
          setHasVotedCouple(false); 
          setHasVotedFavoriteM(false); 
          setHasVotedFavoriteF(false); 
          setHasVotedVillain(false); 
          setLikedPostIds([]); 
        }
      }, () => {});

      return () => { unsubMeta(); unsubCast(); unsubVotes(); unsubPosts(); unsubUser(); };
    } catch (err) {
      console.error(err);
    }
  }, [user, season]);

  // --- 비즈니스 로직 함수 ---
  const showAlert = (m) => setModal({ isOpen: true, type: 'alert', message: m });
  const showConfirm = (m, c) => setModal({ isOpen: true, type: 'confirm', message: m, onConfirm: c });
  const openProfile = (p) => { setSelectedProfile(p); setIsPanelOpen(true); document.body.style.overflow = 'hidden'; };
  const closeProfile = () => { setIsPanelOpen(false); document.body.style.overflow = 'unset'; };

  const requireAuthAction = (actionFn) => {
    if (authError || user?.uid === 'demo_user_fallback') {
      showAlert("읽기 전용 모드에서는 글쓰기나 투표를 할 수 없습니다.");
      return;
    }
    actionFn();
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') { setIsAdmin(true); setShowAdminLogin(false); setAdminPassword(''); showAlert('운영자 인증 성공'); }
    else showAlert('비밀번호 오류');
  };

  const handleSaveCastEdit = () => {
    requireAuthAction(async () => {
      const list = castData.map(c => c.id === castEditModal.data.id ? castEditModal.data : c);
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `season${season}_cast`, 'main'), { castList: list }, { merge: true });
        const newSeasons = Array.from(new Set([...availableSeasons, season])).sort((a,b)=>b-a);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_metadata', 'main'), { seasons: newSeasons }, { merge: true });
        setCastEditModal({ isOpen: false }); showAlert('변경사항이 저장되었습니다.');
      } catch (e) { showAlert('에러 발생'); }
    });
  };

  const handleDeleteCast = (id, name) => {
    requireAuthAction(() => {
      showConfirm(`${name}님을 목록에서 삭제하시겠습니까?`, async () => {
        const list = castData.filter(c => c.id !== id);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `season${season}_cast`, 'main'), { castList: list }, { merge: true });
        showAlert('삭제되었습니다.');
      });
    });
  };

  const handleCoupleVote = (p2) => {
    requireAuthAction(async () => {
      if (hasVotedCouple) return showAlert('이미 이 기수의 선호 커플 투표에 참여하셨습니다.');
      
      const malePick = firstCouplePick.gender === 'M' ? firstCouplePick : p2;
      const femalePick = firstCouplePick.gender === 'F' ? firstCouplePick : p2;
      const key = `${malePick.name}_${femalePick.name}`;
      
      const newV = { ...coupleVotes, [key]: (coupleVotes[key] || 0) + 1 };
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `season${season}_votes`, 'main'), { coupleVotes: newV }, { merge: true });
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', `season${season}`), { votedCouple: true }, { merge: true });
        setFirstCouplePick(null); showAlert('투표 완료!');
      } catch (e) { showAlert('투표 에러'); }
    });
  };

  const handleFavoriteVote = (c) => {
    requireAuthAction(() => {
      const isMale = c.gender === 'M';
      if (isMale && hasVotedFavoriteM) return showAlert('이미 남성 호감도 투표에 참여하셨습니다.');
      if (!isMale && hasVotedFavoriteF) return showAlert('이미 여성 호감도 투표에 참여하셨습니다.');
      
      showConfirm(`${c.name}님에게 호감 간다고 투표하시겠습니까?`, async () => {
        const newV = { ...favoriteVotes, [c.id]: (favoriteVotes[c.id] || 0) + 1 };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `season${season}_votes`, 'main'), { favoriteVotes: newV }, { merge: true });
        
        const historyUpdate = isMale ? { votedFavoriteM: true } : { votedFavoriteF: true };
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', `season${season}`), historyUpdate, { merge: true });
        
        showAlert('투표 완료!');
      });
    });
  };

  const handleVillainVote = (c) => {
    requireAuthAction(() => {
      if (hasVotedVillain) return showAlert('이미 투표하셨습니다.');
      showConfirm(`${c.name}님께 투표하시겠습니까?`, async () => {
        const newV = { ...villainVotes, [c.id]: (villainVotes[c.id] || 0) + 1 };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `season${season}_votes`, 'main'), { villainVotes: newV }, { merge: true });
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', `season${season}`), { votedVillain: true }, { merge: true });
        showAlert('투표 완료!');
      });
    });
  };

  const handlePostSubmit = () => {
    requireAuthAction(async () => {
      const { title, author, content, isEdit, postId } = writeModal;
      if (!title || !author || !content) return showAlert('모든 내용을 입력하세요.');
      if (isEdit) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', `season${season}_posts`, postId), { title, author, content });
      else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', `season${season}_posts`), { title, author, content, timestamp: Date.now(), date: new Date().toLocaleDateString(), likes: 0, uid: user.uid });
      setWriteModal({ isOpen: false }); showAlert('반영되었습니다.');
    });
  };

  const handleLikePost = () => {
    requireAuthAction(async () => {
      if (!selectedPost) return;
      if (likedPostIds.includes(selectedPost.id)) return showAlert('이미 응원했습니다.');
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', `season${season}_posts`, selectedPost.id), { likes: selectedPost.likes + 1 });
      const newL = [...likedPostIds, selectedPost.id];
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', `season${season}`), { likedPosts: newL }, { merge: true });
      setSelectedPost(p => ({ ...p, likes: p.likes + 1 }));
    });
  };

  // --- 정렬 및 득표율 독립 계산 로직 ---
  const getSortedCoupleResults = () => {
    const total = Object.values(coupleVotes).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(coupleVotes).map(([k, v]) => {
      const [n1, n2] = k.split('_');
      const c1 = castData.find(c => c.name === n1);
      const c2 = castData.find(c => c.name === n2);
      
      const maleCast = c1?.gender === 'M' ? c1 : c2;
      const femaleCast = c1?.gender === 'F' ? c1 : c2;
      const displayName = maleCast && femaleCast ? `${maleCast.name} & ${femaleCast.name}` : k.replace('_', ' & ');

      return { k, name: displayName, img1: maleCast?.img || c1?.img, img2: femaleCast?.img || c2?.img, votes: v, percentage: ((v/total)*100).toFixed(1) };
    }).sort((a, b) => b.votes - a.votes).slice(0, 5);
  };

  // 호감도 투표 랭킹 (성별 완전 분리 연산)
  const getSortedFavoriteResults = (targetGender) => {
    const genderCastIds = castData.filter(c => c.gender === targetGender).map(c => c.id);
    const filteredVotes = Object.entries(favoriteVotes).filter(([id]) => genderCastIds.includes(id));
    const totalGenderVotes = filteredVotes.reduce((sum, [_, v]) => sum + v, 0) || 1;
    
    return filteredVotes.map(([id, v]) => {
      const cast = castData.find(c => c.id === id);
      return { id, name: cast?.name || '알 수 없음', img: cast?.img, votes: v, percentage: ((v/totalGenderVotes)*100).toFixed(1) };
    }).sort((a, b) => b.votes - a.votes).slice(0, 5);
  };

  // 빌런 투표 랭킹 (성별 완전 분리 연산)
  const getSortedVillainResults = (targetGender) => {
    const genderCastIds = castData.filter(c => c.gender === targetGender).map(c => c.id);
    const filteredVotes = Object.entries(villainVotes).filter(([id]) => genderCastIds.includes(id));
    const totalGenderVotes = filteredVotes.reduce((sum, [_, v]) => sum + v, 0) || 1;
    
    return filteredVotes.map(([id, v]) => {
      const cast = castData.find(c => c.id === id);
      return { id, name: cast?.name || '알 수 없음', img: cast?.img, votes: v, percentage: ((v/totalGenderVotes)*100).toFixed(1) };
    }).sort((a, b) => b.votes - a.votes).slice(0, 5);
  };

  // 득표율을 UI에서 개별 성별 기준으로 구하기 위한 도구 (투표 패널용)
  const getGenderTotalVotes = (votesObj, targetGender) => {
    const genderCastIds = castData.filter(c => c.gender === targetGender).map(c => c.id);
    return Object.entries(votesObj)
      .filter(([id]) => genderCastIds.includes(id))
      .reduce((sum, [_, v]) => sum + v, 0) || 1;
  };

  // --- 컴포넌트: 프로필 카드 ---
  const CastCard = ({ cast, onClick }) => (
    <div onClick={() => onClick(cast)} className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm border border-slate-100 bg-white aspect-square w-full transition-all duration-300 hover:shadow-md hover:border-rose-100">
      <img src={cast.img} alt={cast.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent flex items-end p-3 opacity-90 group-hover:opacity-100 transition-opacity">
        <span className="text-white font-semibold text-sm tracking-tight">{cast.name}</span>
      </div>
    </div>
  );

  if (!user && !authError) return <div className="min-h-screen flex items-center justify-center font-medium text-slate-500 bg-slate-50 tracking-tight">데이터 연결 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-rose-100 selection:text-rose-900">
      {authError && (
        <div className="bg-rose-50 text-rose-600 p-2 text-center text-xs font-medium flex items-center justify-center gap-2 border-b border-rose-100">
          <IconAlert /> {authError}
        </div>
      )}
      
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm shrink-0 transition-all">
        <div className="max-w-4xl mx-auto px-5 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-rose-500 tracking-tight flex items-center gap-2 cursor-default">
            <IconHeart /> 나는솔로팬이다
          </h1>
          <div className="flex items-center gap-2 bg-slate-100/80 px-4 py-1.5 rounded-full border border-slate-200/60">
            <span className="text-sm font-medium text-slate-600">기수</span>
            <select value={season} onChange={(e) => setSeason(Number(e.target.value))} className="bg-transparent text-slate-900 font-bold outline-none border-none cursor-pointer text-sm">
              {availableSeasons.map(s => <option key={s} value={s}>{s}기</option>)}
            </select>
          </div>
        </div>
        {/* 네비게이션 탭 */}
        <nav className="max-w-4xl mx-auto px-5 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { id: 'coupleVote', l: '💕 선호 커플은?' }, 
            { id: 'favoriteVote', l: '💖 호감 출연자는?' }, 
            { id: 'villainVote', l: '😈 최고 빌런은?' }, 
            { id: 'profile', l: '📸 출연진 정보' }, 
            { id: 'board', l: '💬 자유 게시판' }, 
            ...(isAdmin ? [{ id: 'admin', l: '⚙️ 관리자' }] : [])
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-2 px-5 text-sm font-medium rounded-full transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-800'}`}>{t.l}</button>
          ))}
        </nav>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-4xl mx-auto px-5 py-10 flex-1 w-full">
        
        {/* 선호 커플 탭 */}
        {activeTab === 'coupleVote' && (
          <div className="animate-fade-in space-y-8">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold mb-8 text-slate-800 tracking-tight">{season}기 선호 커플은?</h2>
              {!firstCouplePick ? (
                <div className="space-y-10">
                  {['M', 'F'].map(g => (
                    <div key={g}>
                      <h3 className="text-sm font-semibold mb-5 flex items-center gap-2 text-slate-700">
                        <span className={`w-2 h-2 rounded-full ${g === 'M' ? 'bg-blue-400' : 'bg-rose-400'}`}></span>
                        {g === 'M' ? '남성 출연자' : '여성 출연자'}
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                        {castData.filter(c => c.gender === g).map(c => (<CastCard key={c.id} cast={c} onClick={setFirstCouplePick}/>))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-full md:w-1/3 flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-400 mb-4 tracking-wider">선택한 주인공</p>
                    <div className="w-32"><CastCard cast={firstCouplePick} onClick={()=>{}}/></div>
                    <button onClick={()=>setFirstCouplePick(null)} className="mt-6 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-sm"><IconRefresh/> 다시 고르기</button>
                  </div>
                  <div className="flex-1 w-full">
                    <p className="text-rose-500 font-bold mb-6 text-lg tracking-tight">상대방을 매칭해 주세요</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
                      {castData.filter(c => c.gender !== firstCouplePick.gender).map(c => (<CastCard key={c.id} cast={c} onClick={() => handleCoupleVote(c)}/>))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-8 text-slate-800 tracking-tight">🏆 실시간 매칭 랭킹</h3>
              <div className="space-y-6">
                {getSortedCoupleResults().length > 0 ? getSortedCoupleResults().map((r, i) => (
                  <div key={i} className="flex items-center gap-5 group">
                    <span className="text-xl font-bold text-slate-300 w-6 text-center">{i+1}</span>
                    <div className="flex -space-x-3 transition-all"><img src={r.img1} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm z-10"/><img src={r.img2} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"/></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-slate-700">{r.name}</span>
                        <span className="text-rose-500">{r.votes}표 ({r.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="bg-rose-400 h-full transition-all duration-1000 ease-out" style={{width:`${r.percentage}%`}}/></div>
                    </div>
                  </div>
                )) : <div className="py-16 text-center text-sm font-medium text-slate-400">아직 매칭 결과가 없습니다.</div>}
              </div>
            </div>
          </div>
        )}

        {/* 💖 호감 출연자 탭 */}
        {activeTab === 'favoriteVote' && (
          <div className="animate-fade-in space-y-8">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-2 text-slate-800 tracking-tight">호감 출연자는?</h2>
              <p className="text-slate-500 text-sm font-medium mb-10">응원하고 싶거나 가장 매력적인 남녀 출연자에게 각각 1표씩 투표하세요.</p>
              {['M', 'F'].map(g => {
                const totalGenderVotes = getGenderTotalVotes(favoriteVotes, g);
                return (
                  <div key={g} className="mt-10 first:mt-0">
                    <h3 className="text-sm font-semibold mb-5 flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3">
                      <span className={`w-2 h-2 rounded-full ${g === 'M' ? 'bg-blue-400' : 'bg-rose-400'}`}></span>
                      {g === 'M' ? '남성 출연자 부문' : '여성 출연자 부문'}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {castData.filter(c=>c.gender===g).map(c => {
                        const v = favoriteVotes[c.id] || 0;
                        return (
                          <div key={c.id} className="text-center">
                            <CastCard cast={c} onClick={() => handleFavoriteVote(c)} />
                            <div className="mt-3 space-y-1">
                              <p className="text-sm font-semibold text-slate-800">{v}표</p>
                              <p className={`text-[10px] font-medium rounded-full px-2 py-0.5 inline-block ${g === 'M' ? 'text-blue-500 bg-blue-50' : 'text-rose-500 bg-rose-50'}`}>{((v/totalGenderVotes)*100).toFixed(1)}%</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-8 text-slate-800 tracking-tight">💖 실시간 호감도 랭킹</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* 남성 랭킹 */}
                <div>
                  <h4 className="text-sm font-semibold mb-6 flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3"><span className="w-2 h-2 rounded-full bg-blue-400"></span>남성 부문</h4>
                  <div className="space-y-6">
                    {getSortedFavoriteResults('M').length > 0 ? getSortedFavoriteResults('M').map((r, i) => (
                      <div key={i} className="flex items-center gap-5 group">
                        <span className="text-xl font-bold text-slate-300 w-6 text-center">{i+1}</span>
                        <div className="relative"><img src={r.img} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"/></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm font-semibold mb-2"><span className="text-slate-700">{r.name}</span><span className="text-blue-500">{r.votes}표 ({r.percentage}%)</span></div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="bg-blue-400 h-full transition-all duration-1000 ease-out" style={{width:`${r.percentage}%`}}/></div>
                        </div>
                      </div>
                    )) : <div className="py-10 text-center text-sm font-medium text-slate-400">아직 투표 결과가 없습니다.</div>}
                  </div>
                </div>

                {/* 여성 랭킹 */}
                <div>
                  <h4 className="text-sm font-semibold mb-6 flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3"><span className="w-2 h-2 rounded-full bg-rose-400"></span>여성 부문</h4>
                  <div className="space-y-6">
                    {getSortedFavoriteResults('F').length > 0 ? getSortedFavoriteResults('F').map((r, i) => (
                      <div key={i} className="flex items-center gap-5 group">
                        <span className="text-xl font-bold text-slate-300 w-6 text-center">{i+1}</span>
                        <div className="relative"><img src={r.img} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"/></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm font-semibold mb-2"><span className="text-slate-700">{r.name}</span><span className="text-rose-500">{r.votes}표 ({r.percentage}%)</span></div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="bg-rose-400 h-full transition-all duration-1000 ease-out" style={{width:`${r.percentage}%`}}/></div>
                        </div>
                      </div>
                    )) : <div className="py-10 text-center text-sm font-medium text-slate-400">아직 투표 결과가 없습니다.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 빌런 투표 탭 */}
        {activeTab === 'villainVote' && (
          <div className="animate-fade-in space-y-8">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-2 text-slate-800 tracking-tight">이번 기수 최고 빌런은?</h2>
              <p className="text-slate-500 text-sm font-medium mb-10">가장 인상 깊었던 활약을 펼친 인물에게 투표하세요.</p>
              {['M', 'F'].map(g => {
                const totalGenderVotes = getGenderTotalVotes(villainVotes, g);
                return (
                  <div key={g} className="mt-10 first:mt-0">
                    <h3 className="text-sm font-semibold mb-5 flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3">
                      <span className={`w-2 h-2 rounded-full ${g === 'M' ? 'bg-blue-400' : 'bg-slate-800'}`}></span>
                      {g === 'M' ? '남성 출연자 부문' : '여성 출연자 부문'}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {castData.filter(c=>c.gender===g).map(c => {
                        const v = villainVotes[c.id] || 0;
                        return (
                          <div key={c.id} className="text-center">
                            <CastCard cast={c} onClick={() => handleVillainVote(c)} />
                            <div className="mt-3 space-y-1">
                              <p className="text-sm font-semibold text-slate-800">{v}표</p>
                              <p className="text-[10px] text-slate-500 font-medium bg-slate-100 rounded-full px-2 py-0.5 inline-block">{((v/totalGenderVotes)*100).toFixed(1)}%</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 실시간 빌런 랭킹 */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-8 text-slate-800 tracking-tight">😈 실시간 최고 빌런 랭킹</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* 남성 랭킹 */}
                <div>
                  <h4 className="text-sm font-semibold mb-6 flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3"><span className="w-2 h-2 rounded-full bg-blue-400"></span>남성 부문</h4>
                  <div className="space-y-6">
                    {getSortedVillainResults('M').length > 0 ? getSortedVillainResults('M').map((r, i) => (
                      <div key={i} className="flex items-center gap-5 group">
                        <span className="text-xl font-bold text-slate-300 w-6 text-center">{i+1}</span>
                        <div className="relative"><img src={r.img} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"/></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm font-semibold mb-2"><span className="text-slate-700">{r.name}</span><span className="text-blue-500">{r.votes}표 ({r.percentage}%)</span></div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="bg-blue-400 h-full transition-all duration-1000 ease-out" style={{width:`${r.percentage}%`}}/></div>
                        </div>
                      </div>
                    )) : <div className="py-10 text-center text-sm font-medium text-slate-400">아직 투표 결과가 없습니다.</div>}
                  </div>
                </div>

                {/* 여성 랭킹 */}
                <div>
                  <h4 className="text-sm font-semibold mb-6 flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3"><span className="w-2 h-2 rounded-full bg-slate-800"></span>여성 부문</h4>
                  <div className="space-y-6">
                    {getSortedVillainResults('F').length > 0 ? getSortedVillainResults('F').map((r, i) => (
                      <div key={i} className="flex items-center gap-5 group">
                        <span className="text-xl font-bold text-slate-300 w-6 text-center">{i+1}</span>
                        <div className="relative"><img src={r.img} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"/></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm font-semibold mb-2"><span className="text-slate-700">{r.name}</span><span className="text-slate-800">{r.votes}표 ({r.percentage}%)</span></div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="bg-slate-800 h-full transition-all duration-1000 ease-out" style={{width:`${r.percentage}%`}}/></div>
                        </div>
                      </div>
                    )) : <div className="py-10 text-center text-sm font-medium text-slate-400">아직 투표 결과가 없습니다.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 출연진 프로필 탭 */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in space-y-12">
            {['M', 'F'].map(g => (
              <div key={g} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold mb-8 flex items-center gap-3 text-slate-800">
                  <span className={`w-3 h-3 rounded-sm ${g === 'M' ? 'bg-blue-400' : 'bg-rose-400'}`}></span>
                  {g === 'M' ? '남성 출연자' : '여성 출연자'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                  {castData.filter(c=>c.gender===g).map(c => (
                    <div key={c.id} onClick={() => openProfile(c)} className="bg-slate-50 rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group">
                      <div className="overflow-hidden aspect-square bg-slate-200">
                        <img src={c.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-4 sm:p-5 text-center">
                        <p className="font-bold text-slate-800 tracking-tight">{c.name}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1 truncate">{c.job}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 게시판 탭 */}
        {activeTab === 'board' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">자유 게시판</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">방송 후기나 다양한 의견을 남겨주세요.</p>
              </div>
              <button onClick={()=> requireAuthAction(() => setWriteModal({isOpen:true, isEdit:false, author:'', title:'', content:''}))} className="bg-slate-900 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"><IconEdit/> 글쓰기</button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
              {posts.map(p => (
                <div key={p.id} onClick={()=>{setSelectedPost(p); document.body.style.overflow='hidden';}} className="p-6 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors">
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-base sm:text-lg text-slate-800 mb-1.5 truncate">{p.title}</h3>
                    <p className="text-xs text-slate-400 font-medium">{p.author} <span className="mx-2 opacity-50">|</span> {p.date}</p>
                  </div>
                  <span className="text-rose-500 font-medium text-xs bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100 whitespace-nowrap">♥ {p.likes}</span>
                </div>
              ))}
              {posts.length === 0 && <div className="py-24 text-center font-medium text-slate-400 text-sm">등록된 글이 없습니다. 첫 글을 남겨주세요!</div>}
            </div>
          </div>
        )}

        {/* 운영자 탭 */}
        {activeTab === 'admin' && isAdmin && (
          <div className="animate-fade-in bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 pb-6 gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><IconSettings /> 데이터 관리</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  showConfirm('출연진 명단을 14명 기본값으로 덮어씌울까요? (기존에 수정한 데이터가 사라집니다.)', async () => {
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `season${season}_cast`, 'main'), { castList: INITIAL_CAST_DATA }, { merge: true });
                    showAlert('14명 기본 명단으로 초기화되었습니다.');
                  });
                }} className="text-xs bg-rose-50 text-rose-600 px-3 py-2 rounded-lg font-bold border border-rose-100 hover:bg-rose-100 transition-colors shadow-sm whitespace-nowrap">명단 초기화</button>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 px-2">편집 기수</span>
                  <input type="number" value={season} onChange={e=>setSeason(Number(e.target.value)||1)} className="w-16 bg-white border border-slate-200 rounded-lg text-center p-1.5 font-semibold text-sm outline-none focus:border-rose-400" />
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100 mt-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {castData.map(c => (
                <div key={c.id} className="py-4 flex justify-between items-center hover:bg-slate-50 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={c.img} className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"/>
                    <div><p className="font-semibold text-slate-800">{c.name}</p><p className="text-xs text-slate-400 font-medium mt-0.5">{c.job}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>setCastEditModal({isOpen:true, data:{...c}})} className="text-xs font-medium bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">수정</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="mt-auto py-10 text-center border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        {!isAdmin ? <button onClick={()=>setShowAdminLogin(true)} className="text-xs font-medium text-slate-300 hover:text-slate-500 transition-colors">운영자 로그인</button> : <p className="text-xs text-rose-400 font-medium">관리자 모드 활성화됨</p>}
      </footer>

      {/* --- 모달 및 패널 --- */}
      {/* Alert / Confirm 모달 */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" />
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-fade-in">
            <p className="font-medium text-slate-800 text-base mb-8 leading-relaxed break-keep">{modal.message}</p>
            <div className="flex gap-3">
              {modal.type === 'confirm' && <button onClick={() => setModal({ isOpen: false })} className="flex-1 py-3.5 bg-slate-100 font-medium rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">취소</button>}
              <button onClick={() => { modal.onConfirm?.(); setModal({ isOpen: false }) }} className="flex-1 py-3.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 출연진 프로필 상세 (슬라이드 패널) */}
      {selectedProfile && isPanelOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={closeProfile} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-slide-in">
            <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-gradient-to-b from-white via-white to-transparent">
              <span className="text-xs font-bold text-slate-400 tracking-wider">PROFILE</span>
              <button onClick={closeProfile} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"><IconX /></button>
            </div>
            <div className="px-8 pb-10">
              <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100 aspect-square mb-8">
                <img src={selectedProfile.img} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{selectedProfile.name}</h2>
              <p className="text-rose-500 font-medium text-lg mt-1">{selectedProfile.job}</p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400 font-medium mb-1">성별</span>
                  <p className="font-semibold text-slate-800">{selectedProfile.gender==='M'?'남성':'여성'}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400 font-medium mb-1">나이</span>
                  <p className="font-semibold text-slate-800">{selectedProfile.age}</p>
                </div>
              </div>
              <div className="bg-rose-50/50 p-6 rounded-2xl mt-6 border border-rose-100/50 text-center">
                <p className="text-slate-700 font-medium text-lg italic break-keep leading-relaxed">{selectedProfile.quote}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 상세 (슬라이드 패널) */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={()=>{setSelectedPost(null); document.body.style.overflow='unset';}} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 tracking-wider">POST</span>
              <div className="flex items-center gap-4">
                {user && selectedPost.uid === user.uid && <button onClick={() => setWriteModal({ isOpen: true, isEdit: true, postId: selectedPost.id, ...selectedPost })} className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors">수정</button>}
                <button onClick={() => { setSelectedPost(null); document.body.style.overflow = 'unset'; }} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"><IconX /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 sm:p-10 scrollbar-hide">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 leading-snug tracking-tight">{selectedPost.title}</h2>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><IconUser /></div>
                <div>
                  <span className="block text-sm font-bold text-slate-700">{selectedPost.author}</span>
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5">{selectedPost.date}</span>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-slate-700 leading-loose text-base min-h-[300px] break-words">{selectedPost.content}</div>
            </div>
            <CommentSection />
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button onClick={handleLikePost} className="w-full py-4 bg-rose-500 text-white font-medium text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors shadow-sm"><IconHeart /> 이 글 응원하기 ({selectedPost.likes})</button>
            </div>
          </div>
        </div>
      )}

      {/* 글쓰기 / 수정 모달 */}
      {writeModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={()=>setWriteModal({isOpen:false})} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl p-8 sm:p-10 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <h3 className="text-xl sm:text-2xl font-bold mb-8 text-slate-800 tracking-tight">{writeModal.isEdit ? '게시글 수정' : '새 글 작성'}</h3>
            <div className="space-y-5 overflow-y-auto pr-2 scrollbar-hide">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">닉네임</label>
                <input type="text" placeholder="작성자 이름" value={writeModal.author} onChange={e=>setWriteModal({...writeModal, author:e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-rose-400 focus:bg-white transition-all text-sm font-medium text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">제목</label>
                <input type="text" placeholder="게시글 제목" value={writeModal.title} onChange={e=>setWriteModal({...writeModal, title:e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-rose-400 focus:bg-white transition-all text-sm font-medium text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">내용</label>
                <textarea placeholder="자유롭게 이야기를 나누어 보세요." value={writeModal.content} onChange={e=>setWriteModal({...writeModal, content:e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl min-h-[200px] outline-none focus:border-rose-400 focus:bg-white transition-all text-sm font-medium text-slate-800 leading-relaxed resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={()=>setWriteModal({isOpen:false})} className="flex-1 py-3.5 bg-slate-100 font-medium rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handlePostSubmit} className="flex-1 py-3.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm">{writeModal.isEdit ? '수정 완료' : '등록하기'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 운영자 인증 모달 */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={()=>setShowAdminLogin(false)} />
          <div className="relative bg-white p-10 rounded-3xl w-full max-w-sm text-center shadow-2xl animate-fade-in">
            <div className="flex justify-center mb-4 text-slate-400"><IconSettings /></div>
            <h3 className="text-xl font-bold mb-8 text-slate-800 tracking-tight">관리자 인증</h3>
            <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-center mb-6 outline-none focus:border-rose-400 text-lg tracking-widest text-slate-800" placeholder="비밀번호" onKeyDown={e=>e.key==='Enter'&&handleAdminLogin()}/>
            <button onClick={handleAdminLogin} className="w-full py-4 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm">접속하기</button>
          </div>
        </div>
      )}

      {/* 데이터 편집 모달 (운영자) */}
      {castEditModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={()=>setCastEditModal({isOpen:false})} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl p-8 sm:p-10 flex flex-col shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-8 text-slate-800 border-b border-slate-100 pb-4">{season}기 출연진 정보 수정</h3>
            <div className="space-y-5 overflow-y-auto pr-2 scrollbar-hide">
              <div className="flex gap-4">
                <div className="flex-[1]">
                  <label className="block text-xs font-bold text-slate-500 mb-2">이름</label>
                  <input type="text" value={castEditModal.data?.name || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, name:e.target.value}})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:border-rose-400" />
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-bold text-slate-500 mb-2">이미지 URL</label>
                  <input type="text" value={castEditModal.data?.img || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, img:e.target.value}})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:border-rose-400" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-2">나이</label>
                  <input type="text" value={castEditModal.data?.age || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, age:e.target.value}})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:border-rose-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-2">직업</label>
                  <input type="text" value={castEditModal.data?.job || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, job:e.target.value}})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:border-rose-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">소개 멘트</label>
                <input type="text" value={castEditModal.data?.quote || ''} onChange={e=>setCastEditModal({...castEditModal, data:{...castEditModal.data, quote:e.target.value}})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:border-rose-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={()=>setCastEditModal({isOpen:false})} className="flex-1 py-3.5 bg-slate-100 font-medium rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handleSaveCastEdit} className="flex-1 py-3.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm">저장하기</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
          </div>
  );
}