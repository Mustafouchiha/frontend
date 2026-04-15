import { useState, useEffect } from "react";
import { C } from "./constants";
import { productsAPI } from "./services/api";
import { BtnPrimary, BtnGhost, Sheet } from "./components/UI";
import { CheckCircle, XCircle, ArrowLeft, Package, MapPin, User, Phone } from "lucide-react";

export default function OperatorPostView({ postId, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        // Get all products and find the specific one
        const allProducts = await productsAPI.getAll();
        const targetPost = allProducts.find(p => p.id === postId);
        setPost(targetPost);
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId]);

  const handleApprove = async () => {
    if (!post) return;
    
    setActionLoading(true);
    try {
      await productsAPI.updatePostStatus(post.id, 'approved');
      setPost(prev => ({ ...prev, status: 'approved' }));
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!post) return;
    
    const reason = prompt('Rad etish sababini kiriting:');
    if (!reason) return;
    
    setActionLoading(true);
    try {
      await productsAPI.updatePostStatus(post.id, 'rejected');
      setPost(prev => ({ ...prev, status: 'rejected', rejectionReason: reason }));
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: C.bg 
      }}>
        <div>Yuklanmoqda...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: C.bg 
      }}>
        <div>Post topilmadi</div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "'Nunito','Segoe UI',sans-serif", 
      background: C.bg,
      minHeight: "100vh",
      padding: "16px"
    }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "12px", 
        marginBottom: "20px" 
      }}>
        <button 
          onClick={onClose}
          style={{ 
            background: "none", 
            border: "none", 
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center"
          }}
        >
          <ArrowLeft size={20} color={C.text} />
        </button>
        <h1 style={{ 
          margin: 0, 
          fontSize: "18px", 
          fontWeight: "800", 
          color: C.text 
        }}>
          Operator Post Ko'rish
        </h1>
      </div>

      {/* Status Badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
        marginBottom: "16px",
        background: post.status === 'approved' ? '#E8F8F0' : 
                   post.status === 'rejected' ? '#FFF1F0' : '#FFFBEB',
        color: post.status === 'approved' ? '#28A869' : 
                post.status === 'rejected' ? '#FF4D4F' : '#D97706'
      }}>
        {post.status === 'approved' && <CheckCircle size={14} />}
        {post.status === 'rejected' && <XCircle size={14} />}
        {post.status === 'pending' && <Package size={14} />}
        {post.status === 'approved' ? 'Tasdiqlangan' :
         post.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
      </div>

      {/* Post Content */}
      <div style={{
        background: C.card,
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "20px",
        border: `1px solid ${C.border}`
      }}>
        {/* Photo */}
        {post.photo && (
          <div style={{ 
            width: "100%", 
            height: "200px", 
            overflow: "hidden",
            background: "#000"
          }}>
            <img 
              src={post.photo} 
              alt={post.name}
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover" 
              }} 
            />
          </div>
        )}

        {/* Details */}
        <div style={{ padding: "16px" }}>
          <h2 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "18px", 
            fontWeight: "800", 
            color: C.text 
          }}>
            {post.name}
          </h2>
          
          <div style={{ 
            fontSize: "16px", 
            fontWeight: "700", 
            color: C.primaryDark, 
            marginBottom: "8px" 
          }}>
            {post.price?.toLocaleString()} so'm / {post.unit}
          </div>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "4px", 
            fontSize: "12px", 
            color: C.textSub, 
            marginBottom: "12px" 
          }}>
            <MapPin size={12} />
            {post.viloyat}{post.tuman ? `, ${post.tuman}` : ''}{post.mahalla ? `, ${post.mahalla}` : ''}
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "8px", 
            fontSize: "12px" 
          }}>
            <div style={{ 
              background: C.bg, 
              padding: "8px", 
              borderRadius: "8px",
              border: `1px solid ${C.border}`
            }}>
              <div style={{ color: C.textMuted, marginBottom: "2px" }}>Kategoriya</div>
              <div style={{ fontWeight: "700", color: C.text }}>{post.category}</div>
            </div>
            <div style={{ 
              background: C.bg, 
              padding: "8px", 
              borderRadius: "8px",
              border: `1px solid ${C.border}`
            }}>
              <div style={{ color: C.textMuted, marginBottom: "2px" }}>Miqdor</div>
              <div style={{ fontWeight: "700", color: C.text }}>{post.qty} {post.unit}</div>
            </div>
          </div>

          {/* Owner Info */}
          {post.owner && (
            <div style={{ 
              marginTop: "12px", 
              padding: "12px", 
              background: C.primaryLight, 
              borderRadius: "8px",
              border: `1px solid ${C.primaryBorder}`
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                marginBottom: "4px" 
              }}>
                <User size={14} color={C.primaryDark} />
                <span style={{ fontWeight: "700", color: C.text }}>{post.owner.name}</span>
              </div>
              {post.owner.phone && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px", 
                  fontSize: "12px", 
                  color: C.textSub 
                }}>
                  <Phone size={12} />
                  {post.owner.phone}
                </div>
              )}
            </div>
          )}

          {/* Rejection Reason */}
          {post.status === 'rejected' && post.rejectionReason && (
            <div style={{ 
              marginTop: "12px", 
              padding: "12px", 
              background: "#FFF1F0", 
              borderRadius: "8px",
              border: "1px solid #FFCCC7"
            }}>
              <div style={{ 
                fontSize: "12px", 
                color: "#CF1322", 
                fontWeight: "700", 
                marginBottom: "4px" 
              }}>
                Rad etish sababi:
              </div>
              <div style={{ fontSize: "12px", color: "#820014" }}>
                {post.rejectionReason}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {post.status === 'pending' && (
        <div style={{ display: "flex", gap: "12px" }}>
          <BtnGhost 
            onClick={handleReject}
            disabled={actionLoading}
            style={{ flex: 1 }}
          >
            {actionLoading ? '...' : <><XCircle size={16} /> Rad etish</>}
          </BtnGhost>
          <BtnPrimary 
            onClick={handleApprove}
            disabled={actionLoading}
            style={{ flex: 1 }}
          >
            {actionLoading ? '...' : <><CheckCircle size={16} /> Tasdiqlash</>}
          </BtnPrimary>
        </div>
      )}

      {post.status === 'approved' && (
        <div style={{
          padding: "16px",
          background: "#E8F8F0",
          borderRadius: "12px",
          textAlign: "center",
          color: "#28A869",
          fontWeight: "700"
        }}>
          ✅ Post tasdiqlangan va e'lon qilingan
        </div>
      )}

      {post.status === 'rejected' && (
        <div style={{
          padding: "16px",
          background: "#FFF1F0",
          borderRadius: "12px",
          textAlign: "center",
          color: "#CF1322",
          fontWeight: "700"
        }}>
          ❌ Post rad etilgan
        </div>
      )}
    </div>
  );
}
