import { useState } from 'react';

export default function CommentSection() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim() === '') return;
    
    // 새 댓글 추가 (최신 댓글이 위로 오도록)
    setComments([{ id: Date.now(), text: newComment }, ...comments]);
    setNewComment(''); // 입력창 비우기
  };

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-bold mb-4 text-gray-800">댓글 {comments.length}개</h3>
      
      {/* 댓글 입력창 */}
      <form onSubmit={handleAddComment} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="출연자들을 향한 따뜻한 댓글을 남겨주세요!"
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button 
          type="submit" 
          className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 font-semibold"
        >
          등록
        </button>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <p className="text-gray-700">{comment.text}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-gray-500 text-center py-4">첫 번째 댓글을 남겨보세요!</p>
        )}
      </div>
    </div>
  );
}